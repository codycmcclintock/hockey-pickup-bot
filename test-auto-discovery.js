// Test script to manually trigger auto-discovery
const { getAllSessions } = require('./dist/services/session');

async function testAutoDiscovery() {
  console.log('🔍 Testing auto-discovery of Wednesday and Friday sessions...');
  
  try {
    const sessions = await getAllSessions();
    const now = new Date();

    // Find ALL Wednesday and Friday sessions in the next 2 weeks
    const wednesdayFridaySessions = sessions.filter((session) => {
      const sessionDate = new Date(session.SessionDate);
      const dayOfWeek = sessionDate.getDay(); // 0=Sunday, 3=Wednesday, 5=Friday
      const daysUntilSession = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only Wednesday (3) and Friday (5) sessions in the next 2 weeks
      return (dayOfWeek === 3 || dayOfWeek === 5) && daysUntilSession > 0 && daysUntilSession <= 14;
    });

    console.log(`📅 Found ${wednesdayFridaySessions.length} Wednesday/Friday sessions in the next 2 weeks:`);
    console.log('');

    // Show each session that would be auto-registered
    wednesdayFridaySessions.forEach((session, index) => {
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);
      buyWindowDate.setHours(9, 25, 0, 0); // 9:25 AM PST

      const dayName = sessionDate.getDay() === 3 ? 'Wednesday' : 'Friday';
      const daysUntilBuyWindow = Math.floor((buyWindowDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`${index + 1}. ${dayName} Session ${session.SessionId}:`);
      console.log(`   📅 Date: ${sessionDate.toLocaleDateString()}`);
      console.log(`   💰 Cost: $${session.Cost}`);
      console.log(`   ⏰ Buy Window: ${buyWindowDate.toLocaleString()}`);
      console.log(`   🕐 Days until buy window: ${daysUntilBuyWindow}`);
      console.log(`   📝 Note: ${session.Note || 'No note'}`);
      console.log('');
    });

    if (wednesdayFridaySessions.length === 0) {
      console.log('ℹ️ No Wednesday/Friday sessions found in the next 2 weeks');
    } else {
      console.log(`🤖 The bot will automatically register for ALL ${wednesdayFridaySessions.length} sessions above!`);
      console.log('⏰ Registration will happen exactly when each buy window opens (9:25 AM PST)');
    }

  } catch (error) {
    console.error('❌ Error in auto-discovery:', error.message);
  }
}

testAutoDiscovery();
