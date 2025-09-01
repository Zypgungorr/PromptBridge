using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Data;
using PromptBridge.API.DTOs;
using PromptBridge.API.Models;
using System.Text.Json;

namespace PromptBridge.API.Services
{
    public class PipelineService : IPipelineService
    {
        private readonly PromptBridgeContext _context;
        private readonly IAIService _aiService;
        private readonly ILogger<PipelineService> _logger;

        public PipelineService(PromptBridgeContext context, IAIService aiService, ILogger<PipelineService> logger)
        {
            _context = context;
            _aiService = aiService;
            _logger = logger;
        }

        public async Task<List<PipelineDto>> GetUserPipelinesAsync(int userId)
        {
            var pipelines = await _context.Pipelines
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.LastUsedAt ?? p.CreatedAt)
                .ToListAsync();

            var result = new List<PipelineDto>();
            foreach (var p in pipelines)
            {
                var dto = new PipelineDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    IsTemplate = p.IsTemplate,
                    CreatedAt = p.CreatedAt,
                    LastUsedAt = p.LastUsedAt,
                    Steps = JsonSerializer.Deserialize<List<PipelineStepDto>>(p.Configuration) ?? new List<PipelineStepDto>()
                };
                result.Add(dto);
            }

            return result;
        }

        public async Task<List<PipelineDto>> GetTemplatePipelinesAsync()
        {
            var templates = await _context.Pipelines
                .Where(p => p.IsTemplate && p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            var result = new List<PipelineDto>();
            foreach (var p in templates)
            {
                var dto = new PipelineDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    IsTemplate = p.IsTemplate,
                    CreatedAt = p.CreatedAt,
                    LastUsedAt = p.LastUsedAt,
                    Steps = JsonSerializer.Deserialize<List<PipelineStepDto>>(p.Configuration) ?? new List<PipelineStepDto>()
                };
                result.Add(dto);
            }

            return result;
        }

        public async Task<PipelineDto> CreatePipelineAsync(int userId, PipelineDto pipelineDto)
        {
            var pipeline = new Pipeline
            {
                UserId = userId,
                Name = pipelineDto.Name,
                Description = pipelineDto.Description,
                Configuration = JsonSerializer.Serialize(pipelineDto.Steps),
                IsActive = true,
                IsTemplate = pipelineDto.IsTemplate,
                CreatedAt = DateTime.UtcNow
            };

            _context.Pipelines.Add(pipeline);
            await _context.SaveChangesAsync();

            pipelineDto.Id = pipeline.Id;
            pipelineDto.CreatedAt = pipeline.CreatedAt;

            return pipelineDto;
        }

        public async Task<PipelineDto> UpdatePipelineAsync(int userId, int pipelineId, PipelineDto pipelineDto)
        {
            var pipeline = await _context.Pipelines
                .FirstOrDefaultAsync(p => p.Id == pipelineId && p.UserId == userId);

            if (pipeline == null)
                throw new ArgumentException("Pipeline not found or access denied");

            pipeline.Name = pipelineDto.Name;
            pipeline.Description = pipelineDto.Description;
            pipeline.Configuration = JsonSerializer.Serialize(pipelineDto.Steps);
            pipeline.IsActive = true;

            await _context.SaveChangesAsync();

            pipelineDto.Id = pipeline.Id;
            pipelineDto.CreatedAt = pipeline.CreatedAt;

            return pipelineDto;
        }

        public async Task<bool> DeletePipelineAsync(int userId, int pipelineId)
        {
            var pipeline = await _context.Pipelines
                .FirstOrDefaultAsync(p => p.Id == pipelineId && p.UserId == userId);

            if (pipeline == null)
                return false;

            _context.Pipelines.Remove(pipeline);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<ExecutePipelineResponseDto> ExecutePipelineAsync(int userId, ExecutePipelineRequestDto request)
        {
            var startTime = DateTime.UtcNow;
            
            var pipeline = await _context.Pipelines
                .FirstOrDefaultAsync(p => p.Id == request.PipelineId && (p.UserId == userId || p.IsTemplate));

            if (pipeline == null)
                throw new ArgumentException("Pipeline not found or access denied");

            // Pipeline execution kaydı oluştur
            var execution = new PipelineExecution
            {
                PipelineId = pipeline.Id,
                UserId = userId,
                InitialPrompt = request.InitialPrompt,
                Status = "Running",
                StartedAt = startTime
            };

            _context.PipelineExecutions.Add(execution);
            await _context.SaveChangesAsync();

            var response = new ExecutePipelineResponseDto
            {
                ExecutionId = execution.Id,
                Status = "Running",
                StepResults = new List<PipelineStepResultDto>()
            };

            try
            {
                // Pipeline steps'leri parse et
                var steps = JsonSerializer.Deserialize<List<PipelineStepDto>>(pipeline.Configuration) ?? new List<PipelineStepDto>();
                
                _logger.LogInformation("Pipeline configuration parsed. Found {StepCount} steps. Configuration: {Configuration}", 
                    steps.Count, pipeline.Configuration);
                
                string currentPrompt = request.InitialPrompt;
                string? previousResponse = null;

                foreach (var stepDto in steps.OrderBy(s => s.Order))
                {
                    var stepStartTime = DateTime.UtcNow;

                    // Debug: AI Provider ID'yi logla
                    _logger.LogInformation("Creating pipeline step with AIProviderId: {AIProviderId}, StepType: {StepType}, Order: {Order}", 
                        stepDto.AIProviderId, stepDto.StepType, stepDto.Order);

                    // Step kaydı oluştur
                    var step = new PipelineStep
                    {
                        ExecutionId = execution.Id,
                        StepOrder = stepDto.Order,
                        StepType = stepDto.StepType,
                        AIProviderId = stepDto.AIProviderId,
                        Prompt = ProcessPromptTemplate(stepDto.PromptTemplate, currentPrompt, previousResponse, request.Variables),
                        Status = "Running",
                        StartedAt = stepStartTime
                    };

                    _context.PipelineSteps.Add(step);
                    await _context.SaveChangesAsync();

                    try
                    {
                        // AI'ya istek gönder
                        var aiResponse = await _aiService.SendPromptAsync(stepDto.AIProviderId, step.Prompt, userId);
                        
                        var stepEndTime = DateTime.UtcNow;
                        var executionTime = (int)(stepEndTime - stepStartTime).TotalMilliseconds;

                        // Step'i güncelle
                        step.Response = aiResponse;
                        step.Status = "Completed";
                        step.CompletedAt = stepEndTime;
                        step.ExecutionTimeMs = executionTime;
                        step.PerformanceScore = CalculatePerformanceScore(executionTime, aiResponse?.Length ?? 0);

                        // Response'ı sonraki adım için hazırla
                        previousResponse = aiResponse;
                        
                        // Sonuç listesine ekle
                        response.StepResults.Add(new PipelineStepResultDto
                        {
                            Order = step.StepOrder,
                            StepType = step.StepType,
                            AIProviderName = stepDto.AIProviderName,
                            Prompt = step.Prompt,
                            Response = step.Response,
                            Status = step.Status,
                            ExecutionTimeMs = executionTime,
                            WasConditionMet = step.WasConditionMet,
                            PerformanceScore = step.PerformanceScore
                        });
                    }
                    catch (Exception ex)
                    {
                        step.Status = "Failed";
                        step.ErrorMessage = ex.Message;
                        step.CompletedAt = DateTime.UtcNow;

                        response.StepResults.Add(new PipelineStepResultDto
                        {
                            Order = step.StepOrder,
                            StepType = step.StepType,
                            AIProviderName = stepDto.AIProviderName,
                            Prompt = step.Prompt,
                            Status = step.Status,
                            ExecutionTimeMs = 0
                        });

                        _logger.LogError(ex, "Pipeline step failed: ExecutionId={ExecutionId}, StepOrder={StepOrder}", execution.Id, step.StepOrder);
                        break;
                    }

                    await _context.SaveChangesAsync();
                }

                // Execution'ı tamamla
                var endTime = DateTime.UtcNow;
                execution.Status = response.StepResults.Any(s => s.Status == "Failed") ? "Failed" : "Completed";
                execution.FinalResponse = previousResponse;
                execution.CompletedAt = endTime;
                execution.TotalExecutionTimeMs = (int)(endTime - startTime).TotalMilliseconds;

                // Pipeline'ın son kullanım tarihini güncelle
                pipeline.LastUsedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                response.Status = execution.Status;
                response.FinalResponse = execution.FinalResponse;
                response.TotalExecutionTimeMs = execution.TotalExecutionTimeMs ?? 0;
            }
            catch (Exception ex)
            {
                execution.Status = "Failed";
                execution.ErrorMessage = ex.Message;
                execution.CompletedAt = DateTime.UtcNow;

                response.Status = "Failed";
                response.ErrorMessage = ex.Message;

                await _context.SaveChangesAsync();
                
                _logger.LogError(ex, "Pipeline execution failed: ExecutionId={ExecutionId}", execution.Id);
            }

            return response;
        }

        public async Task<List<PipelineStepResultDto>> GetExecutionDetailsAsync(int userId, int executionId)
        {
            var steps = await _context.PipelineSteps
                .Include(s => s.AIProvider)
                .Where(s => s.ExecutionId == executionId && s.Execution.UserId == userId)
                .OrderBy(s => s.StepOrder)
                .Select(s => new PipelineStepResultDto
                {
                    Order = s.StepOrder,
                    StepType = s.StepType,
                    AIProviderName = s.AIProvider.Name,
                    Prompt = s.Prompt,
                    Response = s.Response,
                    Status = s.Status,
                    ExecutionTimeMs = s.ExecutionTimeMs ?? 0,
                    WasConditionMet = s.WasConditionMet,
                    PerformanceScore = s.PerformanceScore
                })
                .ToListAsync();

            return steps;
        }

        public async Task<bool> RatePipelineExecutionAsync(int userId, int executionId, decimal rating, string? feedback)
        {
            var execution = await _context.PipelineExecutions
                .FirstOrDefaultAsync(e => e.Id == executionId && e.UserId == userId);

            if (execution == null)
                return false;

            execution.UserSatisfactionScore = rating;
            execution.UserFeedback = feedback;

            await _context.SaveChangesAsync();
            return true;
        }

        private string ProcessPromptTemplate(string template, string initialPrompt, string? previousResponse, Dictionary<string, object> variables)
        {
            var processedPrompt = template
                .Replace("{input}", initialPrompt)
                .Replace("{initialPrompt}", initialPrompt)
                .Replace("{previousResponse}", previousResponse ?? "");

            foreach (var variable in variables)
            {
                processedPrompt = processedPrompt.Replace($"{{{variable.Key}}}", variable.Value?.ToString() ?? "");
            }

            return processedPrompt;
        }

        private decimal CalculatePerformanceScore(int executionTimeMs, int responseLength)
        {
            // Basit performance score hesaplama
            // Hızlı response (< 3000ms) ve yeterli uzunluk (> 100 char) = yüksek skor
            var timeScore = executionTimeMs < 3000 ? 5.0m : (executionTimeMs < 10000 ? 3.0m : 1.0m);
            var lengthScore = responseLength > 100 ? 5.0m : (responseLength > 50 ? 3.0m : 1.0m);
            
            return (timeScore + lengthScore) / 2;
        }
    }
}
