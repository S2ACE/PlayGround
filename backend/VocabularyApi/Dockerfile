# ============================================
# 階段 1: Base - 運行環境
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# ============================================
# 階段 2: Build - 編譯專案
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# ✅ 因為 Dockerfile 在專案資料夾內,路徑很簡單
COPY ["VocabularyApi.csproj", "."]

# 還原 NuGet 套件
RUN dotnet restore "VocabularyApi.csproj"

# 複製所有程式碼
COPY . .

# 編譯專案
RUN dotnet build "VocabularyApi.csproj" -c $BUILD_CONFIGURATION -o /app/build


# ============================================
# 階段 3: Publish - 發布專案
# ============================================
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "VocabularyApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false


# ============================================
# 階段 4: Final - 最終映像
# ============================================
FROM base AS final
WORKDIR /app

# 從 publish 階段複製檔案
COPY --from=publish /app/publish .

# 🔧 Railway 會自動提供 PORT 環境變數
ENV ASPNETCORE_URLS=http://+:$PORT

# 啟動應用
ENTRYPOINT ["dotnet", "VocabularyApi.dll"]