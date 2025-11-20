# Base 階段:運行環境
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Build 階段:編譯專案
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# 🔧 複製整個 backend/VocabularyAPI 資料夾
COPY backend/VocabularyAPI/ .

# 現在 .csproj 在當前目錄
RUN dotnet restore "VocabularyAPI.csproj"

# 編譯專案
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
