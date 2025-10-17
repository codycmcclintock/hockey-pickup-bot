# 🚀 Hockey Pickup Bot - Deployment Guide

## How It Works

### 📅 **Daily Schedule:**
1. **7:00 AM PST**: Bot discovers all Wednesday/Friday sessions
2. **9:25 AM PST**: Bot automatically attempts to register when buy window opens
3. **Continuous**: Bot monitors every 5 seconds around buy window time

### 🔄 **Process Flow:**
```
7:00 AM PST → Discover Sessions → Schedule Registration → Wait
9:25 AM PST → Attempt Registration → Success/Failure Notification
```

## Deployment Options

### Option 1: 🖥️ **Local Computer (Recommended for Testing)**

**Pros:** Easy setup, full control, free
**Cons:** Must keep computer running

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start auto-registration bot
npm run auto-register
```

**Keep running:** Leave your computer on 24/7, or use a Raspberry Pi.

---

### Option 2: ☁️ **Heroku (Recommended for Production)**

**Pros:** Always online, free tier available, easy deployment
**Cons:** Free tier has limitations

#### Setup:
1. **Create Heroku Account:** [heroku.com](https://heroku.com)
2. **Install Heroku CLI:** [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

#### Deploy:
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-hockey-bot-name

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token
heroku config:set API_URL=https://api.hockeypickup.com
heroku config:set USER_EMAIL=your_email
heroku config:set USER_PASSWORD=your_password
heroku config:set TELEGRAM_CHAT_ID=your_chat_id

# Deploy
git add .
git commit -m "Deploy hockey bot"
git push heroku main

# Start the bot
heroku ps:scale web=1
```

#### Keep Running:
```bash
# Check status
heroku ps

# View logs
heroku logs --tail

# Restart if needed
heroku restart
```

---

### Option 3: 🐳 **DigitalOcean App Platform**

**Pros:** Reliable, good free tier, easy scaling
**Cons:** More complex than Heroku

#### Setup:
1. **Create DigitalOcean Account:** [digitalocean.com](https://digitalocean.com)
2. **Create App:** Connect your GitHub repository
3. **Set Environment Variables:** In the dashboard
4. **Deploy:** Automatic deployment on git push

---

### Option 4: 🏠 **Raspberry Pi (Always-On Home Server)**

**Pros:** Cheap, always online, full control
**Cons:** Requires hardware setup

#### Setup:
1. **Buy Raspberry Pi 4** (~$50)
2. **Install Raspberry Pi OS**
3. **Clone repository and setup:**
```bash
git clone your-repo-url
cd HockeyPickupAutomation
npm install
npm run build
npm run auto-register
```

4. **Run on startup:**
```bash
# Add to crontab
crontab -e
# Add this line:
@reboot cd /home/pi/HockeyPickupAutomation && npm run auto-register
```

---

### Option 5: 🌐 **AWS EC2 (Professional)**

**Pros:** Very reliable, scalable, professional
**Cons:** Costs money, more complex setup

#### Setup:
1. **Create AWS Account**
2. **Launch EC2 Instance** (t2.micro for free tier)
3. **Install Node.js and dependencies**
4. **Deploy and run**

---

## 🎯 **Recommended: Start with Local + Move to Heroku**

### Phase 1: Test Locally
```bash
# Test the bot works
npm run dev:auto

# Verify it discovers sessions and schedules registrations
```

### Phase 2: Deploy to Heroku
```bash
# Once testing is complete
heroku create your-hockey-bot
heroku config:set [all your env vars]
git push heroku main
heroku ps:scale web=1
```

## 📊 **Cost Comparison**

| Option | Cost | Reliability | Setup Difficulty |
|--------|------|-------------|------------------|
| Local Computer | Free | Medium | Easy |
| Heroku | Free/$7/mo | High | Easy |
| DigitalOcean | Free/$5/mo | High | Medium |
| Raspberry Pi | $50 one-time | High | Medium |
| AWS EC2 | $5-20/mo | Very High | Hard |

## 🚨 **Important Notes**

1. **Environment Variables:** Keep your `.env` file secure
2. **Monitoring:** Check logs regularly
3. **Backup:** Keep your code in version control
4. **Testing:** Test with a small session first
5. **Timezone:** Bot runs on PST/PDT automatically

## 🎉 **Ready to Deploy?**

1. **Test locally first:** `npm run dev:auto`
2. **Choose deployment option**
3. **Set up environment variables**
4. **Deploy and monitor**

Your hockey sessions will be automatically registered! 🏒
