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
    [Route("api/[controller]")]
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
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var sessions = await _context.ChatSessions
                .Where(s => s.UserId == userId && s.IsActive)
                .OrderByDescending(s => s.LastActivityAt)
                .Select(s => new ChatSessionDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    CreatedAt = s.CreatedAt,
                    LastActivityAt = s.LastActivityAt,
                    MessageCount = s.Messages.Count
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [HttpGet("sessions/{sessionId}/messages")]
        public async Task<ActionResult<List<ChatMessageDto>>> GetChatMessages(int sessionId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            
            if (session == null)
                return NotFound();

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

        [HttpPost("sessions")]
        public async Task<ActionResult<ChatSessionDto>> CreateChatSession([FromBody] CreateChatSessionDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var session = new ChatSession
            {
                UserId = userId,
                Title = dto.Title ?? "Yeni Sohbet",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.ChatSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new ChatSessionDto
            {
                Id = session.Id,
                Title = session.Title,
                CreatedAt = session.CreatedAt,
                LastActivityAt = session.LastActivityAt,
                MessageCount = 0
            });
        }

        [HttpPost("sessions/{sessionId}/messages")]
        public async Task<ActionResult> AddMessage(int sessionId, [FromBody] ChatMessageDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            
            if (session == null)
                return NotFound();

            var message = new ChatMessage
            {
                ChatSessionId = sessionId,
                Content = dto.Content,
                IsUserMessage = dto.IsUserMessage,
                AIProviderId = dto.AIProviderId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            
            // Update session last activity
            session.LastActivityAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}