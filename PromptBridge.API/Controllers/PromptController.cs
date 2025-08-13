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
    public class PromptController : ControllerBase
    {
        private readonly IAIService _aiService;

        public PromptController(IAIService aiService)
        {
            _aiService = aiService;
        }

        [HttpGet("providers")]
        public async Task<ActionResult<List<AIProviderDto>>> GetProviders()
        {
            try
            {
                var providers = await _aiService.GetActiveProvidersAsync();
                return Ok(providers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving providers: {ex.Message}" });
            }
        }

        [HttpPost("send")]
        public async Task<ActionResult<PromptResponseDto>> SendPrompt([FromBody] PromptRequestDto request)
        {
            try
            {
                // Extract user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var response = await _aiService.SendPromptAsync(request.AIProviderId, request.Prompt, userId);

                return Ok(new PromptResponseDto
                {
                    AIProviderId = request.AIProviderId,
                    Prompt = request.Prompt,
                    Response = response,
                    Status = "Completed",
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while processing the prompt: {ex.Message}" });
            }
        }
    }
}
