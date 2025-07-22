@echo off
echo Deploying Firebase Storage Rules and CORS configuration...

REM Deploy Storage Rules
call firebase deploy --only storage

REM Set CORS configuration
call gsutil cors set cors.json gs://fir-6cfb0.appspot.com

echo Deployment complete!
