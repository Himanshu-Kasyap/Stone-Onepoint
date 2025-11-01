# HTTrack Cleanup Script
# This script removes HTTrack artifacts from HTML files and prepares them for production deployment

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

# Function to clean HTTrack artifacts from HTML content
function Remove-HTTrackArtifacts {
    param([string]$Content)
    
    # Remove HTTrack mirror comments (more comprehensive pattern)
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
        
        # Remove HTTrack artifacts
        $cleanedContent = Remove-HTTrackArtifacts -Content $content
        
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
    Write-Host "Starting HTTrack cleanup process..." -ForegroundColor Yellow
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
    
    # Process each HTML file
    foreach ($file in $htmlFiles) {
        # Calculate relative path from source directory
        $relativePath = $file.FullName.Substring($SourceDirectory.Length).TrimStart('\', '/')
        $outputPath = Join-Path -Path $OutputDirectory -ChildPath $relativePath
        
        if (Process-HTMLFile -InputPath $file.FullName -OutputPath $outputPath) {
            $processedCount++
        } else {
            $errorCount++
        }
    }
    
    # Copy non-HTML files (assets, etc.)
    Write-Host "Copying non-HTML files..." -ForegroundColor Yellow
    
    $nonHtmlItems = Get-ChildItem -Path $SourceDirectory -Recurse | Where-Object { 
        $_.Extension -ne ".html" -and $_.Name -ne "hts-log.txt" -and $_.Name -notlike "hts-*"
    }
    
    foreach ($item in $nonHtmlItems) {
        $relativePath = $item.FullName.Substring($SourceDirectory.Length).TrimStart('\', '/')
        $outputPath = Join-Path -Path $OutputDirectory -ChildPath $relativePath
        
        if ($item.PSIsContainer) {
            # Create directory
            if (!(Test-Path -Path $outputPath)) {
                New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
                Write-DetailedOutput "Created directory: $outputPath"
            }
        } else {
            # Copy file
            $outputDir = Split-Path -Path $outputPath -Parent
            if (!(Test-Path -Path $outputDir)) {
                New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
            }
            Copy-Item -Path $item.FullName -Destination $outputPath -Force
            Write-DetailedOutput "Copied: $outputPath"
        }
    }
    
    # Summary
    Write-Host "`nHTTrack cleanup completed!" -ForegroundColor Green
    Write-Host "Processed HTML files: $processedCount" -ForegroundColor Green
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host "All files processed successfully!" -ForegroundColor Green
    }
}
catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}