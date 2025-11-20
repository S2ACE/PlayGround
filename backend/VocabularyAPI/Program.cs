using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VocabularyAPI.DbContexts;
using VocabularyAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();

// Firebase 初始化 (支援環境變數和本地檔案)
var firebaseCredentialJson = Environment.GetEnvironmentVariable("FIREBASE_CREDENTIAL_JSON");

if (!string.IsNullOrEmpty(firebaseCredentialJson))
{
    // ✅ 生產環境:從環境變數讀取
    FirebaseApp.Create(new AppOptions()
    {
        Credential = GoogleCredential.FromJson(firebaseCredentialJson)
    });
}
else if (builder.Environment.IsDevelopment())
{
    // ✅ 開發環境:從檔案讀取
    var credentialPath = "firebase-adminsdk-playground.json";
    if (File.Exists(credentialPath))
    {
        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromFile(credentialPath)
        });
    }
    else
    {
        Console.WriteLine("Warning: Firebase credential file not found in development mode");
    }
}
else
{
    throw new Exception("Firebase credentials not configured. Set FIREBASE_CREDENTIAL_JSON environment variable.");
}

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 設定資料庫 (支援環境變數)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING")
    ?? builder.Configuration.GetValue<string>("Database:Languages_Dev:ConnectionString");

builder.Services.AddDbContext<VocabularyContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<VocabularyService>();
builder.Services.AddScoped<MembersService>();
builder.Services.AddScoped<FavouriteVocabularyService>();
builder.Services.AddScoped<VocabularyProgressService>();

// 設定 Firebase JWT 驗證 (支援環境變數)
var firebaseProjectId = Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID")
    ?? builder.Configuration["Firebase:ProjectId"];

if (string.IsNullOrEmpty(firebaseProjectId))
{
    throw new Exception("Firebase Project ID not configured");
}

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

// 加入授權服務
builder.Services.AddAuthorization();

//  加入 CORS (Railway 和 Vercel)
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? "http://localhost:5173"; // 本地開發預設

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Railway 不需要 HTTPS redirect
// app.UseHttpsRedirection();  // 註解掉,Railway 會處理 HTTPS

//  加入 CORS middleware
app.UseCors();

// 啟用認證和授權中介軟體（順序很重要！）
app.UseAuthentication();  // 必須在 UseAuthorization 之前
app.UseAuthorization();

app.MapControllers();

app.Run();
