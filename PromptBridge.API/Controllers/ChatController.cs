using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Data;
using PromptBridge.API.DTOs;
using PromptBridge.API.Models;
using System.Security.Claims;

namespace PromptBridge.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly PromptBridgeContext _context;

        public ChatController(PromptBridgeContext context)
        {
            _context = context;
        }

        [HttpGet("sessions")]
        public async Task<ActionResult<List<ChatSessionDto>>> GetChatSessions()
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

        [HttpGet("sessions/{sessionId}/messages")]
        public async Task<ActionResult<List<ChatMessageDto>>> GetChatMessages(int sessionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new { message = "Session not found" });

            var messages = await _context.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ChatMessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    IsUserMessage = m.IsUserMessage,
                    AIProviderId = m.AIProviderId,
                    AIProviderName = m.AIProvider.Name,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        // Yeni bir sohbet oturumu oluştur
        [HttpPost("sessions")]
        public async Task<ActionResult<ChatSessionDto>> CreateChatSession([FromBody] CreateChatSessionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Mevcut aktif oturumları deaktif et
            var activeSessions = await _context.ChatSessions
                .Where(s => s.UserId == userId && s.IsActive)
                .ToListAsync();

            foreach (var session in activeSessions)
            {
                session.IsActive = false;
            }

            // Yeni oturum oluştur
            var newSession = new ChatSession
            {
                UserId = userId,
                Title = dto.Title ?? "Yeni Sohbet",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.ChatSessions.Add(newSession);
            await _context.SaveChangesAsync();

            return Ok(new ChatSessionDto
            {
                Id = newSession.Id,
                Title = newSession.Title,
                CreatedAt = newSession.CreatedAt,
                LastActivityAt = newSession.LastActivityAt,
                MessageCount = 0
            });
        }

        // Belirli bir oturumu deaktif et
        [HttpPut("sessions/{sessionId}/deactivate")]
        public async Task<ActionResult> DeactivateSession(int sessionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
            {
                return NotFound(new { message = "Session not found" });
            }

            session.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Session deactivated" });
        }
    }
}