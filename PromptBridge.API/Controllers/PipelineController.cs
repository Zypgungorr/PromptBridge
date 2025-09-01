using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromptBridge.API.DTOs;
using PromptBridge.API.Services;
using System.Security.Claims;

namespace PromptBridge.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PipelineController : ControllerBase
    {
        private readonly IPipelineService _pipelineService;
        private readonly IMemoryService _memoryService;
        private readonly IAnalyticsService _analyticsService;
        private readonly ILogger<PipelineController> _logger;

        public PipelineController(
            IPipelineService pipelineService,
            IMemoryService memoryService,
            IAnalyticsService analyticsService,
            ILogger<PipelineController> logger)
        {
            _pipelineService = pipelineService;
            _memoryService = memoryService;
            _analyticsService = analyticsService;
            _logger = logger;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }
            return userId;
        }

        [HttpGet]
        public async Task<ActionResult<List<PipelineDto>>> GetUserPipelines()
        {
            try
            {
                var userId = GetUserId();
                var pipelines = await _pipelineService.GetUserPipelinesAsync(userId);
                return Ok(pipelines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user pipelines");
                return StatusCode(500, new { message = "Error retrieving pipelines" });
            }
        }

        [HttpGet("templates")]
        public async Task<ActionResult<List<PipelineDto>>> GetTemplatePipelines()
        {
            try
            {
                var templates = await _pipelineService.GetTemplatePipelinesAsync();
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pipeline templates");
                return StatusCode(500, new { message = "Error retrieving pipeline templates" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<PipelineDto>> CreatePipeline([FromBody] PipelineDto pipelineDto)
        {
            try
            {
                var userId = GetUserId();
                var createdPipeline = await _pipelineService.CreatePipelineAsync(userId, pipelineDto);
                return CreatedAtAction(nameof(GetUserPipelines), new { id = createdPipeline.Id }, createdPipeline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating pipeline");
                return StatusCode(500, new { message = "Error creating pipeline" });
            }
        }

        [HttpPut("{pipelineId}")]
        public async Task<ActionResult<PipelineDto>> UpdatePipeline(int pipelineId, [FromBody] PipelineDto pipelineDto)
        {
            try
            {
                var userId = GetUserId();
                var updatedPipeline = await _pipelineService.UpdatePipelineAsync(userId, pipelineId, pipelineDto);
                return Ok(updatedPipeline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating pipeline {PipelineId}", pipelineId);
                return StatusCode(500, new { message = "Error updating pipeline" });
            }
        }

        [HttpDelete("{pipelineId}")]
        public async Task<ActionResult> DeletePipeline(int pipelineId)
        {
            try
            {
                var userId = GetUserId();
                var success = await _pipelineService.DeletePipelineAsync(userId, pipelineId);
                if (!success)
                {
                    return NotFound(new { message = "Pipeline not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting pipeline {PipelineId}", pipelineId);
                return StatusCode(500, new { message = "Error deleting pipeline" });
            }
        }

        [HttpPost("execute")]
        public async Task<ActionResult<ExecutePipelineResponseDto>> ExecutePipeline([FromBody] ExecutePipelineRequestDto request)
        {
            try
            {
                var userId = GetUserId();
                
                // Enhance prompt with user memory
                var enhancedPrompt = await _memoryService.EnhancePromptWithMemoryAsync(userId, request.InitialPrompt);
                request.InitialPrompt = enhancedPrompt;
                
                var result = await _pipelineService.ExecutePipelineAsync(userId, request);
                
                // Learn from this interaction for future improvements
                if (result.Status == "Completed" && !string.IsNullOrEmpty(result.FinalResponse))
                {
                    _ = Task.Run(async () =>
                    {
                        await _memoryService.LearnFromUserInteractionAsync(userId, request.InitialPrompt, result.FinalResponse, null);
                    });
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing pipeline");
                return StatusCode(500, new { message = "Error executing pipeline" });
            }
        }

        [HttpGet("executions/{executionId}")]
        public async Task<ActionResult<List<PipelineStepResultDto>>> GetExecutionDetails(int executionId)
        {
            try
            {
                var userId = GetUserId();
                var details = await _pipelineService.GetExecutionDetailsAsync(userId, executionId);
                return Ok(details);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving execution details for {ExecutionId}", executionId);
                return StatusCode(500, new { message = "Error retrieving execution details" });
            }
        }

        [HttpPost("executions/{executionId}/rate")]
        public async Task<ActionResult> RateExecution(int executionId, [FromBody] RateExecutionDto rateDto)
        {
            try
            {
                var userId = GetUserId();
                var success = await _pipelineService.RatePipelineExecutionAsync(userId, executionId, rateDto.Rating, rateDto.Feedback);
                if (!success)
                {
                    return NotFound(new { message = "Execution not found" });
                }
                return Ok(new { message = "Rating saved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rating execution {ExecutionId}", executionId);
                return StatusCode(500, new { message = "Error saving rating" });
            }
        }

        [HttpGet("analytics")]
        public async Task<ActionResult<AnalyticsDto>> GetAnalytics([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var userId = GetUserId();
                var analytics = await _analyticsService.GetUserAnalyticsAsync(userId, fromDate, toDate);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving analytics for user {UserId}", GetUserId());
                return StatusCode(500, new { message = "Error retrieving analytics" });
            }
        }

        [HttpGet("recommendations")]
        public async Task<ActionResult<Dictionary<int, decimal>>> GetProviderRecommendations([FromQuery] string promptContext)
        {
            try
            {
                var userId = GetUserId();
                var recommendations = await _analyticsService.GetAIProviderRecommendationsAsync(userId, promptContext);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider recommendations");
                return StatusCode(500, new { message = "Error getting recommendations" });
            }
        }
    }

    public class RateExecutionDto
    {
        public decimal Rating { get; set; }
        public string? Feedback { get; set; }
    }
}
