using Microsoft.EntityFrameworkCore;
using VocabularyApi.DbContexts;
using VocabularyApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

var builder = WebApplication.CreateBuilder(args);

//初始化 Firebase Admin SDK
FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile("firebase-adminsdk-playground.json")
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 設定資料庫
builder.Services.AddDbContext<VocabularyContext>(options =>
    options.UseSqlServer(builder.Configuration.GetValue<string>("Database:Languages_Dev:ConnectionString")));

builder.Services.AddScoped<VocabularyService>();
builder.Services.AddScoped<MembersService>();

// 設定 Firebase JWT 驗證
var firebaseProjectId = builder.Configuration["Firebase:ProjectId"]; // 從 appsettings.json 讀取

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 啟用認證和授權中介軟體（順序很重要！）
app.UseAuthentication();  // 必須在 UseAuthorization 之前
app.UseAuthorization();

app.MapControllers();

app.Run();
