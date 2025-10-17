# Hockey Pickup Automation Bot

A Telegram bot that automatically monitors and registers for hockey pickup sessions. The bot is configured to automatically queue for registration for Wednesday and Friday sessions at 9:25 AM PST.

## Features

- Monitors upcoming hockey sessions
- Auto-queues for Wednesday and Friday sessions
- Automatically attempts registration when the buy window opens
- Sends notifications via Telegram
- Provides payment links after successful registration

## Environment Variables

Create a `.env` file with the following variables:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
API_URL=https://api.hockeypickup.com
USER_EMAIL=your_email
USER_PASSWORD=your_password
TELEGRAM_CHAT_ID=your_chat_id
```

## Deployment to Heroku

1. Install the Heroku CLI
2. Login to Heroku:
   ```bash
   heroku login
   ```

3. Create a new Heroku app:
   ```bash
   heroku create hockey-pickup-bot
   ```

4. Set environment variables:
   ```bash
   heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token
   heroku config:set API_URL=https://api.hockeypickup.com
   heroku config:set USER_EMAIL=your_email
   heroku config:set USER_PASSWORD=your_password
   heroku config:set TELEGRAM_CHAT_ID=your_chat_id
   ```

5. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

6. Ensure the worker is running:
   ```bash
   heroku ps:scale worker=1
   ```

## Local Development

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Build the project:
   ```bash
   yarn build
   ```

3. Start the bot:
   ```bash
   yarn start
   ```

## Testing

The project includes comprehensive unit and integration tests. See [TESTING.md](./TESTING.md) for detailed testing information.

### Quick Test Commands
```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:ci         # Run tests for CI/CD
```

## Commands

- `/sessions` - View upcoming sessions
- `/help` - Show available commands
