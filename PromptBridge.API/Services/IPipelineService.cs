using PromptBridge.API.DTOs;

namespace PromptBridge.API.Services
{
    public interface IPipelineService
    {
        Task<List<PipelineDto>> GetUserPipelinesAsync(int userId);
        Task<List<PipelineDto>> GetTemplatePipelinesAsync();
        Task<PipelineDto> CreatePipelineAsync(int userId, PipelineDto pipelineDto);
        Task<PipelineDto> UpdatePipelineAsync(int userId, int pipelineId, PipelineDto pipelineDto);
        Task<bool> DeletePipelineAsync(int userId, int pipelineId);
        Task<ExecutePipelineResponseDto> ExecutePipelineAsync(int userId, ExecutePipelineRequestDto request);
        Task<List<PipelineStepResultDto>> GetExecutionDetailsAsync(int userId, int executionId);
        Task<bool> RatePipelineExecutionAsync(int userId, int executionId, decimal rating, string? feedback);
    }
}
