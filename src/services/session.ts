import axios from 'axios';
import { login } from './auth';
import { sendMessage } from './telegram';



export interface Session {
  SessionId: number;
  SessionDate: string;
  Note: string;
  BuyDayMinimum: number;
  Cost: number;
}

export interface SessionDetails {
  SessionId: number;
  SessionDate: string;
  Note: string;
  BuyDayMinimum: number;
  Cost: number;
  CurrentRoster?: any[];
  MaxPlayers?: number;
  AvailableSpots?: number;
  IsUserRegistered?: boolean;
  CanUserBuy?: boolean;
}

// Disable SSL verification for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const checkUpcomingSessions = async (): Promise<Session[]> => {
  await sendMessage('🔍 Checking for upcoming sessions...', false);
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
      // Set buy window to 9:24 AM PST
      buyWindowDate.setHours(9, 24, 0, 0);

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
      // Set buy window to 9:24 AM PST
      buyWindowDate.setHours(9, 24, 0, 0);

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
    if (futureSessions.length === 0) {
      await sendMessage('ℹ️ No upcoming sessions found');
    } else {
      await sendMessage(`✅ Found ${futureSessions.length} upcoming sessions!`);
    }
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

export const getSessionDetails = async (sessionId: number): Promise<SessionDetails | null> => {
  try {
    console.log('Getting session details for:', sessionId);
    
    const token = await login();
    const api = axios.create({
      baseURL: 'https://api.hockeypickup.com',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const response = await api.post('/graphql', {
      query: `
        query GetSessionDetails($sessionId: Int!) {
          Session(sessionId: $sessionId) {
            SessionId
            SessionDate
            Note
            BuyDayMinimum
            Cost
            CurrentRoster {
              UserId
              FirstName
              LastName
              Email
            }
            MaxPlayers
            IsUserRegistered
            CanUserBuy
          }
        }
      `,
      variables: {
        sessionId: sessionId
      }
    });
    
    if (!response.data || !response.data.data || !response.data.data.Session) {
      console.error('No session data found for ID:', sessionId);
      return null;
    }
    
    const session = response.data.data.Session;
    const currentRoster = session.CurrentRoster || [];
    const maxPlayers = session.MaxPlayers || 20; // Default to 20 if not specified
    const availableSpots = maxPlayers - currentRoster.length;
    
    return {
      ...session,
      CurrentRoster: currentRoster,
      MaxPlayers: maxPlayers,
      AvailableSpots: availableSpots
    };
  } catch (error) {
    console.error('Error getting session details:', error);
    return null;
  }
};

export const canBuySpot = async (sessionId: number): Promise<boolean> => {
  try {
    const sessionDetails = await getSessionDetails(sessionId);
    
    if (!sessionDetails) {
      console.log('No session details found for ID:', sessionId);
      return false;
    }
    
    // Use API's built-in fields if available
    if (sessionDetails.IsUserRegistered !== undefined) {
      console.log('Session details (API fields):', {
        sessionId,
        isUserRegistered: sessionDetails.IsUserRegistered,
        canUserBuy: sessionDetails.CanUserBuy,
        maxPlayers: sessionDetails.MaxPlayers,
        rosterCount: sessionDetails.CurrentRoster?.length || 0
      });
      
      // If API provides CanUserBuy field, use it directly
      if (sessionDetails.CanUserBuy !== undefined) {
        return sessionDetails.CanUserBuy;
      }
      
      // Otherwise, use IsUserRegistered field
      return !sessionDetails.IsUserRegistered;
    }
    
    // Fallback to manual calculation if API fields not available
    const hasAvailableSpots = (sessionDetails.AvailableSpots || 0) > 0;
    const currentUserEmail = process.env.USER_EMAIL;
    const isAlreadyRegistered = sessionDetails.CurrentRoster?.some((player: any) => 
      player.Email === currentUserEmail || player.UserId === currentUserEmail
    ) || false;
    
    console.log('Session details (fallback):', {
      sessionId,
      availableSpots: sessionDetails.AvailableSpots,
      maxPlayers: sessionDetails.MaxPlayers,
      rosterCount: sessionDetails.CurrentRoster?.length || 0,
      hasAvailableSpots,
      isAlreadyRegistered
    });
    
    return hasAvailableSpots && !isAlreadyRegistered;
  } catch (error) {
    console.error('Error checking if can buy spot:', error);
    return false;
  }
};

export const registerForSession = async (sessionId: number): Promise<void> => {
  await sendMessage('🟡 Trying to secure your spot for this session...', false);
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

    // Simple success notification
    if (response.data.Success) {
      await sendMessage('Hockey Spot Purchased');
    } else {
      await sendMessage('❌ Registration Failed');
    }

    if (!response.data.Success) {
      return;
    }
  } catch (error: any) {
    console.error('Error registering for session:', error);
    const errorMessage = error.response?.data?.Message || error.message || 'Unknown error';
    await sendMessage(`❌ Registration Failed: ${errorMessage}`);
  }
};
