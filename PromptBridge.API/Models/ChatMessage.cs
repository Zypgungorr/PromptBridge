using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int ChatSessionId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsUserMessage { get; set; }
        public int? AIProviderId { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public ChatSession ChatSession { get; set; } = null!;
        public AIProvider? AIProvider { get; set; }
    }
}