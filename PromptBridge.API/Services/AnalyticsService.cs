using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Data;
using PromptBridge.API.DTOs;
using PromptBridge.API.Models;

namespace PromptBridge.API.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly PromptBridgeContext _context;
        private readonly ILogger<AnalyticsService> _logger;

        public AnalyticsService(PromptBridgeContext context, ILogger<AnalyticsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<AnalyticsDto> GetUserAnalyticsAsync(int userId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            fromDate ??= DateTime.UtcNow.AddDays(-30);
            toDate ??= DateTime.UtcNow;

            var analytics = new AnalyticsDto
            {
                User = await GetUserAnalyticsDataAsync(userId, fromDate.Value, toDate.Value),
                ProviderPerformance = await GetProviderPerformanceComparisonAsync(userId),
                TopPipelines = await GetTopPerformingPipelinesAsync(userId),
                Usage = await GetUsageStatisticsAsync(userId, (toDate.Value - fromDate.Value).Days)
            };

            return analytics;
        }

        public async Task TrackPerformanceMetricAsync(int userId, int aiProviderId, string metricType, decimal value, string? unit = null, int? executionId = null, int? sessionId = null)
        {
            var metric = new PerformanceMetric
            {
                UserId = userId,
                AIProviderId = aiProviderId,
                MetricType = metricType,
                Value = value,
                Unit = unit,
                PipelineExecutionId = executionId,
                ChatSessionId = sessionId,
                CreatedAt = DateTime.UtcNow
            };

            _context.PerformanceMetrics.Add(metric);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ProviderPerformanceDto>> GetProviderPerformanceComparisonAsync(int userId)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            var performance = await _context.PerformanceMetrics
                .Include(m => m.AIProvider)
                .Where(m => m.UserId == userId && m.CreatedAt >= thirtyDaysAgo)
                .GroupBy(m => new { m.AIProviderId, m.AIProvider.Name })
                .Select(g => new ProviderPerformanceDto
                {
                    ProviderName = g.Key.Name,
                    AverageResponseTime = g.Where(m => m.MetricType == "RESPONSE_TIME").Average(m => m.Value),
                    AverageSatisfaction = g.Where(m => m.MetricType == "SATISFACTION").Average(m => m.Value),
                    SuccessRate = g.Where(m => m.MetricType == "SUCCESS_RATE").Average(m => m.Value),
                    TotalUsage = g.Count(),
                    EstimatedCost = g.Where(m => m.MetricType == "COST").Sum(m => m.Value)
                })
                .OrderByDescending(p => p.TotalUsage)
                .ToListAsync();

            return performance;
        }

        public async Task<Dictionary<int, decimal>> GetAIProviderRecommendationsAsync(int userId, string promptContext)
        {
            // Kullanıcının geçmiş performans verilerine göre öneri ver
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            
            var providerScores = await _context.PerformanceMetrics
                .Where(m => m.UserId == userId && m.CreatedAt >= thirtyDaysAgo)
                .GroupBy(m => m.AIProviderId)
                .Select(g => new
                {
                    ProviderId = g.Key,
                    Score = g.Where(m => m.MetricType == "SATISFACTION").Average(m => m.Value) * 0.4m +
                           (5m - g.Where(m => m.MetricType == "RESPONSE_TIME").Average(m => m.Value) / 1000m) * 0.3m +
                           g.Where(m => m.MetricType == "SUCCESS_RATE").Average(m => m.Value) * 0.3m
                })
                .ToDictionaryAsync(x => x.ProviderId, x => x.Score);

            // Context'e göre ayarlama yap
            await AdjustScoresForContext(providerScores, promptContext);

            return providerScores;
        }

        public async Task<List<PipelineAnalyticsDto>> GetTopPerformingPipelinesAsync(int userId)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            var pipelineAnalytics = await _context.PipelineExecutions
                .Include(e => e.Pipeline)
                .Where(e => e.UserId == userId && e.StartedAt >= thirtyDaysAgo)
                .GroupBy(e => new { e.PipelineId, e.Pipeline.Name })
                .Select(g => new PipelineAnalyticsDto
                {
                    PipelineId = g.Key.PipelineId,
                    PipelineName = g.Key.Name,
                    UsageCount = g.Count(),
                    AverageExecutionTime = (decimal)g.Average(e => e.TotalExecutionTimeMs ?? 0),
                    AverageSatisfaction = g.Where(e => e.UserSatisfactionScore.HasValue).Average(e => e.UserSatisfactionScore!.Value),
                    SuccessRate = (decimal)g.Count(e => e.Status == "Completed") / g.Count() * 100
                })
                .OrderByDescending(p => p.AverageSatisfaction)
                .ThenByDescending(p => p.UsageCount)
                .Take(10)
                .ToListAsync();

            return pipelineAnalytics;
        }

        public async Task<UsageStatisticsDto> GetUsageStatisticsAsync(int userId, int days = 30)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days);

            // Günlük kullanım
            var dailyUsage = await _context.PipelineExecutions
                .Where(e => e.UserId == userId && e.StartedAt >= fromDate)
                .GroupBy(e => e.StartedAt.Date)
                .ToDictionaryAsync(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count());

            // Chat mesajları da dahil et
            var dailyChatUsage = await _context.ChatMessages
                .Include(m => m.ChatSession)
                .Where(m => m.ChatSession.UserId == userId && m.CreatedAt >= fromDate && m.IsUserMessage)
                .GroupBy(m => m.CreatedAt.Date)
                .ToDictionaryAsync(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count());

            // Birleştir
            foreach (var chat in dailyChatUsage)
            {
                if (dailyUsage.ContainsKey(chat.Key))
                    dailyUsage[chat.Key] += chat.Value;
                else
                    dailyUsage[chat.Key] = chat.Value;
            }

            // Model kullanımı
            var modelUsage = await _context.PipelineSteps
                .Include(s => s.AIProvider)
                .Include(s => s.Execution)
                .Where(s => s.Execution.UserId == userId && s.StartedAt >= fromDate)
                .GroupBy(s => s.AIProvider.Name)
                .ToDictionaryAsync(g => g.Key, g => g.Count());

            // Chat'ten model kullanımı da ekle
            var chatModelUsage = await _context.ChatMessages
                .Include(m => m.AIProvider)
                .Include(m => m.ChatSession)
                .Where(m => m.ChatSession.UserId == userId && m.CreatedAt >= fromDate && !m.IsUserMessage && m.AIProvider != null)
                .GroupBy(m => m.AIProvider!.Name)
                .ToDictionaryAsync(g => g.Key, g => g.Count());

            foreach (var chat in chatModelUsage)
            {
                if (modelUsage.ContainsKey(chat.Key))
                    modelUsage[chat.Key] += chat.Value;
                else
                    modelUsage[chat.Key] = chat.Value;
            }

            // Maliyet breakdown (tahmini)
            var costBreakdown = await _context.PerformanceMetrics
                .Include(m => m.AIProvider)
                .Where(m => m.UserId == userId && m.CreatedAt >= fromDate && m.MetricType == "COST")
                .GroupBy(m => m.AIProvider.Name)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(m => m.Value));

            return new UsageStatisticsDto
            {
                DailyUsage = dailyUsage,
                ModelUsage = modelUsage,
                CostBreakdown = costBreakdown
            };
        }

        private async Task<UserAnalyticsDto> GetUserAnalyticsDataAsync(int userId, DateTime fromDate, DateTime toDate)
        {
            // Pipeline istekleri
            var pipelineRequests = await _context.PipelineExecutions
                .Where(e => e.UserId == userId && e.StartedAt >= fromDate && e.StartedAt <= toDate)
                .CountAsync();

            // Chat istekleri  
            var chatRequests = await _context.ChatMessages
                .Include(m => m.ChatSession)
                .Where(m => m.ChatSession.UserId == userId && m.CreatedAt >= fromDate && m.CreatedAt <= toDate && m.IsUserMessage)
                .CountAsync();

            var totalRequests = pipelineRequests + chatRequests;

            // Ortalama memnuniyet
            var avgSatisfactionQuery = await _context.PipelineExecutions
                .Where(e => e.UserId == userId && e.StartedAt >= fromDate && e.StartedAt <= toDate && e.UserSatisfactionScore.HasValue)
                .Select(e => e.UserSatisfactionScore!.Value)
                .ToListAsync();
            
            var avgSatisfaction = avgSatisfactionQuery.Any() ? (decimal)avgSatisfactionQuery.Average() : 0m;

            // Pipeline kullanımı
            var pipelinesUsed = await _context.PipelineExecutions
                .Where(e => e.UserId == userId && e.StartedAt >= fromDate && e.StartedAt <= toDate)
                .Select(e => e.PipelineId)
                .Distinct()
                .CountAsync();

            // Tercih edilen modeller
            var preferredModels = await _context.PipelineSteps
                .Include(s => s.AIProvider)
                .Include(s => s.Execution)
                .Where(s => s.Execution.UserId == userId && s.StartedAt >= fromDate && s.StartedAt <= toDate)
                .GroupBy(s => s.AIProvider.Name)
                .OrderByDescending(g => g.Count())
                .Take(3)
                .Select(g => g.Key)
                .ToListAsync();

            // Chat'ten de modelleri ekle
            var chatPreferredModels = await _context.ChatMessages
                .Include(m => m.AIProvider)
                .Include(m => m.ChatSession)
                .Where(m => m.ChatSession.UserId == userId && m.CreatedAt >= fromDate && m.CreatedAt <= toDate && !m.IsUserMessage && m.AIProvider != null)
                .GroupBy(m => m.AIProvider!.Name)
                .OrderByDescending(g => g.Count())
                .Take(3)
                .Select(g => g.Key)
                .ToListAsync();

            preferredModels = preferredModels.Union(chatPreferredModels).Take(3).ToList();

            // Ortak konular (basit keyword analizi)
            var commonTopics = new List<string> { "genel", "analiz", "yazım" }; // Placeholder

            return new UserAnalyticsDto
            {
                TotalRequests = totalRequests,
                AverageSatisfaction = avgSatisfaction,
                TotalPipelinesUsed = pipelinesUsed,
                PreferredModels = preferredModels,
                CommonTopics = commonTopics
            };
        }

        private async Task AdjustScoresForContext(Dictionary<int, decimal> scores, string context)
        {
            // Context'e göre belirli provider'ları favori yap
            var lowerContext = context.ToLower();

            if (lowerContext.Contains("kod") || lowerContext.Contains("program") || lowerContext.Contains("teknik"))
            {
                // OpenRouter teknik konularda genellikle daha iyi
                var openRouterProvider = await _context.AIProviders.FirstOrDefaultAsync(p => p.Name.Contains("OpenRouter"));
                if (openRouterProvider != null && scores.ContainsKey(openRouterProvider.Id))
                {
                    scores[openRouterProvider.Id] *= 1.3m;
                }
            }
            else if (lowerContext.Contains("yaratıcı") || lowerContext.Contains("story") || lowerContext.Contains("hikaye") || lowerContext.Contains("blog"))
            {
                // Gemini yaratıcı yazımda genellikle daha iyi
                var geminiProvider = await _context.AIProviders.FirstOrDefaultAsync(p => p.Name.Contains("Gemini"));
                if (geminiProvider != null && scores.ContainsKey(geminiProvider.Id))
                {
                    scores[geminiProvider.Id] *= 1.2m;
                }
            }
            else if (lowerContext.Contains("analiz") || lowerContext.Contains("veri") || lowerContext.Contains("rapor"))
            {
                // Cohere analitik işlerde iyi
                var cohereProvider = await _context.AIProviders.FirstOrDefaultAsync(p => p.Name.Contains("Cohere"));
                if (cohereProvider != null && scores.ContainsKey(cohereProvider.Id))
                {
                    scores[cohereProvider.Id] *= 1.25m;
                }
            }
            else if (lowerContext.Contains("email") || lowerContext.Contains("resmi") || lowerContext.Contains("profesyonel"))
            {
                // OpenRouter ve Cohere resmi yazışmalarda iyi
                var openRouterProvider = await _context.AIProviders.FirstOrDefaultAsync(p => p.Name.Contains("OpenRouter"));
                var cohereProvider = await _context.AIProviders.FirstOrDefaultAsync(p => p.Name.Contains("Cohere"));
                
                if (openRouterProvider != null && scores.ContainsKey(openRouterProvider.Id))
                {
                    scores[openRouterProvider.Id] *= 1.15m;
                }
                if (cohereProvider != null && scores.ContainsKey(cohereProvider.Id))
                {
                    scores[cohereProvider.Id] *= 1.15m;
                }
            }
        }
    }
}
