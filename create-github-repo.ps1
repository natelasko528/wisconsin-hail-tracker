# PowerShell script to create GitHub repository and push code
# Usage: .\create-github-repo.ps1 -RepoName "wisconsin-hail-tracker" -Username "YOUR_USERNAME" -Token "YOUR_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$ErrorActionPreference = "Stop"

Write-Host "Creating GitHub repository: $RepoName" -ForegroundColor Green

# Create repository via GitHub API
$body = @{
    name = $RepoName
    description = "Wisconsin Hail Tracker - Full-stack application for tracking hail storms and leads"
    private = $false
    auto_init = $false
} | ConvertTo-Json

$headers = @{
    Authorization = "token $Token"
    Accept = "application/vnd.github.v3+json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Repository created successfully!" -ForegroundColor Green
    Write-Host "Repository URL: $($response.html_url)" -ForegroundColor Cyan
    
    # Add remote and push
    $remoteUrl = $response.clone_url
    git remote remove origin 2>$null
    git remote add origin $remoteUrl
    Write-Host "Remote 'origin' added" -ForegroundColor Green
    
    Write-Host "Pushing code to main branch..." -ForegroundColor Yellow
    git push -u origin main
    
    Write-Host "`nSuccess! Your code has been pushed to GitHub." -ForegroundColor Green
    Write-Host "Repository: $($response.html_url)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

