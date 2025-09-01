using PromptBridge.API.DTOs;

namespace PromptBridge.API.Services
{
    public interface IMemoryService
    {
        Task<Dictionary<string, object>> GetUserMemoryAsync(int userId, string? memoryType = null);
        Task UpdateUserMemoryAsync(int userId, string key, string memoryType, object value, decimal confidence = 1.0m);
        Task<string> EnhancePromptWithMemoryAsync(int userId, string originalPrompt);
        Task LearnFromUserInteractionAsync(int userId, string prompt, string response, decimal? userRating);
        Task<List<string>> GetUserPreferencesAsync(int userId);
        Task CleanupExpiredMemoryAsync();
    }
}
