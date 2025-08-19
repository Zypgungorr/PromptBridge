namespace PromptBridge.API.DTOs
{
    public class PromptResponseDto
    {
        public int Id { get; set; }
        public int AIProviderId { get; set; }
        public string AIProviderName { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public string Response { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? ResponseTimeMs { get; set; }
        public string? ErrorMessage { get; set; }

        public int SessionId { get; set; } 
    }
}
