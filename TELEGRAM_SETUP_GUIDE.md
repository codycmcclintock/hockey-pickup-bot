# Hockey Pickup Bot - Telegram Setup & Testing Guide

## 🚀 Quick Start

### 1. Set Up Your Environment Variables

First, create your `.env` file:

```bash
# Copy the example file
cp env.example .env
```

Then edit `.env` with your actual values:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=your_chat_id_here

# Hockey Pickup API Configuration  
API_URL=https://api.hockeypickup.com
USER_EMAIL=your_email@example.com
USER_PASSWORD=your_password_here
```

### 2. Get Your Telegram Bot Token

If you don't have a bot token yet:

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send `/newbot`** command
4. **Follow the prompts** to create your bot
5. **Copy the bot token** (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3. Get Your Chat ID

To get your Telegram Chat ID:

1. **Start a chat** with your bot
2. **Send any message** (like `/start`)
3. **Run this command** to get your chat ID:

```bash
# Replace YOUR_BOT_TOKEN with your actual bot token
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates"
```

Look for the `"chat":{"id":123456789}` in the response - that's your Chat ID.

### 4. Install Dependencies & Build

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## 🧪 Testing the Bot

### Option 1: Run in Development Mode

```bash
# Run with hot reload (recommended for testing)
npm run dev
```

### Option 2: Run Production Build

```bash
# Build first
npm run build

# Then run
npm start
```

## 🤖 Testing Bot Commands

Once the bot is running, test these commands in Telegram:

### Basic Commands
- `/start` - Initialize the bot and get welcome message
- `/help` - Show all available commands
- `/sessions` - View upcoming hockey sessions
- `/status` - Check registration status

### Interactive Features
1. **Send `/start`** - Should receive welcome message
2. **Send `/sessions`** - Should show upcoming sessions (if any)
3. **Reply with numbers** - To select sessions for registration
4. **Reply with "yes"** - To confirm auto-registration
5. **Reply with "no"** - To decline registration

## 🔍 Troubleshooting

### Bot Not Responding?
1. **Check the console** for error messages
2. **Verify your bot token** is correct
3. **Make sure the bot is running** (you should see "🏒 Telegram bot is running...")

### Environment Issues?
```bash
# Check if your .env file exists
ls -la .env

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing');"
```

### API Connection Issues?
1. **Check your email/password** in the .env file
2. **Verify the API URL** is correct
3. **Check console logs** for API error messages

## 📱 Expected Bot Behavior

### When Working Correctly:
- ✅ Bot responds to `/start` with welcome message
- ✅ Bot shows upcoming sessions with `/sessions`
- ✅ Bot asks for confirmation when you select a session
- ✅ Bot attempts registration at the right time
- ✅ Bot sends payment links after successful registration

### Console Output You Should See:
```
Starting bot with token: 12345...
Chat ID: 123456789
🏒 Telegram bot is running...
Type /start in the Telegram chat to begin.
Test message sent
```

## 🧪 Run Tests

To verify everything is set up correctly:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific tests
npm test -- --testPathPattern="final"
```

## 📋 Testing Checklist

- [ ] Bot token is set in .env file
- [ ] Chat ID is set in .env file
- [ ] Hockey pickup credentials are set
- [ ] Bot starts without errors
- [ ] Bot responds to `/start` command
- [ ] Bot can fetch sessions (if any available)
- [ ] Tests are passing

## 🚨 Common Issues

### "Bot token is invalid"
- Double-check your bot token from BotFather
- Make sure there are no extra spaces in .env file

### "Chat ID not found"
- Send a message to your bot first
- Use the getUpdates API to find your chat ID

### "API connection failed"
- Check your email/password for hockey pickup
- Verify the API URL is accessible

### "No sessions found"
- This is normal if no sessions are currently available
- The bot will check for sessions on Tuesday/Thursday at 7 PM

## 🎯 Next Steps

Once your bot is working:

1. **Test the full workflow** - Select a session and confirm registration
2. **Monitor the logs** during scheduled checks
3. **Set up monitoring** for production use
4. **Configure notifications** for successful registrations

## 📞 Getting Help

If you run into issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test individual components (bot connection, API connection)
4. Run the test suite to verify setup

Your bot should now be ready to automatically register you for hockey pickup sessions! 🏒
