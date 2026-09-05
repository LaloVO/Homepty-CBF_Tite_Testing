/**
 * Módulo Inteligencia — registro de consumo del Brain (billing)
 *
 * El consumo de capacidades del Brain (valueweb, ai.*, ml.*) se registra en la
 * tabla `brain_api_usage` de la BASE DE DATOS DEL BRAIN (proyecto Supabase
 * zwmzfqlxcgqlasnbqfjb), no en la DB central del CBF (nxouqoyppkiqrhfzovny).
 *
 * La conexión usa BRAIN_DATABASE_URL (direct connection) porque el cliente
 * @supabase/supabase-js del CBF apunta a la DB central.
 */
import { Pool } from "pg";

const BRAIN_DATABASE_URL = process.env.BRAIN_DATABASE_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!BRAIN_DATABASE_URL) {
    throw new Error("BRAIN_DATABASE_URL no está configurada");
  }
  if (!pool) {
    pool = new Pool({ connectionString: BRAIN_DATABASE_URL, max: 2, idleTimeoutMillis: 30_000 });
  }
  return pool;
}

export interface BrainUsageEntry {
  user_id_supabase?: string | null;
  cbf_api_key?: string | null;
  brain_endpoint: string;
  cost_units?: number;
  status?: string;
  latency_ms?: number;
}

/**
 * Registra consumo de un endpoint del Brain. Fire-and-forget: nunca lanza
 * errores hacia el caller (el billing no debe romper la experiencia).
 */
export async function trackBrainUsage(entry: BrainUsageEntry): Promise<void> {
  try {
    const p = getPool();
    await p.query(
      `INSERT INTO brain_api_usage
        (user_id_supabase, cbf_api_key, brain_endpoint, cost_units, status, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.user_id_supabase ?? null,
        entry.cbf_api_key ?? null,
        entry.brain_endpoint,
        entry.cost_units ?? 1,
        entry.status ?? "ok",
        entry.latency_ms ?? null,
      ]
    );
  } catch (error) {
    console.error("[Intelligence] Error registrando consumo del Brain:", error);
  }
}

/**
 * Cierra el pool (uso en pruebas / graceful shutdown). Fire-and-forget.
 */
export async function closeBrainUsagePool(): Promise<void> {
  try {
    if (pool) {
      await pool.end();
      pool = null;
    }
  } catch {
    // noop
  }
}
