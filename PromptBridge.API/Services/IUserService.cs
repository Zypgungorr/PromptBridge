using PromptBridge.API.DTOs;

namespace PromptBridge.API.Services
{
    public interface IUserService
    {
        Task<AuthResponseDto> RegisterAsync(UserRegisterDto request);
        Task<AuthResponseDto> LoginAsync(UserLoginDto request);
        Task<bool> UserExistsAsync(string username, string email);
    }
}
