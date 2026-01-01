@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo Deploying ONLY handleAsaasWebhook...
firebase deploy --only functions:handleAsaasWebhook
