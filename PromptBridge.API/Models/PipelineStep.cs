using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class PipelineStep
    {
        public int Id { get; set; }
        
        [Required]
        public int ExecutionId { get; set; }
        
        [Required]
        public int StepOrder { get; set; } // Adım sırası
        
        [Required]
        [MaxLength(100)]
        public string StepType { get; set; } = string.Empty; // AI_CALL, CONDITION, TRANSFORM, MERGE
        
        [Required]
        public int AIProviderId { get; set; }
        
        [Required]
        public string Prompt { get; set; } = string.Empty;
        
        public string? Response { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Running, Completed, Failed, Skipped
        
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        public int? ExecutionTimeMs { get; set; }
        
        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }
        
        // Conditional logic support
        public string? ConditionLogic { get; set; } // JSON condition logic
        public bool WasConditionMet { get; set; } = true;
        
        // Performance metrics
        public decimal? PerformanceScore { get; set; } // Otomatik hesaplanan performans skoru
        
        // Navigation properties
        public virtual PipelineExecution Execution { get; set; } = null!;
        public virtual AIProvider AIProvider { get; set; } = null!;
    }
}
