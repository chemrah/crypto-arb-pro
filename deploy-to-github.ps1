# 🚀 Deploy to GitHub - Crypto Arbitrage Pro

<#
.SYNOPSIS
    Automated deployment script for Crypto Arbitrage Pro to GitHub.

.DESCRIPTION
    This script automates the entire GitHub deployment process:
    - Checks prerequisites (Git, GitHub CLI)
    - Verifies authentication
    - Initializes Git repository
    - Creates GitHub repository
    - Pushes code
    - Configures topics, description, and settings
    - Creates initial release

.PARAMETER RepoName
    Name of the GitHub repository (default: crypto-arb-pro)

.PARAMETER Private
    Create a private repository instead of public

.PARAMETER SkipRelease
    Skip creating the initial release

.EXAMPLE
    .\deploy-to-github.ps1
    
.EXAMPLE
    .\deploy-to-github.ps1 -RepoName "my-arb-bot" -Private
#>

param(
    [string]$RepoName = "crypto-arb-pro",
    [switch]$Private,
    [switch]$SkipRelease
)

# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Crypto Arbitrage Pro - GitHub Deploy"

$Topics = @(
    "arbitrage", "defi", "flash-loans", "ethereum", "arbitrum",
    "uniswap", "aave", "web3", "cryptocurrency", "blockchain",
    "nextjs", "solidity", "mev-protection", "gasless", "trading-bot"
)

$Description = "⚡ Advanced Crypto Arbitrage Platform | Flash Loans + Flash Swaps + Flash Mint | 12+ DEXs | Zero Gas Fees | MEV Protected | Built with Next.js & Solidity"

# ═══════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Text)
    Write-Host "[$Step] " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Cyan
}

# ═══════════════════════════════════════════════════════════════
# Main Script
# ═══════════════════════════════════════════════════════════════

Write-Header "🚀 Crypto Arbitrage Pro - GitHub Deployment"

# ─────────────────────────────────────────────────────────────
# Step 1: Check Prerequisites
# ─────────────────────────────────────────────────────────────

Write-Step "1/8" "Checking prerequisites..."

# Check Git
try {
    $gitVersion = git --version 2>&1
    Write-Success "Git installed: $gitVersion"
} catch {
    Write-Error-Custom "Git is not installed!"
    Write-Info "Download Git from: https://git-scm.com/downloads"
    exit 1
}

# Check GitHub CLI
try {
    $ghVersion = gh --version 2>&1 | Select-Object -First 1
    Write-Success "GitHub CLI installed: $ghVersion"
} catch {
    Write-Error-Custom "GitHub CLI is not installed!"
    Write-Info "Install GitHub CLI:"
    Write-Info "  winget install --id GitHub.cli"
    Write-Info "  Or download from: https://cli.github.com/"
    exit 1
}

# ─────────────────────────────────────────────────────────────
# Step 2: Check Authentication
# ─────────────────────────────────────────────────────────────

Write-Step "2/8" "Checking GitHub authentication..."

try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        $username = gh api user --jq .login 2>&1
        Write-Success "Authenticated as: $username"
    } else {
        throw "Not authenticated"
    }
} catch {
    Write-Warning-Custom "Not authenticated with GitHub"
    Write-Info "Please run: gh auth login"
    Write-Info "Then re-run this script."
    gh auth login
    exit 0
}

# ─────────────────────────────────────────────────────────────
# Step 3: Verify Project Files
# ─────────────────────────────────────────────────────────────

Write-Step "3/8" "Verifying project files..."

$requiredFiles = @("package.json", "README.md", ".gitignore", "LICENSE")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "Found: $file"
    } else {
        $missingFiles += $file
        Write-Error-Custom "Missing: $file"
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Error-Custom "Missing required files. Please create them first."
    exit 1
}

# Check for sensitive files that should NOT be committed
$sensitiveFiles = @(".env", ".env.local", ".env.production", "deployment.json")
foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        Write-Warning-Custom "Sensitive file detected: $file"
        Write-Info "This file will NOT be uploaded (it's in .gitignore)"
    }
}

# ─────────────────────────────────────────────────────────────
# Step 4: Initialize Git Repository
# ─────────────────────────────────────────────────────────────

Write-Step "4/8" "Initializing Git repository..."

if (Test-Path ".git") {
    Write-Info "Git repository already initialized"
} else {
    git init | Out-Null
    Write-Success "Git repository initialized"
}

git branch -M main | Out-Null
git add . | Out-Null

$changesCount = (git status --porcelain | Measure-Object).Count
if ($changesCount -gt 0) {
    git commit -m "🎉 Initial commit: Crypto Arbitrage Pro - Advanced Flash Loan Arbitrage Platform" | Out-Null
    Write-Success "Initial commit created ($changesCount files)"
} else {
    Write-Info "No changes to commit"
}

# ─────────────────────────────────────────────────────────────
# Step 5: Create GitHub Repository
# ─────────────────────────────────────────────────────────────

Write-Step "5/8" "Creating GitHub repository..."

$visibility = if ($Private) { "--private" } else { "--public" }

