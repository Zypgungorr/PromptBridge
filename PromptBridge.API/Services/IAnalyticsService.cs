using PromptBridge.API.DTOs;

namespace PromptBridge.API.Services
{
    public interface IAnalyticsService
    {
        Task<AnalyticsDto> GetUserAnalyticsAsync(int userId, DateTime? fromDate = null, DateTime? toDate = null);
        Task TrackPerformanceMetricAsync(int userId, int aiProviderId, string metricType, decimal value, string? unit = null, int? executionId = null, int? sessionId = null);
        Task<List<ProviderPerformanceDto>> GetProviderPerformanceComparisonAsync(int userId);
        Task<Dictionary<int, decimal>> GetAIProviderRecommendationsAsync(int userId, string promptContext);
        Task<List<PipelineAnalyticsDto>> GetTopPerformingPipelinesAsync(int userId);
        Task<UsageStatisticsDto> GetUsageStatisticsAsync(int userId, int days = 30);
    }
}
