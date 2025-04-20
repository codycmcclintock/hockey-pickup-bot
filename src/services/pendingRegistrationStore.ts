import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(__dirname, '../../pending_registrations.json');

export interface PendingRegistration {
  sessionId: number;
  sessionDate: string;
  buyWindowDate: string;
  cost: number;
  userId: number;
}

export function loadPendingRegistrations(): Record<string, PendingRegistration> {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load pending registrations:', err);
    return {};
  }
}

export function savePendingRegistrations(registrations: Record<string, PendingRegistration>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save pending registrations:', err);
  }
}

export function addPendingRegistration(reg: PendingRegistration) {
  const all = loadPendingRegistrations();
  all[reg.sessionId] = reg;
  savePendingRegistrations(all);
}

export function removePendingRegistration(sessionId: number) {
  const all = loadPendingRegistrations();
  delete all[sessionId];
  savePendingRegistrations(all);
}
