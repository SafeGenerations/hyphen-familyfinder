## Overview

This document explains how to deploy the `dev-breakable` branch to a separate Azure environment for testing and development purposes. This allows testing experimental features without affecting the production deployment.

## Deployment Options

### Option 1: Preview Environment (Recommended) ✅

Uses Azure Static Web Apps preview environments feature to create a named environment within your existing Static Web App.

**Advantages:**
- Uses same Azure resource as production
- Automatic deployment on push to dev-breakable branch
- Named environment with consistent URL
- No additional Azure costs

  **Your URLs:**
  - Production: https://green-tree-0cc12f61e.westus2.azurestaticapps.net/
  - Dev-breakable: https://green-tree-0cc12f61e-devbreakable.westus2.6.azurestaticapps.net/ 

## Option 2: Deploy to a Separate Static Web App

If you need complete isolation between production and dev environments:

### Setup Steps:

1. **Create a new Static Web App in Azure Portal**:
   - Go to Azure Portal
   - Create a new Static Web App resource
   - Name it something like `genogram-builder-dev`
   - Choose the same region as your main app
   - Select "Custom" for deployment source

2. **Get the deployment token**:
   - In your new Static Web App, go to "Manage deployment token"
   - Copy the token

3. **Add the token to GitHub Secrets**:
   - Go to your GitHub repo Settings → Secrets and variables → Actions
   - Add new secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV_BREAKABLE`
   - Paste the token value

4. **Use the alternative workflow**:
   - Rename `.github/workflows/azure-static-web-apps-dev-breakable-separate.yml.example` 
   - to `.github/workflows/azure-static-web-apps-dev-breakable.yml`
   - Delete the preview environment version

### Benefits:
- ✅ Complete isolation from production
- ✅ Separate configuration and environment variables
- ✅ Independent scaling and settings
- ✅ Different custom domains possible

## Environment Variables

You can set different environment variables for dev builds:

```yaml
env:
  CI: false
  REACT_APP_ENVIRONMENT: "development"
  REACT_APP_API_URL: "https://dev-api.example.com"
  REACT_APP_DEBUG: "true"
```

## Monitoring Deployments

1. **GitHub Actions**: Check the Actions tab in your repository
2. **Azure Portal**: View deployment history in your Static Web App resource
3. **Branch Protection**: Consider adding branch protection rules for `dev-breakable`

## URL Structure

### Option 1 (Preview Environment):
- Production: `https://{auto-generated-name}.azurestaticapps.net`
- Dev: `https://dev-breakable.{auto-generated-name}.azurestaticapps.net`

### Option 2 (Separate App):
- Production: `https://{prod-app-name}.azurestaticapps.net`
- Dev: `https://{dev-app-name}.azurestaticapps.net`

## Troubleshooting

### Common Issues:

1. **Deployment fails with authentication error**:
   - Verify the API token is correctly set in GitHub Secrets
   - Check token hasn't expired

2. **Build fails**:
   - Check if `CI: false` is set to ignore warnings
   - Verify all dependencies are installed

3. **Preview environment not accessible**:
   - Wait 2-3 minutes after deployment
   - Check Azure Portal for deployment status

## Cost Considerations

- **Option 1**: No additional cost (included in your Static Web App plan)
- **Option 2**: Separate billing for the second Static Web App

## Next Steps

1. Choose your preferred option
2. Commit the appropriate workflow file
3. Push to the `dev-breakable` branch
4. Monitor the GitHub Actions for successful deployment
5. Access your dev environment at the appropriate URL 