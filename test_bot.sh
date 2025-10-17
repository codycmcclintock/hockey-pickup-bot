#!/bin/bash

# Hockey Pickup Bot Testing Script

echo "🏒 Hockey Pickup Bot Testing Script"
echo "=================================="
echo ""

# Check if bot is running
if pgrep -f "node dist/index.js" > /dev/null; then
    echo "✅ Bot is running"
    BOT_PID=$(pgrep -f "node dist/index.js")
    echo "   Process ID: $BOT_PID"
else
    echo "❌ Bot is not running"
    echo "   Run: npm start"
    exit 1
fi

echo ""

# Check bot status via API
echo "🤖 Testing bot API connection..."
BOT_TOKEN="7782823263:AAEj3vhGpufixdQV0rDSgivmc3j50g_TdA0"
API_RESPONSE=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getMe")

if echo "$API_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Bot API connection successful"
    BOT_NAME=$(echo "$API_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['first_name'])")
    echo "   Bot Name: $BOT_NAME"
else
    echo "❌ Bot API connection failed"
    echo "   Response: $API_RESPONSE"
fi

echo ""

# Check recent messages
echo "📱 Checking for recent messages..."
UPDATES=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getUpdates")
MESSAGE_COUNT=$(echo "$UPDATES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['result']))")

echo "   Recent messages: $MESSAGE_COUNT"

if [ "$MESSAGE_COUNT" -gt 0 ]; then
    echo "   Latest messages:"
    echo "$UPDATES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for update in data['result'][-3:]:  # Show last 3 messages
    if 'message' in update:
        msg = update['message']
        text = msg.get('text', 'No text')
        user = msg['from']['first_name']
        print(f'     {user}: {text}')
"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Open Telegram and search for: @hockey_pickup_bot"
echo "2. Send /start to begin"
echo "3. Try /sessions to see upcoming games"
echo "4. Monitor this terminal for bot activity"
echo ""
echo "🔍 To monitor bot logs in real-time:"
echo "   Run: ps aux | grep 'node dist/index.js'"
echo ""
echo "🛑 To stop the bot:"
echo "   Run: kill $BOT_PID"
