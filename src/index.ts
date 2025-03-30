import { startBot } from './services/telegram';
import { checkUpcomingSessions, registerForSession } from './services/session';
import cron from 'node-cron';

// Define types for global state
declare global {
  var pendingRegistrations: {
    [key: number]: {
      sessionDate: string;
      buyWindowDate: Date;
      cost: number;
    };
  };
  var pendingConfirmation: number | undefined;
}

// Initialize global state
global.pendingRegistrations = {};

// Start the Telegram bot
startBot().catch(err => console.error('Failed to start bot:', err));

// Check for upcoming sessions immediately
checkUpcomingSessions();

// Schedule session checks (every hour)
cron.schedule('0 * * * *', () => {
  checkUpcomingSessions();
});

// Check for registration windows (every 10 seconds)
cron.schedule('*/10 * * * * *', async () => {
  const now = new Date();
  
  // Check each pending registration
  for (const [sessionId, session] of Object.entries(global.pendingRegistrations)) {
    const buyWindowDate = new Date(session.buyWindowDate);
    
    // If it's time to register (within 30 seconds of the buy window)
    if (Math.abs(buyWindowDate.getTime() - now.getTime()) < 30000) { // 30000ms = 30 seconds
      console.log(`🏒 Attempting to register for session ${sessionId} at ${now.toLocaleString()}`);
      await registerForSession(parseInt(sessionId));
      
      // Remove from pending after attempt
      delete global.pendingRegistrations[parseInt(sessionId)];
    }
  }
});
