# Complete Website Cleanup Script
# This script performs HTTrack cleanup, branding standardization, and creates a clean deployment structure

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDirectory,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputDirectory,
    
    [switch]$ShowDetails
)

# Function to write detailed output
function Write-DetailedOutput {
    param([string]$Message)
    if ($ShowDetails) {
        Write-Host $Message -ForegroundColor Green
    }
}

# Function to clean HTTrack artifacts and standardize branding
function Clean-WebsiteContent {
    param([string]$Content)
    
    # === HTTrack Cleanup ===
    # Remove HTTrack mirror comments (comprehensive pattern)
    $Content = $Content -replace '<!-- Mirrored from [^>]*? -->', ''
    
    # Remove HTTrack added meta tags and comments
    $Content = $Content -replace '<!-- Added by HTTrack --><meta[^>]*?><!-- /Added by HTTrack -->', ''
    
    # Remove any remaining HTTrack comments
    $Content = $Content -replace '<!-- [^>]*?HTTrack[^>]*? -->', ''
    
    # Clean up any remaining HTTrack references in comments
    $Content = $Content -replace 'HTTrack Website Copier[^>]*?>', ''
    
    # Remove duplicate DOCTYPE declarations
    $Content = $Content -replace '<!DOCTYPE html>\s*<!DOCTYPE html>', '<!DOCTYPE html>'
    $Content = $Content -replace '<!DOCTYPE html>\s*<!DOCTYPE html>', '<!DOCTYPE html>'
    
    # Clean up BOM characters
    $Content = $Content -replace '^\uFEFF', ''
    
    # === Company Branding Standardization ===
    # Replace company name variations with standardized version
    $Content = $Content -replace 'Stone OnePoint Solutions(?!\s+Pvt\.\s+Ltd\.)', 'Stone OnePoint Solutions Pvt. Ltd.'
    
    # Remove legacy "Bayleaf" references
    $Content = $Content -replace 'Bayleaf\s*HR\s*Solutions?', 'Stone OnePoint Solutions Pvt. Ltd.'
    $Content = $Content -replace 'bayleafhrsolutions\.com', 'stoneonepointsolutions.in'
    $Content = $Content -replace 'www\.bayleafhrsolutions\.com', 'www.stoneonepointsolutions.in'
    
    # Standardize phone number format
    $Content = $Content -replace '\+91\s*8595378782', '+91 8595378782'
    $Content = $Content -replace '(?<!\+91\s)8595378782', '+91 8595378782'
    
    # Ensure consistent email format
    $Content = $Content -replace 'hr@bayleafhrsolutions\.com', 'hr@stoneonepointsolutions.in'
    $Content = $Content -replace 'info@bayleafhrsolutions\.com', 'hr@stoneonepointsolutions.in'
    
    # Fix any remaining domain references
    $Content = $Content -replace 'bayleafhrsolutions', 'stoneonepointsolutions'
    
    # === Clean up formatting ===
    # Clean up extra whitespace and line breaks but preserve structure
    $Content = $Content -replace '\s*\n\s*\n\s*', "`n"
    $Content = $Content -replace '>\s*\n\s*<', '>`n<'
    
    return $Content
}

# Function to process a single HTML file
function Process-HTMLFile {
    param(
        [string]$InputPath,
        [string]$OutputPath
    )
    
    try {
        Write-DetailedOutput "Processing: $InputPath"
        
        # Read the file content
        $content = Get-Content -Path $InputPath -Raw -Encoding UTF8
        
        # Clean HTTrack artifacts and standardize branding
        $cleanedContent = Clean-WebsiteContent -Content $content
        
        # Ensure output directory exists
        $outputDir = Split-Path -Path $OutputPath -Parent
        if (!(Test-Path -Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        # Write cleaned content to output file
        Set-Content -Path $OutputPath -Value $cleanedContent -Encoding UTF8
        
        Write-DetailedOutput "Cleaned: $OutputPath"
        return $true
    }
    catch {
        Write-Error "Error processing $InputPath : $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    Write-Host "Starting complete website cleanup process..." -ForegroundColor Yellow
    Write-Host "Source: $SourceDirectory" -ForegroundColor Cyan
    Write-Host "Output: $OutputDirectory" -ForegroundColor Cyan
    
    # Validate source directory
    if (!(Test-Path -Path $SourceDirectory)) {
        throw "Source directory does not exist: $SourceDirectory"
    }
    
    # Create output directory if it doesn't exist
    if (!(Test-Path -Path $OutputDirectory)) {
        New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
        Write-DetailedOutput "Created output directory: $OutputDirectory"
    }
    
    # Get all HTML files from source directory
    $htmlFiles = Get-ChildItem -Path $SourceDirectory -Filter "*.html" -Recurse
    
    if ($htmlFiles.Count -eq 0) {
        Write-Warning "No HTML files found in source directory"
        return
    }
    
    Write-Host "Found $($htmlFiles.Count) HTML files to process" -ForegroundColor Yellow
    
    $processedCount = 0
    $errorCount = 0
    
    # Process each HTML file - create flat structure in output
    foreach ($file in $htmlFiles) {
        # Use just the filename for output (flat structure)
        $outputPath = Join-Path -Path $OutputDirectory -ChildPath $file.Name
        
        if (Process-HTMLFile -InputPath $file.FullName -OutputPath $outputPath) {
            $processedCount++
        } else {
            $errorCount++
        }
    }
    
    # Copy assets directory maintaining structure
    Write-Host "Copying assets..." -ForegroundColor Yellow
    
    $assetsSource = Join-Path -Path $SourceDirectory -ChildPath "assets"
    if (Test-Path -Path $assetsSource) {
        $assetsOutput = Join-Path -Path $OutputDirectory -ChildPath "assets"
        
        # Copy entire assets directory
        Copy-Item -Path $assetsSource -Destination $assetsOutput -Recurse -Force
        Write-DetailedOutput "Copied assets directory to: $assetsOutput"
    }
    
    # Summary
    Write-Host "`nWebsite cleanup completed!" -ForegroundColor Green
    Write-Host "Processed HTML files: $processedCount" -ForegroundColor Green
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host "All files processed successfully!" -ForegroundColor Green
        Write-Host "Website is ready for deployment in: $OutputDirectory" -ForegroundColor Green
    }
}
catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}