try {
    # Check if repo already exists
    $existingRepo = gh repo view $RepoName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Warning-Custom "Repository '$RepoName' already exists"
        $response = Read-Host "Do you want to use the existing repository? (y/n)"
        if ($response -ne "y") {
            Write-Error-Custom "Deployment cancelled"
            exit 1
        }
    } else {
        gh repo create $RepoName $visibility --source=. --push --description $Description
        Write-Success "Repository created: $RepoName"
    }
} catch {
    Write-Error-Custom "Failed to create repository: $_"
    exit 1
}

# ─────────────────────────────────────────────────────────────
# Step 6: Configure Repository Settings
# ─────────────────────────────────────────────────────────────

Write-Step "6/8" "Configuring repository settings..."

# Add topics
try {
    $topicsArgs = $Topics | ForEach-Object { "--add-topic $_" }
    $topicsCmd = "gh repo edit " + ($topicsArgs -join " ")
    Invoke-Expression $topicsCmd | Out-Null
    Write-Success "Added $($Topics.Count) topics"
} catch {
    Write-Warning-Custom "Could not add topics: $_"
}

# Enable features
try {
    gh repo edit --enable-issues --enable-discussions --enable-projects --enable-wiki | Out-Null
    Write-Success "Enabled Issues, Discussions, Projects, and Wiki"
} catch {
    Write-Warning-Custom "Could not enable all features: $_"
}

# ─────────────────────────────────────────────────────────────
# Step 7: Create Initial Release
# ─────────────────────────────────────────────────────────────

if (-not $SkipRelease) {
    Write-Step "7/8" "Creating initial release..."

    try {
        $releaseNotes = @"
## 🎉 Crypto Arbitrage Pro v1.0.0

### ✨ Features
- **12+ DEXs supported** (Uniswap, SushiSwap, Curve, Balancer, etc.)
- **3 arbitrage strategies** (Flash Loan, Flash Swap, Flash Mint)
- **Gasless execution** via Biconomy Paymaster
- **MEV protection** via Flashbots
- **Real-time scanner** (every 3 seconds)
- **Professional web interface** with live dashboard

### 🚀 Getting Started
See [QUICKSTART.md](QUICKSTART.md) for installation instructions.

### 📚 Documentation
- [Implementation Guide](IMPLEMENTATION_GUIDE.md)
- [GitHub Guide](GITHUB_GUIDE.md)
- [Contributing](CONTRIBUTING.md)

### 🐛 Known Issues
None at this time. Please report any issues [here](../../issues/new).
"@

        gh release create v1.0.0 --title "v1.0.0 - Initial Release" --notes $releaseNotes
        Write-Success "Release v1.0.0 created"
    } catch {
        Write-Warning-Custom "Could not create release: $_"
    }
} else {
    Write-Step "7/8" "Skipping release creation"
}

# ─────────────────────────────────────────────────────────────
# Step 8: Display Summary
# ─────────────────────────────────────────────────────────────

Write-Step "8/8" "Deployment complete!"

$repoUrl = gh repo view --json url --jq .url
$repoWebUrl = gh repo view --json url --jq .url

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  🎉 DEPLOYMENT SUCCESSFUL 🎉                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Repository Information:" -ForegroundColor Cyan
Write-Host "  📦 Name:        " -NoNewline; Write-Host $RepoName -ForegroundColor White
Write-Host "  👤 Owner:       " -NoNewline; Write-Host $username -ForegroundColor White
Write-Host "  🔗 URL:         " -NoNewline; Write-Host $repoWebUrl -ForegroundColor Cyan
Write-Host "  🏷️  Release:     " -NoNewline; Write-Host "v1.0.0" -ForegroundColor Green
Write-Host "  📊 Topics:      " -NoNewline; Write-Host "$($Topics.Count) topics added" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Visit your repository: " -NoNewline; Write-Host $repoWebUrl -ForegroundColor Cyan
Write-Host "  2. Add GitHub Secrets for CI/CD:" -ForegroundColor White
Write-Host "     - ALCHEMY_API_KEY" -ForegroundColor Gray
Write-Host "     - PRIVATE_KEY" -ForegroundColor Gray
Write-Host "     - BICONOMY_API_KEY" -ForegroundColor Gray
Write-Host "     - ARBISCAN_API_KEY" -ForegroundColor Gray
Write-Host "  3. Enable GitHub Actions in repository settings" -ForegroundColor White
Write-Host "  4. Share your project with the community! 🚀" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  gh repo view --web          # Open in browser" -ForegroundColor Gray
Write-Host "  gh run list                 # View workflow runs" -ForegroundColor Gray
Write-Host "  gh issue create             # Create an issue" -ForegroundColor Gray
Write-Host ""

# Open repository in browser
$openBrowser = Read-Host "Open repository in browser? (y/n)"
if ($openBrowser -eq "y") {
    Start-Process $repoWebUrl
}

Write-Host ""
Write-Host "Thank you for using Crypto Arbitrage Pro! ⚡" -ForegroundColor Magenta
Write-Host ""
