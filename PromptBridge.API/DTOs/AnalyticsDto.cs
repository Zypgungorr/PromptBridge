namespace PromptBridge.API.DTOs
{
    public class AnalyticsDto
    {
        public UserAnalyticsDto User { get; set; } = new();
        public List<ProviderPerformanceDto> ProviderPerformance { get; set; } = new();
        public List<PipelineAnalyticsDto> TopPipelines { get; set; } = new();
        public UsageStatisticsDto Usage { get; set; } = new();
    }
    
    public class UserAnalyticsDto
    {
        public int TotalRequests { get; set; }
        public decimal AverageSatisfaction { get; set; }
        public int TotalPipelinesUsed { get; set; }
        public List<string> PreferredModels { get; set; } = new();
        public List<string> CommonTopics { get; set; } = new();
    }
    
    public class ProviderPerformanceDto
    {
        public string ProviderName { get; set; } = string.Empty;
        public decimal AverageResponseTime { get; set; }
        public decimal AverageSatisfaction { get; set; }
        public decimal SuccessRate { get; set; }
        public int TotalUsage { get; set; }
        public decimal EstimatedCost { get; set; }
    }
    
    public class PipelineAnalyticsDto
    {
        public int PipelineId { get; set; }
        public string PipelineName { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public decimal AverageExecutionTime { get; set; }
        public decimal AverageSatisfaction { get; set; }
        public decimal SuccessRate { get; set; }
    }
    
    public class UsageStatisticsDto
    {
        public Dictionary<string, int> DailyUsage { get; set; } = new();
        public Dictionary<string, int> ModelUsage { get; set; } = new();
        public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
    }
}
