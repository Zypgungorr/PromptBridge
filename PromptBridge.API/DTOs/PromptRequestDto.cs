namespace PromptBridge.API.DTOs
{
    public class PromptRequestDto
    {
        public int AIProviderId { get; set; }
        public string Prompt { get; set; } = string.Empty;
    }
}
