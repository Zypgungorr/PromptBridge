using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PromptBridge.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIProviders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BaseUrl = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ApiKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIProviders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PromptRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AIProviderId = table.Column<int>(type: "integer", nullable: false),
                    Prompt = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Response = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    Status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResponseTimeMs = table.Column<int>(type: "integer", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromptRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromptRequests_AIProviders_AIProviderId",
                        column: x => x.AIProviderId,
                        principalTable: "AIProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PromptRequests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AIProviders",
                columns: new[] { "Id", "ApiKey", "BaseUrl", "CreatedAt", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "", "https://api.openai.com/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "OpenAI GPT-3.5/4 API", true, "OpenAI GPT" },
                    { 2, "", "https://api.anthropic.com/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Anthropic Claude API", true, "Anthropic Claude" },
                    { 3, "", "https://generativelanguage.googleapis.com/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Google Gemini API", true, "Google Gemini" },
                    { 4, "", "https://api.x.ai/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "xAI Grok-2 API", true, "Grok" },
                    { 5, "", "https://openrouter.ai/api/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "OpenRouter - Multiple AI Models (OpenAI, Anthropic, Google, Meta)", true, "OpenRouter" },
                    { 6, "", "https://api.cohere.ai/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cohere Command-R API", true, "Cohere" },
                    { 7, "", "https://api-inference.huggingface.co", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "HuggingFace Open Source AI Models", true, "HuggingFace" },
                    { 8, "", "https://api.vercel.com/v1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Vercel AI SDK - 100+ AI Models (OpenAI, Anthropic, xAI, Google, Meta)", true, "Vercel" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PromptRequests_AIProviderId",
                table: "PromptRequests",
                column: "AIProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptRequests_UserId",
                table: "PromptRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PromptRequests");

            migrationBuilder.DropTable(
                name: "AIProviders");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
