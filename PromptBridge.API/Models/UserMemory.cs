using System.ComponentModel.DataAnnotations;

namespace PromptBridge.API.Models
{
    public class UserMemory
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string MemoryType { get; set; } = string.Empty; // PREFERENCE, CONTEXT, LEARNING, PATTERN
        
        [Required]
        [MaxLength(255)]
        public string Key { get; set; } = string.Empty; // tone_preference, domain_expertise, etc.
        
        [Required]
        public string Value { get; set; } = string.Empty; // JSON value
        
        public decimal Confidence { get; set; } = 1.0m; // Memory'nin güvenilirlik derecesi
        public int UsageCount { get; set; } = 0; // Kaç kere kullanıldı
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; } // Bazı memory'ler expire olabilir
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}
