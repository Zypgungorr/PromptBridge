using Microsoft.EntityFrameworkCore;
using PromptBridge.API.Data;
using PromptBridge.API.DTOs;
using PromptBridge.API.Models;
using System.Text.Json;

namespace PromptBridge.API.Services
{
    public class AIService : IAIService
    {
        private readonly PromptBridgeContext _context;
        private readonly ILogger<AIService> _logger;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public AIService(PromptBridgeContext context, ILogger<AIService> logger, HttpClient httpClient, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> SendPromptAsync(int providerId, string prompt, int userId)
        {
            var startTime = DateTime.UtcNow;
            var provider = await _context.AIProviders.FindAsync(providerId);

            if (provider == null || !provider.IsActive)
            {
                throw new InvalidOperationException("AI Provider not found or inactive");
            }

            try
            {
                string response;
                var providerName = provider.Name.ToLower();

                switch (providerName)
                {
                    case "openai gpt":
                        response = await CallOpenAIAsync(provider, prompt);
                        break;
                    case "anthropic claude":
                        response = await CallAnthropicAsync(provider, prompt);
                        break;
                    case "google gemini":
                        response = await CallGeminiAsync(provider, prompt);
                        break;
                    case "grok":
                        response = await CallGrokAsync(provider, prompt);
                        break;
                    case "openrouter":
                        response = await CallOpenRouterAsync(provider, prompt);
                        break;
                    case "cohere":
                        response = await CallCohereAsync(provider, prompt);
                        break;
                    case "huggingface":
                        response = await CallHuggingFaceAsync(provider, prompt);
                        break;
                    case "vercel":
                        response = await CallVercelAsync(provider, prompt);
                        break;
                    default:
                        throw new NotSupportedException($"Provider {provider.Name} is not supported");
                }

                var responseTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

                // Save to database
                var promptRequest = new PromptRequest
                {
                    UserId = userId,
                    AIProviderId = providerId,
                    Prompt = prompt,
                    Response = response,
                    Status = "Completed",
                    CompletedAt = DateTime.UtcNow,
                    ResponseTimeMs = responseTime
                };

                _context.PromptRequests.Add(promptRequest);
                await _context.SaveChangesAsync();

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling AI provider {ProviderId}", providerId);

                // Save error to database
                var promptRequest = new PromptRequest
                {
                    UserId = userId,
                    AIProviderId = providerId,
                    Prompt = prompt,
                    Status = "Failed",
                    ErrorMessage = ex.Message
                };

                _context.PromptRequests.Add(promptRequest);
                await _context.SaveChangesAsync();

                throw;
            }
        }

        public async Task<List<AIProviderDto>> GetActiveProvidersAsync()
        {
            return await _context.AIProviders
                .Where(p => p.IsActive)
                .Select(p => new AIProviderDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description ?? "",
                    IsActive = p.IsActive
                })
                .ToListAsync();
        }

