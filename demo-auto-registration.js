// Demo script showing what the auto-registration bot will do
require('dotenv').config();

console.log('🤖 Hockey Pickup Auto-Registration Bot Demo');
console.log('==========================================');
console.log('');

// Simulate the data with upcoming Wednesday/Friday sessions
const now = new Date();
const nextWednesday = new Date(now);
nextWednesday.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7)); // Next Wednesday
nextWednesday.setHours(7, 30, 0, 0);

const nextFriday = new Date(now);
nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7)); // Next Friday
nextFriday.setHours(7, 30, 0, 0);

const mockSessions = [
  {
    SessionId: 3001,
    SessionDate: nextWednesday.toISOString(), // Wednesday ✅
    Note: '8/10. Goalies: Ryan Novak, Tom Ezzo',
    BuyDayMinimum: 6,
    Cost: 27
  },
  {
    SessionId: 3002,
    SessionDate: nextFriday.toISOString(), // Friday ✅
    Note: '6/10. Goalies: Josh Callsen, Ken Ornstein',
    BuyDayMinimum: 6,
    Cost: 27
  },
  {
    SessionId: 3003,
    SessionDate: '2025-11-28T07:30:00.000Z', // Thursday (not Wednesday/Friday)
    Note: '7/10. Goalies: Ryan Novak, Ken Ornstein',
    BuyDayMinimum: 6,
    Cost: 27
  },
  {
    SessionId: 3004,
    SessionDate: '2025-11-19T07:30:00.000Z', // Tuesday (not Wednesday/Friday)
    Note: '7/10. Goalies: Josh Callsen, Ryan Novak',
    BuyDayMinimum: 6,
    Cost: 27
  }
];

// Find Wednesday and Friday sessions
const wednesdayFridaySessions = mockSessions.filter((session) => {
  const sessionDate = new Date(session.SessionDate);
  const dayOfWeek = sessionDate.getDay(); // 0=Sunday, 3=Wednesday, 5=Friday
  const daysUntilSession = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only Wednesday (3) and Friday (5) sessions in the next 2 weeks
  return (dayOfWeek === 3 || dayOfWeek === 5) && daysUntilSession > 0 && daysUntilSession <= 14;
});

console.log(`📅 Found ${wednesdayFridaySessions.length} Wednesday/Friday sessions to auto-register:`);
console.log('');

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
  console.log(`   📝 Note: ${session.Note}`);
  console.log('');
});

console.log('🤖 WHAT THE BOT WILL DO:');
console.log('');
console.log('1. 📅 Every Tuesday and Thursday at 7:00 PM PST:');
console.log('   - Automatically discovers ALL Wednesday and Friday sessions');
console.log('   - Schedules auto-registration for each session');
console.log('');
console.log('2. ⏰ Every 5 seconds (24/7 monitoring):');
console.log('   - Checks if any buy windows are opening');
console.log('   - When a buy window opens (9:25 AM PST), automatically registers');
console.log('   - Sends notification of success/failure');
console.log('');
console.log('3. 📊 Daily at 8:00 AM:');
console.log('   - Reports how many sessions are scheduled for registration');
console.log('');
console.log('✅ RESULT: You will be automatically registered for EVERY Wednesday and Friday session!');
console.log('');
console.log('🚀 To start the bot:');
console.log('   npm run auto-register');
console.log('');
console.log('📱 Optional: The bot can also send Telegram notifications if you want updates');
