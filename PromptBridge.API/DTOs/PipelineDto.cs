using System.Text.Json.Serialization;

namespace PromptBridge.API.DTOs
{
    public class PipelineDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<PipelineStepDto> Steps { get; set; } = new();
        public bool IsTemplate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }
    
    public class PipelineStepDto
    {
        [JsonPropertyName("order")]
        public int Order { get; set; }
        
        [JsonPropertyName("stepType")]
        public string StepType { get; set; } = string.Empty;
        
        [JsonPropertyName("aiProviderId")]
        public int AIProviderId { get; set; }
        
        [JsonPropertyName("aiProviderName")]
        public string AIProviderName { get; set; } = string.Empty;
        
        [JsonPropertyName("promptTemplate")]
        public string PromptTemplate { get; set; } = string.Empty;
        
        public PipelineConditionDto? Condition { get; set; }
    }
    
    public class PipelineConditionDto
    {
        public string Type { get; set; } = string.Empty; // LENGTH, SENTIMENT, CONTAINS, CUSTOM
        public string Operator { get; set; } = string.Empty; // GT, LT, EQ, CONTAINS
        public string Value { get; set; } = string.Empty;
        public List<PipelineStepDto> TrueSteps { get; set; } = new();
        public List<PipelineStepDto> FalseSteps { get; set; } = new();
    }
}
