# Navigation Structure and Internal Links Cleanup Script
# This script cleans up HTTrack-style links and ensures consistent navigation structure

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

# Function to clean up navigation and internal links
function Clean-NavigationLinks {
    param([string]$Content)
    
    # === HTTrack Link Cleanup ===
    # Convert HTTrack-style links to clean relative paths
    $Content = $Content -replace 'href="[^"]*www\.bayleafhrsolutions\.com/', 'href="'
    $Content = $Content -replace 'src="[^"]*www\.bayleafhrsolutions\.com/', 'src="'
    
    # Remove HTTrack-specific URL parameters
    $Content = $Content -replace '\?[^"]*HTTrack[^"]*"', '"'
    $Content = $Content -replace 'href="([^"]+)\.php"', 'href="$1.html"'
    
    # Fix relative paths that might have been broken
    $Content = $Content -replace 'href="\.\./', 'href="'
    $Content = $Content -replace 'src="\.\./', 'src="'
    
    # === Navigation Structure Consistency ===
    # Ensure consistent navigation menu structure
    # Fix any broken navigation links
    $Content = $Content -replace 'href="index-2\.html"', 'href="index.html"'
    
    # === Clean up formatting issues ===
    # Fix the duplicate DOCTYPE issue
    $Content = $Content -replace '<!DOCTYPE html>\s*<!DOCTYPE html>', '<!DOCTYPE html>'
    $Content = $Content -replace '<!DOCTYPE html>\s*<!DOCTYPE html>', '<!DOCTYPE html>'
    
    # Remove BOM characters
    $Content = $Content -replace '^\uFEFF', ''
    
    # Fix the `n literal characters that appeared in the output
    $Content = $Content -replace '`n', "`n"
    
    # Clean up extra whitespace but preserve HTML structure
    $Content = $Content -replace '\s*\n\s*\n\s*', "`n"
    
    # Ensure proper line breaks between HTML elements
    $Content = $Content -replace '>\s*<', ">`n<"
    
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
        
        # Clean navigation and links
        $cleanedContent = Clean-NavigationLinks -Content $content
        
        # Ensure output directory exists
        $outputDir = Split-Path -Path $OutputPath -Parent
        if (!(Test-Path -Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        # Write cleaned content to output file
        Set-Content -Path $OutputPath -Value $cleanedContent -Encoding UTF8
        
        Write-DetailedOutput "Cleaned navigation: $OutputPath"
        return $true
    }
    catch {
        Write-Error "Error processing $InputPath : $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    Write-Host "Starting navigation cleanup process..." -ForegroundColor Yellow
    Write-Host "Source: $SourceDirectory" -ForegroundColor Cyan
    Write-Host "Output: $OutputDirectory" -ForegroundColor Cyan
    
    # Validate source directory
    if (!(Test-Path -Path $SourceDirectory)) {
        throw "Source directory does not exist: $SourceDirectory"
    }
    
    # Get all HTML files from source directory
    $htmlFiles = Get-ChildItem -Path $SourceDirectory -Filter "*.html"
    
    if ($htmlFiles.Count -eq 0) {
        Write-Warning "No HTML files found in source directory"
        return
    }
    
    Write-Host "Found $($htmlFiles.Count) HTML files to process" -ForegroundColor Yellow
    
    $processedCount = 0
    $errorCount = 0
    
    # Process each HTML file
    foreach ($file in $htmlFiles) {
        $outputPath = Join-Path -Path $OutputDirectory -ChildPath $file.Name
        
        if (Process-HTMLFile -InputPath $file.FullName -OutputPath $outputPath) {
            $processedCount++
        } else {
            $errorCount++
        }
    }
    
    # Summary
    Write-Host "`nNavigation cleanup completed!" -ForegroundColor Green
    Write-Host "Processed HTML files: $processedCount" -ForegroundColor Green
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host "All navigation links cleaned successfully!" -ForegroundColor Green
    }
}
catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}