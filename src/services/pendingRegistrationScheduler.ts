import schedule, { Job } from 'node-schedule';
import { loadPendingRegistrationsPg, removePendingRegistrationPg, PendingRegistration } from './pendingRegistrationStorePg';
import { registerForSession } from './session';
import { sendMessage } from './telegram';

interface ScheduledJob {
  job: Job;
  reg: PendingRegistration;
}

const scheduledJobs: ScheduledJob[] = [];

export async function scheduleAllPendingRegistrations() {
  const pending = await loadPendingRegistrationsPg();
  for (const reg of pending) {
    scheduleRegistrationJob(reg);
  }
}

export function scheduleRegistrationJob(reg: PendingRegistration) {
  const buyWindow = new Date(reg.buyWindowDate);
  const job = schedule.scheduleJob(buyWindow, async function() {
    await attemptRegistrationWithRetry(reg, 0);
  });
  scheduledJobs.push({ job, reg });
}

async function attemptRegistrationWithRetry(reg: PendingRegistration, attempt: number) {
  try {
    await sendMessage(`⏰ Buy window open! Attempting to register you for session ${reg.sessionId} (attempt ${attempt + 1}/3)...`);
    await registerForSession(reg.sessionId);
    await removePendingRegistrationPg(reg.sessionId, reg.userId);
    await sendMessage(`✅ Successfully registered for session ${reg.sessionId}!`);
  } catch (error) {
    if (attempt < 2) {
      await sendMessage(`⚠️ Registration attempt ${attempt + 1} failed for session ${reg.sessionId}. Retrying...`);
      // Retry after 3 seconds
      setTimeout(() => attemptRegistrationWithRetry(reg, attempt + 1), 3000);
    } else {
      await sendMessage(`❌ Registration failed after 3 attempts for session ${reg.sessionId}. Giving up.`);
      await removePendingRegistrationPg(reg.sessionId, reg.userId);
    }
  }
}
