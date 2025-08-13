using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class AIProvider
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string BaseUrl { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string ApiKey { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public virtual ICollection<PromptRequest> PromptRequests { get; set; } = new List<PromptRequest>();
    }
}
