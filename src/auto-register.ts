import { getAllSessions, registerForSession } from './services/session';
import * as cron from 'node-cron';

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

interface Session {
  SessionId: number;
  SessionDate: string;
  Note: string;
  BuyDayMinimum: number;
  Cost: number;
}

// Simple logging function (no Telegram required)
const log = (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Auto-discover and schedule ALL Wednesday and Friday sessions
// Check daily at 7 AM PST (15:00 UTC)
cron.schedule('0 15 * * *', async () => {
  log('🔍 Auto-discovering Wednesday and Friday sessions...');
  
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

    log(`📅 Found ${wednesdayFridaySessions.length} Wednesday/Friday sessions to auto-register`);

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
      
      // Add to pending registrations
      global.pendingRegistrations = global.pendingRegistrations || {};
      global.pendingRegistrations[session.SessionId] = {
        sessionDate: session.SessionDate,
        buyWindowDate: buyWindowDate,
        cost: session.Cost
      };
      
      if (isBuyWindowImminent) {
        log(`🚨 URGENT: Buy window for ${dayName} session ${session.SessionId} opens in ${hoursUntilBuyWindow} hours!`);
        log(`   📅 Date: ${sessionDate.toLocaleDateString()}`);
        log(`   💰 Cost: $${session.Cost}`);
        log(`   ⏰ Buy Window: ${buyWindowDate.toLocaleString()}`);
        log(`   🕐 Hours until buy window: ${hoursUntilBuyWindow}`);
      } else {
        log(`✅ Scheduled auto-registration for ${dayName} session ${session.SessionId}:`);
        log(`   📅 Date: ${sessionDate.toLocaleDateString()}`);
        log(`   💰 Cost: $${session.Cost}`);
        log(`   ⏰ Buy Window: ${buyWindowDate.toLocaleString()}`);
        log(`   🕐 Days until buy window: ${daysUntilBuyWindow}`);
      }
    }

    if (wednesdayFridaySessions.length === 0) {
      log('ℹ️ No Wednesday/Friday sessions found in the next 2 weeks');
    }

  } catch (error) {
    log(`❌ Error in auto-discovery: ${error.message}`);
  }
});

// Check for registration windows (every 5 seconds for precision)
cron.schedule('*/5 * * * * *', async () => {
  const now = new Date();
  
  // Check each pending registration
  if (global.pendingRegistrations) {
    for (const [sessionId, session] of Object.entries(global.pendingRegistrations)) {
      const buyWindowDate = new Date((session as any).buyWindowDate);
      const timeDiff = Math.abs(buyWindowDate.getTime() - now.getTime());
      
      // If it's time to register (within 10 seconds of the buy window)
      if (timeDiff < 10000) { // 10 seconds precision
        log(`🏒 BUY WINDOW OPEN! Auto-registering for session ${sessionId} at ${now.toLocaleString()}`);
        
        try {
          await registerForSession(parseInt(sessionId));
          log(`✅ Successfully registered for session ${sessionId}`);
          
        } catch (error) {
          log(`❌ Failed to register for session ${sessionId}: ${error.message}`);
        }
        
        // Remove from pending after attempt
        delete global.pendingRegistrations[parseInt(sessionId)];
      }
    }
  }
});

// Check for available spots every minute (immediate registration)
cron.schedule('* * * * *', async () => {
  try {
    log('🔍 Checking for available spots...');
    const sessions = await getAllSessions();
    const now = new Date();
    
    // Determine which day to target based on current day
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    let targetDay: number;
    let targetDayName: string;
    
    if (currentDay === 3) { // Wednesday
      targetDay = 3; // Target next Wednesday
      targetDayName = 'Wednesday';
    } else { // Any other day (including Friday)
      targetDay = 5; // Target next Friday
      targetDayName = 'Friday';
    }
    
    log(`📅 Current day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]}`);
    log(`🎯 Targeting next ${targetDayName} session`);
    
    // Find sessions for the target day
    const targetSessions = sessions.filter((session: Session) => {
      const sessionDate = new Date(session.SessionDate);
      const dayOfWeek = sessionDate.getDay();
      const isTargetDay = dayOfWeek === targetDay;
      const isFutureSession = sessionDate > now;
      return isTargetDay && isFutureSession;
    });
    
    // Sort by date and get the NEXT session of target day
    targetSessions.sort((a, b) => new Date(a.SessionDate).getTime() - new Date(b.SessionDate).getTime());
    const nextTargetSession = targetSessions[0];
    
    if (!nextTargetSession) {
      log(`ℹ️ No ${targetDayName} sessions found`);
      return;
    }
    
    const sessionDate = new Date(nextTargetSession.SessionDate);
    const buyWindowDate = new Date(sessionDate);
    buyWindowDate.setDate(buyWindowDate.getDate() - nextTargetSession.BuyDayMinimum);
    buyWindowDate.setHours(9, 25, 0, 0);
    
    // Check if buy window is open (past 9:25 AM on buy day)
    const isBuyWindowOpen = now >= buyWindowDate;
    
    log(`🎯 Next ${targetDayName} session: ${sessionDate.toLocaleDateString()} (ID: ${nextTargetSession.SessionId})`);
    log(`⏰ Buy window opened: ${buyWindowDate.toLocaleString()}`);
    log(`🕐 Buy window is ${isBuyWindowOpen ? 'OPEN' : 'CLOSED'}`);
    
    const availableSessions = isBuyWindowOpen ? [nextTargetSession] : [];
    
    if (availableSessions.length > 0) {
      log(`🎯 Found ${availableSessions.length} available spots! Attempting to buy...`);
      
      for (const session of availableSessions) {
        log(`🏒 Attempting to buy spot for session ${session.SessionId} (${new Date(session.SessionDate).toLocaleDateString()})`);
        try {
          await registerForSession(session.SessionId);
          log(`✅ Successfully bought spot for session ${session.SessionId}`);
        } catch (error) {
          log(`❌ Failed to buy spot for session ${session.SessionId}: ${error.message}`);
        }
      }
    } else {
      log('ℹ️ No available spots found');
    }
  } catch (error) {
    log(`❌ Error checking for available spots: ${error.message}`);
  }
});

// Daily status check at 8 AM
cron.schedule('0 8 * * *', () => {
  const pendingCount = global.pendingRegistrations ? Object.keys(global.pendingRegistrations).length : 0;
  log(`📊 Daily Status: ${pendingCount} sessions scheduled for auto-registration`);
});

// Initialize global state
global.pendingRegistrations = {};

log('🤖 Hockey Pickup Auto-Registration Bot Started!');
log('📅 Will automatically register for ALL Wednesday and Friday sessions');
log('⏰ Buy windows are monitored every 5 seconds');
log('📝 All activity is logged to console');

// Keep the process running
process.on('SIGINT', () => {
  log('🛑 Shutting down auto-registration bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 Shutting down auto-registration bot...');
  process.exit(0);
});
