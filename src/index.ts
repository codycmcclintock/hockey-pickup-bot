import { startBot, sendMessage } from './services/telegram';
import { getAllSessions, registerForSession } from './services/session';
import cron from 'node-cron';

interface Session {
  SessionId: number;
  SessionDate: string;
  Note: string;
  BuyDayMinimum: number;
  Cost: number;
}

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

// Check for next week's sessions on Tuesday and Thursday at 7 PM PST
cron.schedule('0 19 * * 2,4', async () => {
  console.log('🔍 Checking for next week\'s sessions...');
  const sessions = await getAllSessions();
  const now = new Date();

  // Find sessions in the next week
  const nextWeekSessions = sessions.filter((session: Session) => {
    const sessionDate = new Date(session.SessionDate);
    const daysUntilSession = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilSession > 0 && daysUntilSession <= 14; // Look up to 2 weeks ahead
  });

  // Sort sessions by date
  nextWeekSessions.sort((a: Session, b: Session) => new Date(a.SessionDate).getTime() - new Date(b.SessionDate).getTime());

  // Send notification for each upcoming session
  for (const session of nextWeekSessions) {
    const sessionDate = new Date(session.SessionDate);
    const buyWindowDate = new Date(sessionDate);
    buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);
    buyWindowDate.setHours(9, 25, 0, 0); // 9:25 AM PST

    const message = `
🏒 Upcoming Hockey Session:
📅 Date: ${sessionDate.toLocaleDateString()}
📝 Note: ${session.Note || 'No note'}
💰 Cost: $${session.Cost}
⏰ Buy Window Opens: ${buyWindowDate.toLocaleString()}
🕐 Days Until Buy Window: ${Math.floor((buyWindowDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}

Would you like me to automatically register you when the buy window opens? (Reply with 'yes' or 'no')`;

    await sendMessage(message);
  }
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
