import { Telegraf } from 'telegraf';
import { getAllSessions, registerForSession } from './session';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Configure menu commands
bot.telegram.setMyCommands([
  { command: 'start', description: 'Initialize the bot' },
  { command: 'sessions', description: 'Show upcoming hockey sessions' },
  { command: 'status', description: 'Check registration status' },
  { command: 'help', description: 'Show help and commands' }
]);

// Store user responses
let wantsToRegister = false;

export const sendMessage = async (message: string, useMarkdown: boolean = false): Promise<void> => {
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('No TELEGRAM_CHAT_ID set. Message not sent:', message);
    return;
  }
  
  try {
    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message, useMarkdown ? { parse_mode: 'Markdown' } : undefined);
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
};

// Initialize bot and get chat ID
bot.command('start', async (ctx) => {
  const chatId = ctx.chat.id;
  console.log('Your chat ID is:', chatId);
  
  // Update .env file with chat ID
  if (!process.env.TELEGRAM_CHAT_ID) {
    const envPath = './.env';
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const updatedContent = envContent.replace(
      /TELEGRAM_CHAT_ID=.*/,
      `TELEGRAM_CHAT_ID=${chatId}`
    );
    fs.writeFileSync(envPath, updatedContent);
    process.env.TELEGRAM_CHAT_ID = chatId.toString();
  }

  const welcomeMessage = [
    '🏒 Welcome to Hockey Pickup Bot!',
    '',
    'I can help you:',
    '• View upcoming sessions',
    '• Register automatically when the buy window opens',
    '• Get payment links after registration',
    '',
    'Use the menu button (☰) or these commands:',
    '• /sessions - View upcoming games',
    '• /status - Check registration status',
    '• /help - Show all commands',
    '',
    'Try /sessions to see upcoming games!'
  ].join('\n');

  await ctx.reply(welcomeMessage);

  // Also save the chat ID to a file for persistence
  fs.writeFileSync('.env', fs.readFileSync('.env', 'utf-8').replace(/TELEGRAM_CHAT_ID=.*/, `TELEGRAM_CHAT_ID=${chatId}`));
});

// Help command
bot.command('help', async (ctx) => {
  const helpMessage = [
    '🏒 Hockey Pickup Bot Help\n',
    'Commands:',
    '• /sessions - View upcoming hockey sessions',
    '• /status - Check your registration status',
    '• /help - Show this help message\n',
    'How to use:',
    '1. Use /sessions to see upcoming games',
    '2. Select a session by its number',
    '3. Confirm with "yes" to auto-register',
    '4. I\'ll register you when the buy window opens!\n',
    'Need help? Contact @codymcclintock'
  ].join('\n');

  await ctx.reply(helpMessage);
});

// Status command
// Store session IDs for RSVP responses
let lastShownSessions: { [key: string]: number } = {};

// Sessions command
bot.command('sessions', async (ctx) => {
  console.log('Received /sessions command');
  await ctx.reply('🔍 Checking for upcoming sessions...');
  const sessions = await getAllSessions();
  if (sessions.length === 0) {
    await ctx.reply('❌ No upcoming sessions found.');
    return;
  }

  // Sort sessions by date
  const sortedSessions = sessions.sort(
    (a, b) => new Date(a.SessionDate).getTime() - new Date(b.SessionDate).getTime()
  );

  // Create numbered list with RSVP options
  const message = [
    '📅 *Upcoming Hockey Sessions*\n',
    // Only show first 5 sessions
    ...sortedSessions.slice(0, 5).map((session, index) => {
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      // Set to 9:24 AM PST on the day before BuyDayMinimum
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);
      buyWindowDate.setHours(9, 24, 0, 0);
      // Convert from UTC to PST
      buyWindowDate.setHours(buyWindowDate.getHours() - 7);
      
      // Store session ID for this number
      const optionNumber = index + 1;
      lastShownSessions[optionNumber.toString()] = session.SessionId;

      // Format dates with PST timezone
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'short',
        timeStyle: 'short'
      });

      return `${index + 1}. 🏒 ${session.Note}\n` +
        `📅 Date: ${dateFormatter.format(sessionDate)}\n` +
        `💰 Cost: $${session.Cost}\n` +
        `⏰ Buy Window Opens: ${buyWindowDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} PST\n\n`;
    }),
    '\nTo register for a session, reply with the session number (e.g. "1", "2", etc).'
  ].join('');

  await ctx.reply(message);
});

bot.command('status', async (ctx) => {
  const status = wantsToRegister ? 
    '✅ You are set to be registered for the next available session.' :
    '❌ You have not opted to register for any sessions.';
  await ctx.reply(status);
});

