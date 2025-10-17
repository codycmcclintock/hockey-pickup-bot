#!/bin/bash

echo "🚀 Hockey Pickup Bot - Heroku Deployment Script"
echo "=============================================="
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo "✅ Heroku CLI is installed"
echo ""

# Check if user is logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku first:"
    echo "   heroku login"
    echo ""
    echo "Press Enter after you've logged in..."
    read
fi

echo "✅ Logged into Heroku as: $(heroku auth:whoami)"
echo ""

# Create Heroku app (if it doesn't exist)
APP_NAME="hockey-pickup-bot-$(date +%s)"
echo "📱 Creating Heroku app: $APP_NAME"
heroku create $APP_NAME

if [ $? -eq 0 ]; then
    echo "✅ App created successfully: $APP_NAME"
else
    echo "❌ Failed to create app. Please check your Heroku account."
    exit 1
fi

echo ""
echo "🔧 Setting up environment variables..."

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=7782823263:AAEj3vhGpufixdQV0rDSgivmc3j50g_TdA0 --app $APP_NAME
heroku config:set API_URL=https://api.hockeypickup.com --app $APP_NAME
heroku config:set USER_EMAIL=codymcclintock41@gmail.com --app $APP_NAME
heroku config:set USER_PASSWORD=aaaaaa123 --app $APP_NAME
heroku config:set TELEGRAM_CHAT_ID=6550859043 --app $APP_NAME

echo "✅ Environment variables set"
echo ""

# Add Heroku remote
echo "🔗 Adding Heroku remote..."
heroku git:remote -a $APP_NAME

echo ""
echo "📦 Committing changes..."
git add .
git commit -m "Deploy hockey pickup bot to Heroku"

echo ""
echo "🚀 Deploying to Heroku..."
git push heroku main

echo ""
echo "⚡ Starting the bot..."
heroku ps:scale web=1 --app $APP_NAME

echo ""
echo "🎉 Deployment Complete!"
echo "====================="
echo ""
echo "📱 App Name: $APP_NAME"
echo "🌐 App URL: https://$APP_NAME.herokuapp.com"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: heroku logs --tail --app $APP_NAME"
echo "   Check status: heroku ps --app $APP_NAME"
echo "   Restart: heroku restart --app $APP_NAME"
echo "   Open app: heroku open --app $APP_NAME"
echo ""
echo "🤖 Your hockey bot is now running in the cloud!"
echo "   It will check for sessions daily at 7 AM PST"
echo "   and automatically register when buy windows open!"
echo ""
