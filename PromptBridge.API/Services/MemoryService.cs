using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Data;
using PromptBridge.API.Models;
using System.Text.Json;

namespace PromptBridge.API.Services
{
    public class MemoryService : IMemoryService
    {
        private readonly PromptBridgeContext _context;
        private readonly ILogger<MemoryService> _logger;

        public MemoryService(PromptBridgeContext context, ILogger<MemoryService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Dictionary<string, object>> GetUserMemoryAsync(int userId, string? memoryType = null)
        {
            var query = _context.UserMemories.Where(m => m.UserId == userId);
            
            if (!string.IsNullOrEmpty(memoryType))
            {
                query = query.Where(m => m.MemoryType == memoryType);
            }

            var memories = await query
                .OrderByDescending(m => m.LastUsedAt)
                .ToListAsync();

            var result = new Dictionary<string, object>();

            foreach (var memory in memories)
            {
                try
                {
                    var value = JsonSerializer.Deserialize<object>(memory.Value);
                    result[memory.Key] = value ?? memory.Value;
                }
                catch
                {
                    result[memory.Key] = memory.Value;
                }
            }

            return result;
        }

        public async Task UpdateUserMemoryAsync(int userId, string key, string memoryType, object value, decimal confidence = 1.0m)
        {
            var existingMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.MemoryType == memoryType && m.Key == key);

            var serializedValue = JsonSerializer.Serialize(value);

            if (existingMemory != null)
            {
                existingMemory.Value = serializedValue;
                existingMemory.Confidence = confidence;
                existingMemory.UsageCount++;
                existingMemory.LastUsedAt = DateTime.UtcNow;
            }
            else
            {
                var newMemory = new UserMemory
                {
                    UserId = userId,
                    MemoryType = memoryType,
                    Key = key,
                    Value = serializedValue,
                    Confidence = confidence,
                    UsageCount = 1,
                    CreatedAt = DateTime.UtcNow,
                    LastUsedAt = DateTime.UtcNow
                };

                _context.UserMemories.Add(newMemory);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<string> EnhancePromptWithMemoryAsync(int userId, string originalPrompt)
        {
            try
            {
                // Kullanıcı tercihlerini al
                var preferences = await GetUserMemoryAsync(userId, "PREFERENCE");
                var context = await GetUserMemoryAsync(userId, "CONTEXT");

                if (!preferences.Any() && !context.Any())
                {
                    return originalPrompt;
                }

                var enhancedPrompt = originalPrompt;

                // Tone tercihi varsa ekle
                if (preferences.ContainsKey("tone"))
                {
                    var tone = preferences["tone"]?.ToString();
                    if (!string.IsNullOrEmpty(tone) && !originalPrompt.ToLower().Contains("ton"))
                    {
                        enhancedPrompt += $" (Ton: {tone})";
                    }
                }

                // Stil tercihi varsa ekle
                if (preferences.ContainsKey("style"))
                {
                    var style = preferences["style"]?.ToString();
                    if (!string.IsNullOrEmpty(style) && !originalPrompt.ToLower().Contains("stil"))
                    {
                        enhancedPrompt += $" (Stil: {style})";
                    }
                }

                // Expertise context varsa ekle
                if (context.ContainsKey("expertise"))
                {
                    var expertise = context["expertise"]?.ToString();
                    if (!string.IsNullOrEmpty(expertise))
                    {
                        enhancedPrompt += $" (Uzmanlık alanım göz önünde bulundur: {expertise})";
                    }
                }

                return enhancedPrompt;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enhancing prompt with memory for user {UserId}", userId);
                return originalPrompt;
            }
        }

        public async Task LearnFromUserInteractionAsync(int userId, string prompt, string response, decimal? userRating)
        {
            try
            {
                // Prompt'tan pattern'leri çıkar ve öğren
                await ExtractAndLearnPatterns(userId, prompt, response, userRating);

                // Kullanım saatini kaydet
                await UpdateUsagePattern(userId);

                // Eğer rating varsa, tercih öğrenmeye çalış
                if (userRating.HasValue)
                {
                    await LearnFromRating(userId, prompt, response, userRating.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error learning from user interaction for user {UserId}", userId);
            }
        }

        public async Task<List<string>> GetUserPreferencesAsync(int userId)
        {
            var preferences = await _context.UserMemories
                .Where(m => m.UserId == userId && m.MemoryType == "PREFERENCE")
                .Select(m => $"{m.Key}: {m.Value}")
                .ToListAsync();

            return preferences;
        }

        public async Task CleanupExpiredMemoryAsync()
        {
            var expiredMemories = await _context.UserMemories
                .Where(m => m.ExpiresAt.HasValue && m.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            if (expiredMemories.Any())
            {
                _context.UserMemories.RemoveRange(expiredMemories);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Cleaned up {Count} expired memories", expiredMemories.Count);
            }
        }

        private async Task ExtractAndLearnPatterns(int userId, string prompt, string response, decimal? userRating)
        {
            // Prompt tipini analiz et
            var promptType = AnalyzePromptType(prompt);
            if (!string.IsNullOrEmpty(promptType))
            {
                await UpdateUserMemoryAsync(userId, "common_prompt_types", "PATTERN", promptType, 0.7m);
            }

            // Response uzunluğu tercihini öğren
            var responseLength = response.Length;
            var lengthPreference = responseLength < 500 ? "short" : responseLength < 1500 ? "medium" : "long";
            await UpdateUserMemoryAsync(userId, "preferred_response_length", "PREFERENCE", lengthPreference, 0.6m);

            // Başarılı pattern'leri kaydet (yüksek rating varsa)
            if (userRating.HasValue && userRating.Value >= 4.0m)
            {
                var successPattern = new { promptType, responseLength, rating = userRating.Value };
                await UpdateUserMemoryAsync(userId, "successful_patterns", "LEARNING", successPattern, 0.9m);
            }
        }

        private async Task UpdateUsagePattern(int userId)
        {
            var currentHour = DateTime.UtcNow.Hour;
            var usageKey = $"usage_hour_{currentHour}";
            
            var existingUsage = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.MemoryType == "PATTERN" && m.Key == usageKey);

            if (existingUsage != null)
            {
                var count = JsonSerializer.Deserialize<int>(existingUsage.Value) + 1;
                await UpdateUserMemoryAsync(userId, usageKey, "PATTERN", count, 1.0m);
            }
            else
            {
                await UpdateUserMemoryAsync(userId, usageKey, "PATTERN", 1, 1.0m);
            }
        }

        private async Task LearnFromRating(int userId, string prompt, string response, decimal rating)
        {
            // Yüksek puanlı içeriklerin özelliklerini öğren
            if (rating >= 4.0m)
            {
                // Ton analizi
                var detectedTone = AnalyzeTone(response);
                if (!string.IsNullOrEmpty(detectedTone))
                {
                    await UpdateUserMemoryAsync(userId, "preferred_tone", "PREFERENCE", detectedTone, 0.8m);
                }

                // Stil analizi  
                var detectedStyle = AnalyzeStyle(response);
                if (!string.IsNullOrEmpty(detectedStyle))
                {
                    await UpdateUserMemoryAsync(userId, "preferred_style", "PREFERENCE", detectedStyle, 0.8m);
                }
            }
        }

        private string AnalyzePromptType(string prompt)
        {
            var lowerPrompt = prompt.ToLower();
            
            if (lowerPrompt.Contains("email") || lowerPrompt.Contains("e-mail") || lowerPrompt.Contains("mektup"))
                return "email_writing";
            if (lowerPrompt.Contains("kod") || lowerPrompt.Contains("program") || lowerPrompt.Contains("script"))
                return "code_generation";
            if (lowerPrompt.Contains("analiz") || lowerPrompt.Contains("değerlendirme") || lowerPrompt.Contains("inceleme"))
                return "analysis";
            if (lowerPrompt.Contains("özet") || lowerPrompt.Contains("özetle"))
                return "summarization";
            if (lowerPrompt.Contains("çevir") || lowerPrompt.Contains("translate"))
                return "translation";
            if (lowerPrompt.Contains("dilekçe") || lowerPrompt.Contains("başvuru"))
                return "formal_writing";
            if (lowerPrompt.Contains("blog") || lowerPrompt.Contains("makale") || lowerPrompt.Contains("yazı"))
                return "content_writing";
                
            return "general";
        }

        private string AnalyzeTone(string response)
        {
            var lowerResponse = response.ToLower();
            
            if (lowerResponse.Contains("saygılarımla") || lowerResponse.Contains("sayın") || lowerResponse.Contains("resmi"))
                return "formal";
            if (lowerResponse.Contains("merhaba") || lowerResponse.Contains("selam") || lowerResponse.Contains("dostum"))
                return "casual";
            if (lowerResponse.Contains("teknik") || lowerResponse.Contains("spesifik") || lowerResponse.Contains("detaylı"))
                return "technical";
                
            return "neutral";
        }

        private string AnalyzeStyle(string response)
        {
            if (response.Length > 1000)
                return "detailed";
            if (response.Length < 300)
                return "concise";
            if (response.Contains("•") || response.Contains("-") || response.Contains("1."))
                return "structured";
                
            return "standard";
        }
    }
}
