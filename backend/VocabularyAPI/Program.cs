using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

var builder = WebApplication.CreateBuilder(args);

// 🔧 關鍵:設定監聽 Railway 的 PORT
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddMemoryCache();

// Firebase 初始化
var firebaseCredentialJson = Environment.GetEnvironmentVariable("FIREBASE_CREDENTIAL_JSON");

if (!string.IsNullOrEmpty(firebaseCredentialJson))
{
    try
    {
        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromJson(firebaseCredentialJson)
        });
        Console.WriteLine("✅ Firebase initialized successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Firebase initialization failed: {ex.Message}");
    }
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Firebase JWT 驗證
var firebaseProjectId = Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID")
    ?? builder.Configuration["Firebase:ProjectId"];

if (!string.IsNullOrEmpty(firebaseProjectId))
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
                ValidateAudience = true,
                ValidAudience = firebaseProjectId,
                ValidateLifetime = true
            };
        });
}

builder.Services.AddAuthorization();

// CORS 設定
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Swagger
var enableSwagger = Environment.GetEnvironmentVariable("ENABLE_SWAGGER") == "true"
    || app.Environment.IsDevelopment();

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "VocabularyAPI v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// health check
app.MapGet("/", () => new
{
    status = "healthy",
    message = "VocabularyAPI is running",
    timestamp = DateTime.UtcNow,
    port = port
});

Console.WriteLine($"🚀 Starting on port {port}");

app.Run();
