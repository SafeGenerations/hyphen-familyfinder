#!/bin/bash

# Script to switch between preview environment and separate app deployment for dev-breakable branch

echo "Azure Static Web Apps - Dev Deployment Configuration"
echo "===================================================="
echo ""
echo "Select deployment option for dev-breakable branch:"
echo "1) Preview Environment (uses existing app)"
echo "2) Separate Static Web App"
echo ""
read -p "Enter your choice (1 or 2): " choice

WORKFLOW_DIR=".github/workflows"
PREVIEW_WORKFLOW="azure-static-web-apps-dev-breakable.yml"
SEPARATE_WORKFLOW="azure-static-web-apps-dev-breakable-separate.yml.example"

case $choice in
    1)
        echo ""
        echo "Configuring for Preview Environment deployment..."
        
        # Ensure preview workflow exists
        if [ ! -f "$WORKFLOW_DIR/$PREVIEW_WORKFLOW" ]; then
            echo "Error: $WORKFLOW_DIR/$PREVIEW_WORKFLOW not found!"
            exit 1
        fi
        
        # Remove .example extension if separate workflow exists
        if [ -f "$WORKFLOW_DIR/azure-static-web-apps-dev-breakable-separate.yml" ]; then
            mv "$WORKFLOW_DIR/azure-static-web-apps-dev-breakable-separate.yml" "$WORKFLOW_DIR/$SEPARATE_WORKFLOW"
            echo "✓ Disabled separate app workflow"
        fi
        
            echo "✓ Preview environment deployment is active"
    echo ""
    echo "Your dev environment will be available at:"
    echo "https://green-tree-0cc12f61e-devbreakable.westus2.6.azurestaticapps.net/"
        ;;
        
    2)
        echo ""
        echo "Configuring for Separate Static Web App deployment..."
        
        # Check if separate workflow example exists
        if [ ! -f "$WORKFLOW_DIR/$SEPARATE_WORKFLOW" ]; then
            echo "Error: $WORKFLOW_DIR/$SEPARATE_WORKFLOW not found!"
            exit 1
        fi
        
        # Backup preview workflow
        if [ -f "$WORKFLOW_DIR/$PREVIEW_WORKFLOW" ]; then
            mv "$WORKFLOW_DIR/$PREVIEW_WORKFLOW" "$WORKFLOW_DIR/$PREVIEW_WORKFLOW.bak"
            echo "✓ Backed up preview workflow to $PREVIEW_WORKFLOW.bak"
        fi
        
        # Activate separate workflow
        cp "$WORKFLOW_DIR/$SEPARATE_WORKFLOW" "$WORKFLOW_DIR/$PREVIEW_WORKFLOW"
        echo "✓ Activated separate app workflow"
        
        echo ""
        echo "⚠️  IMPORTANT: You need to:"
        echo "1. Create a new Static Web App in Azure Portal"
        echo "2. Add the deployment token to GitHub Secrets as:"
        echo "   AZURE_STATIC_WEB_APPS_API_TOKEN_DEV_BREAKABLE"
        echo ""
        echo "See AZURE_DEV_DEPLOYMENT.md for detailed instructions"
        ;;
        
    *)
        echo "Invalid choice. Please run the script again and select 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "Configuration complete! Commit and push your changes to apply." 