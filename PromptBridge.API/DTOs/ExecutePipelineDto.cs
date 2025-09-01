namespace PromptBridge.API.DTOs
{
    public class ExecutePipelineRequestDto
    {
        public int PipelineId { get; set; }
        public string InitialPrompt { get; set; } = string.Empty;
        public Dictionary<string, object> Variables { get; set; } = new();
    }
    
    public class ExecutePipelineResponseDto
    {
        public int ExecutionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? FinalResponse { get; set; }
        public List<PipelineStepResultDto> StepResults { get; set; } = new();
        public int TotalExecutionTimeMs { get; set; }
        public string? ErrorMessage { get; set; }
    }
    
    public class PipelineStepResultDto
    {
        public int Order { get; set; }
        public string StepType { get; set; } = string.Empty;
        public string AIProviderName { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public string? Response { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ExecutionTimeMs { get; set; }
        public bool WasConditionMet { get; set; }
        public decimal? PerformanceScore { get; set; }
    }
}
