# Final Website Cleanup Script
# This script performs final cleanup to fix any remaining formatting issues

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDirectory,
    
    [switch]$ShowDetails
)

# Function to write detailed output
function Write-DetailedOutput {
    param([string]$Message)
    if ($ShowDetails) {
        Write-Host $Message -ForegroundColor Green
    }
}

# Function to perform final cleanup
function Final-Cleanup {
    param([string]$Content)
    
    # Fix duplicate DOCTYPE declarations
    $Content = $Content -replace '<!DOCTYPE html>\s*<!DOCTYPE html>', '<!DOCTYPE html>'
    $Content = $Content -replace '<!DOCTYPE html>\s*<!DOCTYPE html>', '<!DOCTYPE html>'
    
    # Remove BOM characters at the beginning
    $Content = $Content -replace '^\uFEFF', ''
    
    # Remove any remaining literal `n characters
    $Content = $Content -replace '`n', "`n"
    
    # Clean up extra whitespace while preserving HTML structure
    $Content = $Content -replace '\s*\n\s*\n\s*', "`n"
    
    # Ensure proper formatting for HTML elements
    $Content = $Content -replace '>\s*<', ">`n<"
    
    # Fix any remaining HTTrack artifacts that might have been missed
    $Content = $Content -replace 'HTTrack[^>]*>', ''
    
    return $Content
}

# Function to process a single HTML file
function Process-HTMLFile {
    param([string]$FilePath)
    
    try {
        Write-DetailedOutput "Final cleanup: $FilePath"
        
        # Read the file content
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        
        # Perform final cleanup
        $cleanedContent = Final-Cleanup -Content $content
        
        # Write cleaned content back to the same file
        Set-Content -Path $FilePath -Value $cleanedContent -Encoding UTF8
        
        Write-DetailedOutput "Completed: $FilePath"
        return $true
    }
    catch {
        Write-Error "Error processing $FilePath : $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    Write-Host "Starting final cleanup process..." -ForegroundColor Yellow
    Write-Host "Directory: $SourceDirectory" -ForegroundColor Cyan
    
    # Validate source directory
    if (!(Test-Path -Path $SourceDirectory)) {
        throw "Source directory does not exist: $SourceDirectory"
    }
    
    # Get all HTML files
    $htmlFiles = Get-ChildItem -Path $SourceDirectory -Filter "*.html"
    
    if ($htmlFiles.Count -eq 0) {
        Write-Warning "No HTML files found in directory"
        return
    }
    
    Write-Host "Found $($htmlFiles.Count) HTML files to process" -ForegroundColor Yellow
    
    $processedCount = 0
    $errorCount = 0
    
    # Process each HTML file
    foreach ($file in $htmlFiles) {
        if (Process-HTMLFile -FilePath $file.FullName) {
            $processedCount++
        } else {
            $errorCount++
        }
    }
    
    # Summary
    Write-Host "`nFinal cleanup completed!" -ForegroundColor Green
    Write-Host "Processed HTML files: $processedCount" -ForegroundColor Green
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host "All files cleaned successfully!" -ForegroundColor Green
    }
}
catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}