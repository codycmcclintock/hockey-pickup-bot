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
}

// Initialize global state
global.pendingRegistrations = {};

// Start the Telegram bot (optional - for notifications only)
startBot().catch(err => console.error('Failed to start bot:', err));

// Auto-discover and schedule ALL Wednesday and Friday sessions
// Check daily at 7 AM PST
cron.schedule('0 15 * * *', async () => {
  console.log('🔍 Auto-discovering Wednesday and Friday sessions...');
  
  try {
    const sessions = await getAllSessions();
    const now = new Date();

    // Find ALL Wednesday and Friday sessions in the next 2 weeks
    const wednesdayFridaySessions = sessions.filter((session: Session) => {
      const sessionDate = new Date(session.SessionDate);
      const dayOfWeek = sessionDate.getDay(); // 0=Sunday, 3=Wednesday, 5=Friday
      const daysUntilSession = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only Wednesday (3) and Friday (5) sessions in the next 2 weeks
      return (dayOfWeek === 3 || dayOfWeek === 5) && daysUntilSession > 0 && daysUntilSession <= 14;
    });

    console.log(`📅 Found ${wednesdayFridaySessions.length} Wednesday/Friday sessions to auto-register`);

    // Schedule automatic registration for each session
    for (const session of wednesdayFridaySessions) {
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);
      buyWindowDate.setHours(9, 25, 0, 0); // 9:25 AM PST (buy window opens at this time)

      const dayName = sessionDate.getDay() === 3 ? 'Wednesday' : 'Friday';
      const daysUntilBuyWindow = Math.floor((buyWindowDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const hoursUntilBuyWindow = Math.floor((buyWindowDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // Check if buy window is opening very soon (within 24 hours)
      const isBuyWindowImminent = hoursUntilBuyWindow <= 24 && hoursUntilBuyWindow >= 0;
      
      if (isBuyWindowImminent) {
        console.log(`🚨 URGENT: Buy window for ${dayName} session ${session.SessionId} opens in ${hoursUntilBuyWindow} hours!`);
        console.log(`   📅 Date: ${sessionDate.toLocaleDateString()}`);
        console.log(`   💰 Cost: $${session.Cost}`);
        console.log(`   ⏰ Buy Window: ${buyWindowDate.toLocaleString()}`);
        console.log(`   🕐 Hours until buy window: ${hoursUntilBuyWindow}`);
        
        // Send urgent notification
        const urgentMessage = `🚨 URGENT: ${dayName} session buy window opens in ${hoursUntilBuyWindow} hours!\n📅 ${sessionDate.toLocaleDateString()}\n💰 $${session.Cost}\n⏰ ${buyWindowDate.toLocaleString()}`;
        await sendMessage(urgentMessage);
      } else {
        console.log(`✅ Scheduled auto-registration for ${dayName} session ${session.SessionId}:`);
        console.log(`   📅 Date: ${sessionDate.toLocaleDateString()}`);
        console.log(`   💰 Cost: $${session.Cost}`);
        console.log(`   ⏰ Buy Window: ${buyWindowDate.toLocaleString()}`);
        console.log(`   🕐 Days until buy window: ${daysUntilBuyWindow}`);
        
        // Send normal notification
        const message = `🤖 Auto-scheduled registration for ${dayName} session:\n📅 ${sessionDate.toLocaleDateString()}\n💰 $${session.Cost}\n⏰ Buy window opens in ${daysUntilBuyWindow} days`;
        await sendMessage(message);
      }
      
      // Add to pending registrations for automatic registration
      global.pendingRegistrations[session.SessionId] = {
        sessionDate: session.SessionDate,
        buyWindowDate: buyWindowDate,
        cost: session.Cost
      };
    }

    if (wednesdayFridaySessions.length === 0) {
      console.log('ℹ️ No Wednesday/Friday sessions found in the next 2 weeks');
    }

  } catch (error) {
    console.error('❌ Error in auto-discovery:', error);
    await sendMessage(`❌ Error discovering sessions: ${error.message}`);
  }
});

// Check for registration windows (every 5 seconds for precision)
cron.schedule('*/5 * * * * *', async () => {
  const now = new Date();
  
  // Check each pending registration
  for (const [sessionId, session] of Object.entries(global.pendingRegistrations)) {
    const buyWindowDate = new Date(session.buyWindowDate);
    const timeDiff = Math.abs(buyWindowDate.getTime() - now.getTime());
    
    // If it's time to register (within 10 seconds of the buy window)
    if (timeDiff < 10000) { // 10 seconds precision
      console.log(`🏒 BUY WINDOW OPEN! Auto-registering for session ${sessionId} at ${now.toLocaleString()}`);
      
      try {
        await registerForSession(parseInt(sessionId));
        console.log(`✅ Successfully registered for session ${sessionId}`);
        
        // Send success notification
        await sendMessage(`🎉 Auto-registration successful for session ${sessionId}! 💰 $${session.cost}`);
        
      } catch (error) {
        console.error(`❌ Failed to register for session ${sessionId}:`, error);
        await sendMessage(`❌ Auto-registration failed for session ${sessionId}: ${error.message}`);
      }
      
      // Remove from pending after attempt
      delete global.pendingRegistrations[parseInt(sessionId)];
    }
  }
});

// Check for available spots every minute (immediate registration)
cron.schedule('* * * * *', async () => {
  try {
    console.log('🔍 Checking for available spots...');
    const sessions = await getAllSessions();
    const now = new Date();
    
    // Find sessions that are available for immediate purchase
    const availableSessions = sessions.filter((session: Session) => {
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);
      buyWindowDate.setHours(9, 25, 0, 0);
      
      // Check if buy window is open (past 9:25 AM on buy day)
      const isBuyWindowOpen = now >= buyWindowDate;
      
      // Check if it's a Wednesday or Friday session
      const dayOfWeek = sessionDate.getDay();
      const isWedOrFri = dayOfWeek === 3 || dayOfWeek === 5;
      
      // Check if session is in the future
      const isFutureSession = sessionDate > now;
      
      return isBuyWindowOpen && isWedOrFri && isFutureSession;
    });
    
    if (availableSessions.length > 0) {
      console.log(`🎯 Found ${availableSessions.length} available spots! Attempting to buy...`);
      
      for (const session of availableSessions) {
        console.log(`🏒 Attempting to buy spot for session ${session.SessionId} (${new Date(session.SessionDate).toLocaleDateString()})`);
        try {
          await registerForSession(session.SessionId);
          console.log(`✅ Successfully bought spot for session ${session.SessionId}`);
        } catch (error) {
          console.error(`❌ Failed to buy spot for session ${session.SessionId}:`, error);
        }
      }
    } else {
      console.log('ℹ️ No available spots found');
    }
  } catch (error) {
    console.error(`❌ Error checking for available spots:`, error);
  }
});

// Daily status check at 8 AM
cron.schedule('0 8 * * *', async () => {
  const pendingCount = Object.keys(global.pendingRegistrations).length;
  console.log(`📊 Daily Status: ${pendingCount} sessions scheduled for auto-registration`);
  
  if (pendingCount > 0) {
    await sendMessage(`📊 Daily Status: ${pendingCount} sessions scheduled for auto-registration`);
  }
});

console.log('🤖 Hockey Pickup Auto-Registration Bot Started!');
console.log('📅 Will automatically register for ALL Wednesday and Friday sessions');
console.log('⏰ Buy windows are monitored every 5 seconds');
console.log('🔔 Notifications will be sent via Telegram (if configured)');