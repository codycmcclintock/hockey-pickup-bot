import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export interface PendingRegistration {
  sessionId: number;
  sessionDate: string;
  buyWindowDate: string;
  cost: number;
  userId: number;
}

export async function addPendingRegistrationPg(reg: PendingRegistration) {
  await pool.query(
    `INSERT INTO pending_registrations (session_id, session_date, buy_window_date, cost, user_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id, user_id) DO NOTHING`,
    [reg.sessionId, reg.sessionDate, reg.buyWindowDate, reg.cost, reg.userId]
  );
}

export async function removePendingRegistrationPg(sessionId: number, userId: number) {
  await pool.query(
    `DELETE FROM pending_registrations WHERE session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
}

export async function loadPendingRegistrationsPg(): Promise<PendingRegistration[]> {
  const res = await pool.query('SELECT session_id AS "sessionId", session_date AS "sessionDate", buy_window_date AS "buyWindowDate", cost, user_id AS "userId" FROM pending_registrations');
  return res.rows;
}
