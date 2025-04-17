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

// Function to auto-queue for specific days
async function autoQueueForDay(sessions: any[]) {
  const now = new Date();
  
  for (const session of sessions) {
    const sessionDate = new Date(session.SessionDate);
    const dayOfWeek = sessionDate.getUTCDay(); // 3 for Wednesday, 5 for Friday
    
    // Only process sessions for Wednesday (3) and Friday (5)
    if (dayOfWeek !== 3 && dayOfWeek !== 5) continue;
    
    // Calculate buy window date (6 days before at 9:25am PST)
    const buyWindowDate = new Date(sessionDate);
    buyWindowDate.setUTCDate(buyWindowDate.getUTCDate() - session.BuyDayMinimum);
    buyWindowDate.setUTCHours(16, 25, 0, 0); // 9:25 AM PST = 16:25 UTC
    
    // If this session isn't already in pending registrations and the buy window hasn't passed
    if (!global.pendingRegistrations[session.SessionId] && buyWindowDate > now) {
      console.log(`🏒 Auto-queuing for ${session.SessionDate} (buy window: ${buyWindowDate.toLocaleString()})`);
      global.pendingRegistrations[session.SessionId] = {
        sessionDate: session.SessionDate,
        buyWindowDate: buyWindowDate,
        cost: session.Cost
      };
    }
  }
}

// Check for upcoming sessions immediately
checkUpcomingSessions().then(sessions => {
  if (sessions) autoQueueForDay(sessions);
});

// Schedule session checks (every hour)
cron.schedule('0 * * * *', async () => {
  const sessions = await checkUpcomingSessions();
  if (sessions) autoQueueForDay(sessions);
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
