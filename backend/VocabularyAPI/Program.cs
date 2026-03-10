using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VocabularyAPI.DbContexts;
using VocabularyAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// 🔧 DB Context (Neon Postgres - Render用)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<VocabularyContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<VocabularyService>();
builder.Services.AddScoped<MembersService>();
builder.Services.AddScoped<FavouriteVocabularyService>();
builder.Services.AddScoped<VocabularyProgressService>();

// 🔧 Render PORT設定 (0.0.0.0:PORT)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddMemoryCache();

// Firebase Admin SDK (本地用firebase-adminsdk-playground.json)
var firebaseCredentialPath = Path.Combine(builder.Environment.ContentRootPath, "firebase-adminsdk-playground.json");
if (!string.IsNullOrEmpty(firebaseCredentialPath) && File.Exists(firebaseCredentialPath))
{
    try
    {
        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromFile(firebaseCredentialPath)
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

// Firebase JWT Authentication
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

// CORS (Render用)
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? builder.Configuration["FrontendUrl"]
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

// Swagger (開發用)
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
app.Use(async (context, next) =>
{
    context.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups";
    await next();
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health Check (Render用)
app.MapGet("/health", () => new
{
    status = "healthy",
    message = "VocabularyAPI on Render",
    timestamp = DateTime.UtcNow,
    port = port,
    environment = app.Environment.EnvironmentName
});

Console.WriteLine($"🚀 VocabularyAPI starting on http://0.0.0.0:{port}");
Console.WriteLine($"   Health: http://localhost:{port}/health");
Console.WriteLine($"   Swagger: http://localhost:{port}/swagger");

app.Run();
