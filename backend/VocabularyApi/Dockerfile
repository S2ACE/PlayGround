# Base 階段:運行環境
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build 階段:編譯專案
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 複製所有檔案 (因為 build context 已正確設定)
COPY . .

# 還原 NuGet 套件
RUN dotnet restore

# 編譯專案
RUN dotnet build -c Release -o /app/build

# Publish 階段:打包
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Final 階段:最終映像
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# 設定監聽 Railway 的 PORT
ENV ASPNETCORE_URLS=http://+:${PORT}

# 啟動應用
ENTRYPOINT ["dotnet", "VocabularyApi.dll"]
