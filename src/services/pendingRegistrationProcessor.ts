import { registerForSession } from './session';
import { loadPendingRegistrationsPg, removePendingRegistrationPg, PendingRegistration } from './pendingRegistrationStorePg';
import { sendMessage } from './telegram';

// This function should be scheduled or called in your main bot loop
export async function processPendingRegistrations() {
  const pending = await loadPendingRegistrationsPg();
  const now = new Date();
  for (const reg of pending) {
    const buyWindow = new Date(reg.buyWindowDate);
    // If it's time to register (now >= buy window)
    if (now >= buyWindow) {
      await sendMessage(`⏰ Buy window open! Attempting to register you for session ${reg.sessionId}...`);
      await registerForSession(reg.sessionId);
      await removePendingRegistrationPg(reg.sessionId, reg.userId);
    }
  }
}
