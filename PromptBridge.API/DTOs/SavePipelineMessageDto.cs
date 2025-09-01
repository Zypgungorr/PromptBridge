namespace PromptBridge.API.DTOs
{
    public class SavePipelineMessageDto
    {
        public int SessionId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsUserMessage { get; set; }
        public int PipelineId { get; set; }
        public string? PipelineName { get; set; }
    }
}