// Handle numeric responses for session selection
bot.hears(/^[0-9]+$/, async (ctx) => {
  const selectedNumber = ctx.message.text;
  const sessionId = lastShownSessions[selectedNumber];

  if (!sessionId) {
    await ctx.reply('❌ Invalid session number. Please use /sessions to see available sessions.');
    return;
  }

  const sessions = await getAllSessions();
  const selectedSession = sessions.find(s => s.SessionId === sessionId);

  if (!selectedSession) {
    await ctx.reply('❌ Session not found. Please use /sessions to see available sessions.');
    return;
  }

  const sessionDate = new Date(selectedSession.SessionDate);
  const buyWindowDate = new Date(sessionDate);
  buyWindowDate.setDate(buyWindowDate.getDate() - selectedSession.BuyDayMinimum);

  // Create session URL
  const sessionUrl = `https://localhost:5174/sessions/${selectedSession.SessionId}`;

  // Format dates with PST timezone


  const now = new Date();
  const buyWindowOpen = buyWindowDate <= now;

  const message = [
    '*Would you like me to register you for:*\n',
    `[🏒 View Session Details](${sessionUrl})\n`,
    `📅 Date: ${sessionDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}\n`,
    `💰 Cost: $${selectedSession.Cost}\n`,
    `⏰ Buy Window Opens: ${buyWindowDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} PST`,
    buyWindowOpen ? '\nI\'ll try to register you immediately!' : '\nI\'ll auto-register when the window opens!',
    '\nReply with "yes" or "no"'
  ].join('');

  // Store the session ID and whether it's immediately available
  global.pendingConfirmation = sessionId;
  global.immediateRegistration = buyWindowOpen;
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// Handle "yes" responses
// Add immediateRegistration to global state
declare global {
  var immediateRegistration: boolean;
}
global.immediateRegistration = false;

bot.hears(['yes', 'Yes', 'YES'], async (ctx) => {
  if (!global.pendingConfirmation) {
    await ctx.reply('❌ No session selected. Please use /sessions to see available sessions.');
    return;
  }

  const sessionId = global.pendingConfirmation;
  const sessions = await getAllSessions();
  const selectedSession = sessions.find(s => s.SessionId === sessionId);

  if (!selectedSession) {
    await ctx.reply('❌ Session not found. Please use /sessions to see available sessions.');
    return;
  }

  // If the buy window is open, register immediately
  if (global.immediateRegistration) {
    await ctx.reply('🟢 Buy window is open - attempting to register now...');
    await registerForSession(sessionId);
    global.pendingConfirmation = undefined;
    global.immediateRegistration = false;
    return;
  }

  // Otherwise, queue up the registration
  const sessionDate = new Date(selectedSession.SessionDate);
  const buyWindowDate = new Date(sessionDate);
  buyWindowDate.setDate(buyWindowDate.getDate() - selectedSession.BuyDayMinimum);
  buyWindowDate.setHours(9, 24, 0, 0);

  global.pendingRegistrations[sessionId] = {
    sessionDate: selectedSession.SessionDate,
    buyWindowDate: buyWindowDate,
    cost: selectedSession.Cost
  };

  const confirmationMessage = [
    '✅ Session added to registration queue!',
    '',
    '📋 Details:',
    `🏒 Session: ${selectedSession.Note}`,
    `📅 Date: ${sessionDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`,
    `💰 Cost: $${selectedSession.Cost}`,
    `⏰ Will auto-register at: ${buyWindowDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} PST`,
    '',
    '🔔 I will send you a notification when registration is complete!'
  ].join('\n');

  await ctx.reply(confirmationMessage);
  global.pendingConfirmation = undefined;
});

// Handle "no" responses
bot.hears(['no', 'No', 'NO'], async (ctx) => {
  if (!global.pendingConfirmation) {
    await ctx.reply('❌ No session selected. Please use /sessions to see available sessions.');
    return;
  }

  global.pendingConfirmation = undefined;
  await ctx.reply('❌ Okay, I will not register you for this session.');
});

// Handle help command
bot.help((ctx) => {
  ctx.reply(
    '🏒 Hockey Pickup Bot Commands:\n\n' +
    '/start - Initialize the bot\n' +
    '/status - Check registration status\n' +
    '/sessions - Show all upcoming sessions\n' +
    '/help - Show this help message\n\n' +
    'Just reply with "yes" or "no" when asked about registration.'
  );
});

// Handle unknown commands
bot.on('text', (ctx) => {
  ctx.reply(
    '❓ Sorry, I don\'t understand that command.\n\n' +
    'Available commands:\n' +
    '/start - Initialize the bot\n' +
    '/status - Check registration status\n' +
    '/sessions - Show all upcoming sessions\n' +
    '/help - Show help\n\n' +
    'Or just reply with "yes" or "no" when asked about registration.'
  );
});

export const startBot = async (): Promise<void> => {
  console.log('Starting bot with token:', process.env.TELEGRAM_BOT_TOKEN?.slice(0, 5) + '...');
  console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID);

  // Add error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  bot.launch().then(() => {
    console.log('🏒 Telegram bot is running...');
    console.log('Type /start in the Telegram chat to begin.');

    // Test message
    if (process.env.TELEGRAM_CHAT_ID) {
      bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, '🔔 Bot restarted and ready!')
        .then(() => console.log('Test message sent'))
        .catch(err => console.error('Failed to send test message:', err));
    }
  }).catch((error) => {
    console.error('Failed to start bot:', error);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};
