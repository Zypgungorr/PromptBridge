using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class PromptRequest
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int AIProviderId { get; set; }
        
        [Required]
        [MaxLength(2000)]
        public string Prompt { get; set; } = string.Empty;
        
        [MaxLength(5000)]
        public string? Response { get; set; }
        
        [MaxLength(100)]
        public string Status { get; set; } = "Pending";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedAt { get; set; }
        
        public int? ResponseTimeMs { get; set; }
        
        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual AIProvider AIProvider { get; set; } = null!;
    }
}
