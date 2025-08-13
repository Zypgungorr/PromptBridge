using PromptBridge.API.DTOs;

namespace PromptBridge.API.Services
{
    public interface IAIService
    {
        Task<string> SendPromptAsync(int providerId, string prompt, int userId);
        Task<List<AIProviderDto>> GetActiveProvidersAsync();
    }
}
