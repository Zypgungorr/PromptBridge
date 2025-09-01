using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class Pipeline
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        [Required]
        public string Configuration { get; set; } = string.Empty; // JSON configuration
        
        public bool IsActive { get; set; } = true;
        public bool IsTemplate { get; set; } = false; // Şablon olarak kullanılabilir
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastUsedAt { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<PipelineExecution> Executions { get; set; } = new List<PipelineExecution>();
    }
}
