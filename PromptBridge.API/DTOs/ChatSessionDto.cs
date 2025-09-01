namespace PromptBridge.API.DTOs
{
    public class ChatSessionDto
    {
        public int Id { get; set; }
        public string? Title { get; set; } 
        public DateTime CreatedAt { get; set; }
        public DateTime LastActivityAt { get; set; }
        public int MessageCount { get; set; }
    }
}