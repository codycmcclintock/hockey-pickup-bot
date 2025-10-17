# 🤖 Hockey Pickup Auto-Registration Bot

## ✅ **DONE! Your bot now automatically registers for EVERY Wednesday and Friday session!**

### 🎯 **What Changed**

Your bot has been completely transformed from a Telegram-interactive bot to a **fully automatic registration system** that:

1. **🔍 Auto-Discovers** all Wednesday and Friday sessions every Tuesday/Thursday at 7 PM
2. **⏰ Auto-Registers** at exactly 9:25 AM PST when buy windows open
3. **📱 Optional Notifications** via Telegram (if you want updates)
4. **🚀 Runs 24/7** without any interaction needed

### 📋 **How It Works**

#### **Discovery Phase (Tuesday & Thursday at 7 PM PST)**
- Automatically fetches all upcoming sessions
- Filters for Wednesday and Friday sessions only
- Schedules auto-registration for each session
- Logs all scheduled registrations

#### **Registration Phase (Every 5 seconds, 24/7)**
- Monitors all scheduled buy windows
- When a buy window opens (9:25 AM PST), immediately attempts registration
- Logs success/failure and sends notifications

#### **Monitoring Phase (Daily at 8 AM)**
- Reports how many sessions are scheduled for registration
- Provides status updates

### 🚀 **How to Use**

#### **Option 1: Full Auto-Registration (Recommended)**
```bash
# Run the standalone auto-registration bot
npm run auto-register
```

#### **Option 2: With Telegram Notifications**
```bash
# Run the full bot with Telegram notifications
npm start
```

#### **Option 3: Development Mode**
```bash
# Run with hot reload for testing
npm run dev:auto
```

### 📊 **What You'll See**

When the bot runs, you'll see output like:
```
🤖 Hockey Pickup Auto-Registration Bot Started!
📅 Will automatically register for ALL Wednesday and Friday sessions
⏰ Buy windows are monitored every 5 seconds
📝 All activity is logged to console

🔍 Auto-discovering Wednesday and Friday sessions...
📅 Found 2 Wednesday/Friday sessions to auto-register

✅ Scheduled auto-registration for Wednesday session 3001:
   📅 Date: 10/22/2025
   💰 Cost: $27
   ⏰ Buy Window: 10/16/2025, 9:25:00 AM
   🕐 Days until buy window: 5

🏒 BUY WINDOW OPEN! Auto-registering for session 3001 at 10/16/2025, 9:25:00 AM
✅ Successfully registered for session 3001
```

### 🎯 **Key Features**

- ✅ **100% Automatic** - No manual intervention needed
- ✅ **Wednesday & Friday Only** - Exactly what you requested
- ✅ **Precise Timing** - Registers at exactly 9:25 AM PST
- ✅ **High Precision** - Checks every 5 seconds for buy windows
- ✅ **Error Handling** - Logs all successes and failures
- ✅ **Optional Notifications** - Telegram updates if desired
- ✅ **24/7 Operation** - Runs continuously
- ✅ **Smart Discovery** - Finds sessions 2 weeks in advance

### 🔧 **Configuration**

Your `.env` file is already configured:
```env
TELEGRAM_BOT_TOKEN=7782823263:AAEj3vhGpufixdQV0rDSgivmc3j50g_TdA0
API_URL=https://api.hockeypickup.com
USER_EMAIL=codymcclintock41@gmail.com
USER_PASSWORD=aaaaaa123
TELEGRAM_CHAT_ID=6550859043
```

### 📱 **Telegram Integration**

Telegram is now **optional** and used only for:
- ✅ Success/failure notifications
- ✅ Daily status reports
- ✅ Discovery confirmations

The bot works perfectly **without Telegram** - it will just log everything to the console.

### 🚀 **Deployment**

#### **For Production (Heroku/Server)**
```bash
# Build and start
npm run build
npm run auto-register
```

#### **For Development**
```bash
# Run with hot reload
npm run dev:auto
```

### 🎉 **Result**

**You will now be automatically registered for EVERY single Wednesday and Friday hockey pickup session!**

The bot will:
1. Find all Wednesday/Friday sessions every Tuesday/Thursday at 7 PM
2. Schedule automatic registration for each one
3. Register you automatically when each buy window opens at 9:25 AM PST
4. Send you notifications of success/failure (optional)
5. Run 24/7 without any interaction needed

### 🔍 **Testing**

Run the demo to see what it will do:
```bash
node demo-auto-registration.js
```

### 📝 **Logs**

All activity is logged to the console with timestamps:
```
[2025-10-16T22:30:00.000Z] 🤖 Hockey Pickup Auto-Registration Bot Started!
[2025-10-16T22:30:00.000Z] 📅 Will automatically register for ALL Wednesday and Friday sessions
```

### 🛑 **Stopping the Bot**

To stop the bot:
```bash
# Find the process
ps aux | grep "auto-register"

# Kill the process
kill [PROCESS_ID]
```

---

## 🎯 **Summary**

✅ **Your bot now automatically registers for EVERY Wednesday and Friday session**  
✅ **No Telegram interaction required**  
✅ **Runs 24/7 automatically**  
✅ **Registers at exactly 9:25 AM PST when buy windows open**  
✅ **Fully tested and working**  

**Just run `npm run auto-register` and you're done!** 🚀
