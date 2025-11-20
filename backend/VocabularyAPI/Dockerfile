# Base 階段:運行環境
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build 階段:編譯專案
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 複製所有檔案
COPY . .

# 🔧 修正:指定專案檔名稱
RUN dotnet restore "VocabularyAPI.csproj"

# 🔧 修正:指定專案檔名稱
RUN dotnet build "VocabularyAPI.csproj" -c Release -o /app/build

# Publish 階段:打包
FROM build AS publish
# 🔧 修正:指定專案檔名稱
RUN dotnet publish "VocabularyAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final 階段:最終映像
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# 設定監聽 Railway 的 PORT
ENV ASPNETCORE_URLS=http://+:${PORT}

# 啟動應用
ENTRYPOINT ["dotnet", "VocabularyApi.dll"]
