@echo off

REM Script to switch between preview environment and separate app deployment for dev-breakable branch

echo Azure Static Web Apps - Dev Deployment Configuration
echo ====================================================
echo.
echo Select deployment option for dev-breakable branch:
echo 1) Preview Environment (uses existing app)
echo 2) Separate Static Web App
echo.
set /p choice="Enter your choice (1 or 2): "

set WORKFLOW_DIR=.github\workflows
set PREVIEW_WORKFLOW=azure-static-web-apps-dev-breakable.yml
set SEPARATE_WORKFLOW=azure-static-web-apps-dev-breakable-separate.yml.example

if "%choice%"=="1" (
    echo.
    echo Configuring for Preview Environment deployment...
    
    if not exist "%WORKFLOW_DIR%\%PREVIEW_WORKFLOW%" (
        echo Error: %WORKFLOW_DIR%\%PREVIEW_WORKFLOW% not found!
        exit /b 1
    )
    
    if exist "%WORKFLOW_DIR%\azure-static-web-apps-dev-breakable-separate.yml" (
        move "%WORKFLOW_DIR%\azure-static-web-apps-dev-breakable-separate.yml" "%WORKFLOW_DIR%\%SEPARATE_WORKFLOW%" >nul
        echo √ Disabled separate app workflow
    )
    
    echo √ Preview environment deployment is active
    echo.
    echo Your dev environment will be available at:
    echo https://green-tree-0cc12f61e-devbreakable.westus2.6.azurestaticapps.net/
    
) else if "%choice%"=="2" (
    echo.
    echo Configuring for Separate Static Web App deployment...
    
    if not exist "%WORKFLOW_DIR%\%SEPARATE_WORKFLOW%" (
        echo Error: %WORKFLOW_DIR%\%SEPARATE_WORKFLOW% not found!
        exit /b 1
    )
    
    if exist "%WORKFLOW_DIR%\%PREVIEW_WORKFLOW%" (
        move "%WORKFLOW_DIR%\%PREVIEW_WORKFLOW%" "%WORKFLOW_DIR%\%PREVIEW_WORKFLOW%.bak" >nul
        echo √ Backed up preview workflow to %PREVIEW_WORKFLOW%.bak
    )
    
    copy "%WORKFLOW_DIR%\%SEPARATE_WORKFLOW%" "%WORKFLOW_DIR%\%PREVIEW_WORKFLOW%" >nul
    echo √ Activated separate app workflow
    
    echo.
    echo ⚠️  IMPORTANT: You need to:
    echo 1. Create a new Static Web App in Azure Portal
    echo 2. Add the deployment token to GitHub Secrets as:
    echo    AZURE_STATIC_WEB_APPS_API_TOKEN_DEV_BREAKABLE
    echo.
    echo See AZURE_DEV_DEPLOYMENT.md for detailed instructions
    
) else (
    echo Invalid choice. Please run the script again and select 1 or 2.
    exit /b 1
)

echo.
echo Configuration complete! Commit and push your changes to apply.
pause 