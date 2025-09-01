using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class PipelineExecution
    {
        public int Id { get; set; }
        
        [Required]
        public int PipelineId { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string InitialPrompt { get; set; } = string.Empty;
        
        public string? FinalResponse { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Running"; // Running, Completed, Failed, Cancelled
        
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        
        public int? TotalExecutionTimeMs { get; set; }
        
        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }
        
        // Analytics data
        public decimal? UserSatisfactionScore { get; set; } // 1-5 rating
        public string? UserFeedback { get; set; }
        
        // Navigation properties
        public virtual Pipeline Pipeline { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual ICollection<PipelineStep> Steps { get; set; } = new List<PipelineStep>();
    }
}
