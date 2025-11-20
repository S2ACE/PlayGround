# Base 階段:運行環境
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build 階段:編譯專案
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release

# 🔧 關鍵:設定工作目錄為 /src
WORKDIR /src

# 🔧 複製所有檔案到 /src (包括 .csproj)
COPY . .

# 🔧 現在可以找到 VocabularyAPI.csproj
RUN dotnet restore "VocabularyAPI.csproj"

# 編譯專案
RUN dotnet build "VocabularyAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish 階段:打包
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "VocabularyAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final 階段:最終映像
FROM base AS final
WORKDIR /app

# 從 publish 階段複製編譯好的檔案
COPY --from=publish /app/publish .

# 設定監聽 Railway 的 PORT
ENV ASPNETCORE_URLS=http://+:${PORT}

# 啟動應用
ENTRYPOINT ["dotnet", "VocabularyAPI.dll"]