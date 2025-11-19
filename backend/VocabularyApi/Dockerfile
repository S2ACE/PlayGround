# ============================================
# 階段 1: Base - 運行環境
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# ============================================
# 階段 2: Build - 編譯專案
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# 🔧 複製 .csproj 並還原套件
# Dockerfile 和 .csproj 在同一個資料夾,所以直接複製
COPY ["VocabularyApi.csproj", "VocabularyApi/"]
RUN dotnet restore "VocabularyApi/VocabularyApi.csproj"

# 🔧 複製所有專案檔案
COPY . VocabularyApi/

# 切換到專案目錄並編譯
WORKDIR "/src/VocabularyApi"
RUN dotnet build "VocabularyApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

# ============================================
# 階段 3: Publish - 發布專案
# ============================================
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "VocabularyApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ============================================
# 階段 4: Final - 最終映像 (這是實際運行的容器)
# ============================================
FROM base AS final
WORKDIR /app

# 從 publish 階段複製編譯好的檔案
COPY --from=publish /app/publish .

# 🔧 Railway 會提供 PORT 環境變數,設定 ASP.NET Core 監聽這個端口
ENV ASPNETCORE_URLS=http://+:${PORT}

# 容器啟動時執行的命令
ENTRYPOINT ["dotnet", "VocabularyApi.dll"]
