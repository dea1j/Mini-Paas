FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY ["AppTwo.csproj", "./"]
RUN dotnet restore "AppTwo.csproj"
COPY . .
RUN dotnet publish "AppTwo.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "AppTwo.dll"]