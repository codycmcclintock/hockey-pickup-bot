import { registerForSession } from './session';
import { loadPendingRegistrations, removePendingRegistration, PendingRegistration } from './pendingRegistrationStore';
import { sendMessage } from './telegram';

// This function should be scheduled or called in your main bot loop
export async function processPendingRegistrations() {
  const pending = loadPendingRegistrations();
  const now = new Date();
  for (const regId in pending) {
    const reg: PendingRegistration = pending[regId];
    const buyWindow = new Date(reg.buyWindowDate);
    // If it's time to register (now >= buy window)
    if (now >= buyWindow) {
      await sendMessage(`⏰ Buy window open! Attempting to register you for session ${reg.sessionId}...`);
      await registerForSession(reg.sessionId);
      removePendingRegistration(reg.sessionId);
    }
  }
}
