import axios from 'axios';
import { login } from './auth';
import { sendMessage } from './telegram';



interface Session {
  SessionId: number;
  SessionDate: string;
  Note: string;
  BuyDayMinimum: number;
  Cost: number;
}

// Disable SSL verification for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const checkUpcomingSessions = async (): Promise<Session[]> => {
  try {
    console.log('Checking upcoming sessions...');
    const sessions = await getAllSessions();
    const now = new Date();
    if (sessions.length === 0) return [];

    // Find sessions in the next week that we should notify about
    const upcomingSessions = sessions.filter(session => {
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);

      // Check if the session is in the future and the buy window is approaching
      const isInFuture = sessionDate > now;
      const daysUntilBuyWindow = Math.floor((buyWindowDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Notify if buy window is tomorrow or in 2 days
      return isInFuture && (daysUntilBuyWindow === 1 || daysUntilBuyWindow === 2);
    });

    // Send notifications for each upcoming session
    for (const session of upcomingSessions) {
      const sessionDate = new Date(session.SessionDate);
      const buyWindowDate = new Date(sessionDate);
      buyWindowDate.setDate(buyWindowDate.getDate() - session.BuyDayMinimum);

      const daysUntilBuyWindow = Math.floor((buyWindowDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const message = `
🏒 Upcoming Hockey Session:
📅 Date: ${sessionDate.toLocaleDateString()}
📝 Note: ${session.Note || 'No note'}
💰 Cost: $${session.Cost}
⏰ Buy Window Opens: ${buyWindowDate.toLocaleString()}
🕐 Days Until Buy Window: ${daysUntilBuyWindow}

Would you like me to automatically register you when the buy window opens? (Reply with 'yes' or 'no')`;

      await sendMessage(message);

      // Store the session info for later registration
      if (daysUntilBuyWindow === 1) {
        // TODO: Store this in a database instead of memory
        global.pendingRegistrations = global.pendingRegistrations || {};
        global.pendingRegistrations[session.SessionId] = {
          sessionDate: session.SessionDate,
          buyWindowDate: buyWindowDate,
          cost: session.Cost
        };
      }
    }
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    const errorMessage = [
      '❌ Error fetching sessions:',
      error.message,
      '',
      'Technical Details:',
      error.response ? 
        `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}` :
        `Error: ${error.message}\nStack: ${error.stack}`
    ].join('\n');
    
    await sendMessage(errorMessage);
    return [];
  }
  return [];
};

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    console.log('Starting session fetch...');
    
    // First login to get the token
    const token = await login();
    console.log('Got auth token, length:', token.length);
    
    const api = axios.create({
      baseURL: 'https://api.hockeypickup.com',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Fetching sessions from API...');
    console.log('Making request to:', `${process.env.API_URL}/graphql`);
    const response = await api.post('/graphql', {
      query: `
        query GetSessions {
          Sessions {
            SessionId
            SessionDate
            Note
            BuyDayMinimum
            Cost
          }
        }
      `
    });
    
    console.log('API Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });

    if (!response.data || !response.data.data) {
      console.error('Invalid API response:', response.data);
      await sendMessage('❌ Error: Invalid API response format');
      return [];
    }

    // Filter to only include future sessions
    const now = new Date();
    const sessions = response.data.data.Sessions;
    console.log('Got sessions:', sessions);
    
    const futureSessions = sessions.filter((session: Session) => {
      const sessionDate = new Date(session.SessionDate);
      return sessionDate > now;
    });

    if (futureSessions.length === 0) {
      await sendMessage('ℹ️ No upcoming sessions found');
      return [];
    }

    console.log('Found future sessions:', futureSessions);
    return futureSessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

export const formatSessionMessage = (session: Session): string => {
  return `
🏒 Hockey Session:
📅 Date: ${new Date(session.SessionDate).toLocaleDateString()}
📝 Note: ${session.Note || 'No note'}
💰 Cost: $${session.Cost}
`;
};

export const registerForSession = async (sessionId: number): Promise<void> => {
  try {
    console.log('Starting registration process for session:', sessionId);

    console.log('Getting auth token...');
    const token = await login();
    console.log('Token received, length:', token.length);
    
    const api = axios.create({
      baseURL: 'https://api.hockeypickup.com',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Sending buy request for session:', sessionId);
    
    // TeamAssignment is required by the API
    // 0 = None, 1 = Dark, 2 = Light
    // Create the buy request
    const buyRequest = { sessionId };

    console.log('Request body:', JSON.stringify(buyRequest, null, 2));

    const response = await api.post('/BuySell/buy', buyRequest);

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Send the registration result message
    const debugInfo = [
      response.data.Success ? '✅ Registration Successful!' : '❌ Registration Failed!',
      '',
      response.data.Message ? `Message: ${response.data.Message}` : '',
      '',
      'Debug Info:',
      `• Session ID: ${sessionId}`,
      `• API URL: ${process.env.API_URL}/BuySell/buy`,
      `• Token Present: ${!!token}`,
      `• Response Status: ${response.status}`,
      '',
      'Technical Details:',
      JSON.stringify(response.data, null, 2)
    ].join('\n');
    
    await sendMessage(debugInfo, true);

    if (!response.data.Success) {
      return;
    }

    // Get session details for payment links
    const sessions = await getAllSessions();
    const session = sessions.find(s => s.SessionId === sessionId);
    
    if (!session) {
      console.error('Session not found:', sessionId);
      return;
    }

    // Get payment links with markdown formatting
    const sessionDate = new Date(session.SessionDate).toLocaleDateString();
    const paymentLinks = [
      `💳 [Pay with Venmo](https://venmo.com/codymcclintock?txn=pay&note=Hockey%20Session%20${sessionDate}&amount=${session.Cost})`,
      `💲 [Pay with Cash App](https://cash.app/$codymcclintock/${session.Cost}?note=Hockey%20Session%20${sessionDate})`,
      `💱 [Pay with PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=codymcclintock41@gmail.com&amount=${session.Cost}&item_name=Hockey%20Session%20${sessionDate}&currency_code=USD)`
    ];

    const message = [
      '✅ Successfully registered for the session!',
      '',
      '💰 Payment Options:',
      ...paymentLinks
    ].join('\n');

    await sendMessage(message, true);
  } catch (error: any) {
    console.error('Error registering for session:', error);
    const errorDetails = [
      '',
      'Debug Info:',
      `• Session ID: ${sessionId}`,
      `• API URL: https://localhost:7042/BuySell/buy`,
      `• Error Type: ${error.name}`,
      '',
      'Technical Details:',
      '```',
      error.response ? 
        `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}` :
        `Error: ${error.message}\nStack: ${error.stack}`,
      '```'
    ].join('\n');
    await sendMessage(`❌ Registration failed!${errorDetails}`, true);
  }
};
