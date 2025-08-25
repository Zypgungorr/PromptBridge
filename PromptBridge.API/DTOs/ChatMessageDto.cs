namespace PromptBridge.API.DTOs
{
    public class ChatMessageDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsUserMessage { get; set; }
        public int? AIProviderId { get; set; }
        public string? AIProviderName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}