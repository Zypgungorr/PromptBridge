using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Data;
using PromptBridge.API.DTOs;
using PromptBridge.API.Models;
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
        private readonly PromptBridgeContext _context;

        public PromptController(IAIService aiService, PromptBridgeContext context)
        {
            _aiService = aiService;
            _context = context;
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

                // Get AI response
                var aiResponse = await _aiService.SendPromptAsync(request.AIProviderId, request.Prompt, userId);

                // Get or create active session
                var activeSession = await _context.ChatSessions
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive);

                if (activeSession == null)
                {
                    activeSession = new ChatSession
                    {
                        UserId = userId,
                        Title = request.Prompt.Length > 50 ? request.Prompt.Substring(0, 50) + "..." : request.Prompt,
                        CreatedAt = DateTime.UtcNow,
                        LastActivityAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    _context.ChatSessions.Add(activeSession);
                    await _context.SaveChangesAsync(); // ID oluşması için kaydedelim
                }

                // Save user message
                var userMessage = new ChatMessage
                {
                    ChatSessionId = activeSession.Id,
                    Content = request.Prompt,
                    IsUserMessage = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ChatMessages.Add(userMessage);

                // Save AI response message
                var aiMessage = new ChatMessage
                {
                    ChatSessionId = activeSession.Id,
                    Content = aiResponse,
                    IsUserMessage = false,
                    AIProviderId = request.AIProviderId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ChatMessages.Add(aiMessage);

                // Update session activity
                activeSession.LastActivityAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Return response DTO
                return Ok(new PromptResponseDto
                {
                    Id = 0,
                    AIProviderId = request.AIProviderId,
                    AIProviderName = "",
                    Prompt = request.Prompt,
                    Response = aiResponse,
                    Status = "Completed",
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow,
                    ResponseTimeMs = null,
                    ErrorMessage = null,
                    SessionId = activeSession.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while processing the prompt: {ex.Message}" });
            }
        }

        [HttpGet("chat/sessions")]
        public async Task<ActionResult<List<ChatSessionDto>>> GetChatSessions()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var sessions = await _context.ChatSessions
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.LastActivityAt)
                    .Select(s => new ChatSessionDto
                    {
                        Id = s.Id,
                        Title = s.Title,
                        CreatedAt = s.CreatedAt,
                        LastActivityAt = s.LastActivityAt,
                        MessageCount = _context.ChatMessages.Count(m => m.ChatSessionId == s.Id)
                    })
                    .ToListAsync();

                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving chat sessions: {ex.Message}" });
            }
        }

        [HttpPost("sessions/new")]
        public async Task<ActionResult<ChatSessionDto>> CreateNewSession()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Mevcut aktif session'ları deaktif et
                var activeSessions = await _context.ChatSessions
                    .Where(s => s.UserId == userId && s.IsActive)
                    .ToListAsync();

                foreach (var session in activeSessions)
                {
                    session.IsActive = false;
                }

                // Yeni session oluştur
                var newSession = new ChatSession
                {
                    UserId = userId,
                    Title = "Yeni Sohbet",
                    CreatedAt = DateTime.UtcNow,
                    LastActivityAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.ChatSessions.Add(newSession);
                await _context.SaveChangesAsync();
                return Ok(new ChatSessionDto
                {
                    Id = int.Parse(newSession.Id.ToString()),
                    Title = newSession.Title ?? "Yeni Sohbet",
                    LastActivityAt = DateTime.Parse(newSession.LastActivityAt.ToString("yyyy-MM-dd HH:mm:ss")),
                    CreatedAt = DateTime.Parse(newSession.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")),
                    MessageCount = 0
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating new session: {ex.Message}" });
            }
        }


    }
}