        private async Task<string> CallOpenAIAsync(AIProvider provider, string prompt)
        {
            var request = new
            {
                model = "gpt-3.5-turbo-0125",
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                max_tokens = 1000,
                temperature = 0.7
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsync($"{provider.BaseUrl}/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"OpenAI API error: {response.StatusCode} - {errorContent}");

                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    throw new HttpRequestException("OpenAI rate limit exceeded. Please wait a few minutes and try again.");
                }

                throw new HttpRequestException($"OpenAI API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);
            return openAIResponse?.choices?.FirstOrDefault()?.message?.content ?? "No response from OpenAI";
        }

        private async Task<string> CallAnthropicAsync(AIProvider provider, string prompt)
        {
            var request = new
            {
                model = "claude-3-haiku-20240307",
                max_tokens = 1000,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var response = await _httpClient.PostAsync($"{provider.BaseUrl}/messages", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Anthropic API error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"Anthropic API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var anthropicResponse = JsonSerializer.Deserialize<AnthropicResponse>(responseContent);
            return anthropicResponse?.content?.FirstOrDefault()?.text ?? "No response from Anthropic";
        }

        private async Task<string> CallGeminiAsync(AIProvider provider, string prompt)
        {
            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 1000,
                    topP = 0.8,
                    topK = 40
                }
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            var response = await _httpClient.PostAsync($"{provider.BaseUrl}/models/gemini-1.5-flash:generateContent?key={apiKey}", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Gemini API error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"Gemini API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(responseContent);
            return geminiResponse?.candidates?.FirstOrDefault()?.content?.parts?.FirstOrDefault()?.text ?? "No response from Gemini";
        }

        private async Task<string> CallGrokAsync(AIProvider provider, string prompt)
        {
            var request = new
            {
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                model = "grok-2",
                max_tokens = 1000,
                temperature = 0.7
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var apiKey = Environment.GetEnvironmentVariable("GROK_API_KEY");
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsync($"{provider.BaseUrl}/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Grok API error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"Grok API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var grokResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);
            return grokResponse?.choices?.FirstOrDefault()?.message?.content ?? "No response from Grok";
        }

        private async Task<string> CallOpenRouterAsync(AIProvider provider, string prompt)
        {
            var request = new
            {
                model = "openai/gpt-3.5-turbo",
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                max_tokens = 1000,
                temperature = 0.7
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            var apiKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:5231");
            _httpClient.DefaultRequestHeaders.Add("X-Title", "PromptBridge");

            var response = await _httpClient.PostAsync($"{provider.BaseUrl}/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"OpenRouter API error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"OpenRouter API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);
            return responseObj?.choices?.FirstOrDefault()?.message?.content ?? "No response from OpenRouter";
        }

        private async Task<string> CallCohereAsync(AIProvider provider, string prompt)
        {
            var request = new
            {
                model = "command-r",
                message = prompt,
                temperature = 0.7,
                max_tokens = 1000
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            var apiKey = Environment.GetEnvironmentVariable("COHERE_API_KEY");
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsync($"{provider.BaseUrl}/chat", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Cohere API error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"Cohere API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<CohereResponse>(responseContent);
            return responseObj?.text ?? "No response from Cohere";
        }

        private async Task<string> CallHuggingFaceAsync(AIProvider provider, string prompt)
        {
            try
            {
                var request = new
                {
                    inputs = prompt,
                    parameters = new
                    {
                        max_new_tokens = 1000,
                        temperature = 0.7,
                        top_p = 0.95
                    }
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                var apiKey = Environment.GetEnvironmentVariable("HUGGINGFACE_API_KEY");
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                var response = await _httpClient.PostAsync($"{provider.BaseUrl}/models/gpt2", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"HuggingFace API error: {response.StatusCode} - {errorContent}");
                    throw new HttpRequestException($"HuggingFace returned {response.StatusCode}: {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var responseArray = JsonSerializer.Deserialize<List<HuggingFaceResponse>>(responseContent);
                return responseArray?[0]?.generated_text ?? "No response from HuggingFace";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling HuggingFace API");
                throw;
            }
        }

        private async Task<string> CallVercelAsync(AIProvider provider, string prompt)
        {
            try
            {
                _httpClient.DefaultRequestHeaders.Clear();
                var apiKey = Environment.GetEnvironmentVariable("VERCEL_API_KEY");
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                var request = new
                {
                    model = "gpt-3.5-turbo",
                    messages = new[]
                    {
                        new { role = "user", content = prompt }
                    },
                    max_tokens = 1000,
                    temperature = 0.7
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("https://api.vercel.com/v1/chat/completions", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Vercel API error: {response.StatusCode} - {errorContent}");
                    throw new HttpRequestException($"Vercel API error: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var vercelResponse = JsonSerializer.Deserialize<VercelResponse>(responseContent);
                return vercelResponse?.choices?.FirstOrDefault()?.message?.content ?? "No response generated";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Vercel API");
                throw;
            }
        }
    }

    // Response models
    public class OpenAIResponse
    {
        public List<OpenAIChoice> choices { get; set; } = new();
    }

    public class OpenAIChoice
    {
        public OpenAIMessage message { get; set; } = new();
    }

    public class OpenAIMessage
    {
        public string content { get; set; } = "";
    }

    public class AnthropicResponse
    {
        public List<AnthropicContent> content { get; set; } = new();
    }

    public class AnthropicContent
    {
        public string text { get; set; } = "";
    }

    public class GeminiResponse
    {
        public List<GeminiCandidate> candidates { get; set; } = new();
    }

    public class GeminiCandidate
    {
        public GeminiContent content { get; set; } = new();
    }

    public class GeminiContent
    {
        public List<GeminiPart> parts { get; set; } = new();
    }

    public class GeminiPart
    {
        public string text { get; set; } = "";
    }

    public class CohereResponse
    {
        public string text { get; set; } = "";
    }

    public class HuggingFaceResponse
    {
        public string? generated_text { get; set; }
    }

    public class VercelResponse
    {
        public List<VercelChoice> choices { get; set; } = new();
    }

    public class VercelChoice
    {
        public VercelMessage message { get; set; } = new();
    }

    public class VercelMessage
    {
        public string content { get; set; } = "";
    }
}
