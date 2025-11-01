#!/bin/bash

# Deployment Script for Stone OnePoint Solutions Website
# This script handles the deployment process for different environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_ROOT/public"

# Default values
ENVIRONMENT="production"
SERVER_TYPE="apache"
DRY_RUN=false

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -e, --environment ENV    Deployment environment (development|staging|production)"
    echo "  -s, --server TYPE        Server type (apache|nginx)"
    echo "  -d, --dry-run           Perform a dry run without actual deployment"
    echo "  -h, --help              Display this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--server)
            SERVER_TYPE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be development, staging, or production."
    exit 1
fi

# Validate server type
if [[ ! "$SERVER_TYPE" =~ ^(apache|nginx)$ ]]; then
    echo "Error: Invalid server type. Must be apache or nginx."
    exit 1
fi

echo "=== Stone OnePoint Solutions Website Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "Server Type: $SERVER_TYPE"
echo "Dry Run: $DRY_RUN"
echo "=================================================="

# Check if build exists
if [[ ! -d "$PUBLIC_DIR" ]] || [[ -z "$(ls -A "$PUBLIC_DIR" 2>/dev/null)" ]]; then
    echo "Error: No build found in $PUBLIC_DIR"
    echo "Please run the build script first: node scripts/build.js $ENVIRONMENT"
    exit 1
fi

# Pre-deployment validation
echo "Running pre-deployment validation..."

# Check for required files
REQUIRED_FILES=("index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$PUBLIC_DIR/$file" ]]; then
        echo "Error: Required file $file not found in build"
        exit 1
    fi
done

echo "Pre-deployment validation passed."

# Copy server configuration
CONFIG_SOURCE="$PROJECT_ROOT/config/$SERVER_TYPE"
if [[ -d "$CONFIG_SOURCE" ]]; then
    echo "Copying $SERVER_TYPE configuration files..."
    if [[ "$DRY_RUN" == "false" ]]; then
        # In a real deployment, this would copy to the appropriate server location
        echo "Configuration files would be copied from $CONFIG_SOURCE"
    else
        echo "[DRY RUN] Would copy configuration files from $CONFIG_SOURCE"
    fi
fi

# Deployment summary
echo ""
echo "=== Deployment Summary ==="
echo "Environment: $ENVIRONMENT"
echo "Build Directory: $PUBLIC_DIR"
echo "Server Configuration: $CONFIG_SOURCE"
echo "=========================="

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo "DRY RUN COMPLETE - No actual deployment performed"
else
    echo ""
    echo "Deployment preparation complete!"
    echo "Next steps:"
    echo "1. Upload contents of $PUBLIC_DIR to your web server"
    echo "2. Configure your server using files from $CONFIG_SOURCE"
    echo "3. Run post-deployment validation"
fi