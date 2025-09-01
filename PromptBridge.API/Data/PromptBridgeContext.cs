using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Models;

namespace PromptBridge.API.Data
{
    public class PromptBridgeContext : DbContext
    {
        public PromptBridgeContext(DbContextOptions<PromptBridgeContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<AIProvider> AIProviders { get; set; }
        public DbSet<PromptRequest> PromptRequests { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.LastLoginAt);

                // Unique constraints
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // AIProvider configuration
            modelBuilder.Entity<AIProvider>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.BaseUrl).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ApiKey).HasMaxLength(500);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
            });

            // PromptRequest configuration
            modelBuilder.Entity<PromptRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Prompt).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Response).HasMaxLength(5000);
                entity.Property(e => e.Status).HasMaxLength(100);
                entity.Property(e => e.ErrorMessage).HasMaxLength(1000);

                // Relationships
                entity.HasOne(e => e.User)
                    .WithMany(u => u.PromptRequests)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.AIProvider)
                    .WithMany(p => p.PromptRequests)
                    .HasForeignKey(e => e.AIProviderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed data for AI Providers
            modelBuilder.Entity<AIProvider>().HasData(
                // new AIProvider
                // {
                //     Id = 1,
                //     Name = "OpenAI GPT",
                //     BaseUrl = "https://api.openai.com/v1",
                //     ApiKey = "", // API key loaded from configuration
                //     Description = "OpenAI GPT-3.5/4 API",
                //     IsActive = true,
                //     CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                // },
                // new AIProvider
                // {
                //     Id = 2,
                //     Name = "Anthropic Claude",
                //     BaseUrl = "https://api.anthropic.com/v1",
                //     ApiKey = "", // API key loaded from configuration
                //     Description = "Anthropic Claude API",
                //     IsActive = true,
                //     CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                // },
                new AIProvider
                {
                    Id = 3,
                    Name = "Google Gemini",
                    BaseUrl = "https://generativelanguage.googleapis.com/v1",
                    ApiKey = "", // API key loaded from configuration
                    Description = "Google Gemini API",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                // new AIProvider
                // {
                //     Id = 4,
                //     Name = "Grok",
                //     BaseUrl = "https://api.x.ai/v1",
                //     ApiKey = "", // API key loaded from configuration
                //     Description = "xAI Grok-2 API",
                //     IsActive = true,
                //     CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                // },
                new AIProvider
                {
                    Id = 5,
                    Name = "OpenRouter",
                    BaseUrl = "https://openrouter.ai/api/v1",
                    ApiKey = "", // API key loaded from configuration
                    Description = "OpenRouter - Multiple AI Models (OpenAI, Anthropic, Google, Meta)",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new AIProvider
                {
                    Id = 6,
                    Name = "Cohere",
                    BaseUrl = "https://api.cohere.ai/v1",
                    ApiKey = "", // API key loaded from configuration
                    Description = "Cohere Command-R API",
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
                // new AIProvider
                // {
                //     Id = 7,
                //     Name = "HuggingFace",
                //     BaseUrl = "https://api-inference.huggingface.co",
                //     ApiKey = "", // API key loaded from configuration
                //     Description = "HuggingFace Open Source AI Models",
                //     IsActive = true,
                //     CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                // },
                // new AIProvider
                // {
                //     Id = 8,
                //     Name = "Vercel",
                //     BaseUrl = "https://api.vercel.com/v1",
                //     ApiKey = "", // API key loaded from configuration
                //     Description = "Vercel AI SDK - 100+ AI Models (OpenAI, Anthropic, xAI, Google, Meta)",
                //     IsActive = true,
                //     CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                // }
            );
        }
    }
}
