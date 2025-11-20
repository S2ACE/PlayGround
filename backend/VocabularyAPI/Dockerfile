# Base 階段:運行環境
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build 階段:編譯專案
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# 複製所有檔案
COPY . .

# 🔍 偵錯步驟 1: 顯示當前目錄
RUN pwd

# 🔍 偵錯步驟 2: 列出所有檔案和資料夾
RUN ls -la

# 🔍 偵錯步驟 3: 遞迴列出所有檔案
RUN find . -type f

# 🔍 偵錯步驟 4: 查找所有 .csproj 檔案
RUN find . -name "*.csproj"

# 現在嘗試 restore (如果失敗,至少我們能看到上面的輸出)
RUN dotnet restore "VocabularyAPI.csproj" || echo "Restore failed, but continuing to show debug info"

# 如果到這裡,表示 restore 成功
RUN dotnet build "VocabularyAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish 階段
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "VocabularyAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final 階段
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:${PORT}
ENTRYPOINT ["dotnet", "VocabularyAPI.dll"]
