using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class PerformanceMetric
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        public int? PipelineExecutionId { get; set; }
        public int? ChatSessionId { get; set; }
        
        [Required]
        public int AIProviderId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string MetricType { get; set; } = string.Empty; // RESPONSE_TIME, SATISFACTION, ACCURACY, COST
        
        [Required]
        public decimal Value { get; set; }
        
        [MaxLength(50)]
        public string? Unit { get; set; } = string.Empty; // ms, usd, score, percentage
        
        public string? Context { get; set; } // JSON additional context
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual AIProvider AIProvider { get; set; } = null!;
        public virtual PipelineExecution? PipelineExecution { get; set; }
        public virtual ChatSession? ChatSession { get; set; }
    }
}
