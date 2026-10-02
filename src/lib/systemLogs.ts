import { db } from './db';
import logger from './logger';

export interface AccessLogEntry {
  id?: string;
  timestamp?: string;
  user_id?: string | null;
  username?: string | null;
  action: string;
  ip?: string | null;
  user_agent?: string | null;
  status?: 'success' | 'failed' | 'blocked' | 'rate_limited' | 'pending_2fa';
  details?: string | null;
}

export interface ErrorLogEntry {
  id?: string;
  timestamp?: string;
  endpoint?: string | null;
  error_message: string;
  stack_trace?: string | null;
  ip?: string | null;
  user_id?: string | null;
  severity?: 'error' | 'warn' | 'fatal';
}

export interface EmailLogEntry {
  id?: string;
  timestamp?: string;
  recipient: string;
  subject?: string | null;
  purpose: string;
  status: 'sent' | 'failed';
  error_message?: string | null;
  ip?: string | null;
}

// 1. Ghi log truy cập / đăng nhập / thao tác
export function logAccess(entry: AccessLogEntry): void {
  try {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO system_access_logs (id, user_id, username, action, ip, user_agent, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.user_id || null,
      entry.username || null,
      entry.action,
      entry.ip || null,
      (entry.user_agent || '').slice(0, 255),
      entry.status || 'success',
      entry.details || null
    );
  } catch (err) {
    logger.warn('[SystemLogs] Failed to write access log:', { error: err });
  }
}

// 2. Ghi log lỗi hệ thống / API error
export function logError(entry: ErrorLogEntry): void {
  try {
    const id = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO system_error_logs (id, endpoint, error_message, stack_trace, ip, user_id, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.endpoint || null,
      entry.error_message,
      entry.stack_trace || null,
      entry.ip || null,
      entry.user_id || null,
      entry.severity || 'error'
    );
  } catch (err) {
    logger.warn('[SystemLogs] Failed to write error log:', { error: err });
  }
}

// 3. Ghi log gửi email OTP & thông báo
export function logEmail(entry: EmailLogEntry): void {
  try {
    const id = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO system_email_logs (id, recipient, subject, purpose, status, error_message, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.recipient,
      entry.subject || null,
      entry.purpose,
      entry.status,
      entry.error_message || null,
      entry.ip || null
    );
  } catch (err) {
    logger.warn('[SystemLogs] Failed to write email log:', { error: err });
  }
}

// 4. Truy vấn Log Access (phân trang, tìm kiếm, lọc)
export function getAccessLogs(params: {
  limit?: number;
  offset?: number;
  search?: string;
  action?: string;
  status?: string;
}): { logs: any[]; total: number } {
  try {
    const limit = Math.min(Math.max(params.limit || 50, 1), 200);
    const offset = Math.max(params.offset || 0, 0);

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push('(username LIKE ? OR user_id LIKE ? OR ip LIKE ? OR action LIKE ? OR details LIKE ?)');
      values.push(q, q, q, q, q);
    }

    if (params.action && params.action !== 'all') {
      conditions.push('action = ?');
      values.push(params.action);
    }

    if (params.status && params.status !== 'all') {
      conditions.push('status = ?');
      values.push(params.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM system_access_logs ${whereClause}`).get(...values) as { count: number };
    const total = countRow?.count || 0;

    const logs = db.prepare(`
      SELECT * FROM system_access_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(...values, limit, offset);

    return { logs, total };
  } catch (err) {
    logger.error('[SystemLogs] Error fetching access logs:', { error: err });
    return { logs: [], total: 0 };
  }
}

// 5. Truy vấn Log Error (phân trang, tìm kiếm, lọc)
export function getErrorLogs(params: {
  limit?: number;
  offset?: number;
  search?: string;
  severity?: string;
}): { logs: any[]; total: number } {
  try {
    const limit = Math.min(Math.max(params.limit || 50, 1), 200);
    const offset = Math.max(params.offset || 0, 0);

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push('(endpoint LIKE ? OR error_message LIKE ? OR stack_trace LIKE ? OR ip LIKE ?)');
      values.push(q, q, q, q);
    }

    if (params.severity && params.severity !== 'all') {
      conditions.push('severity = ?');
      values.push(params.severity);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM system_error_logs ${whereClause}`).get(...values) as { count: number };
    const total = countRow?.count || 0;

    const logs = db.prepare(`
      SELECT * FROM system_error_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(...values, limit, offset);

    return { logs, total };
  } catch (err) {
    logger.error('[SystemLogs] Error fetching error logs:', { error: err });
    return { logs: [], total: 0 };
  }
}

// 6. Truy vấn Log Email (phân trang, tìm kiếm, lọc)
export function getEmailLogs(params: {
  limit?: number;
  offset?: number;
  search?: string;
  purpose?: string;
  status?: string;
}): { logs: any[]; total: number } {
  try {
    const limit = Math.min(Math.max(params.limit || 50, 1), 200);
    const offset = Math.max(params.offset || 0, 0);

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push('(recipient LIKE ? OR subject LIKE ? OR purpose LIKE ? OR error_message LIKE ?)');
      values.push(q, q, q, q);
    }

    if (params.purpose && params.purpose !== 'all') {
      conditions.push('purpose = ?');
      values.push(params.purpose);
    }

    if (params.status && params.status !== 'all') {
      conditions.push('status = ?');
      values.push(params.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM system_email_logs ${whereClause}`).get(...values) as { count: number };
    const total = countRow?.count || 0;

    const logs = db.prepare(`
      SELECT * FROM system_email_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(...values, limit, offset);

    return { logs, total };
  } catch (err) {
    logger.error('[SystemLogs] Error fetching email logs:', { error: err });
    return { logs: [], total: 0 };
  }
}

// 7. Thống kê tổng hợp số lượng log
export function getLogSummary(): {
  totalAccess: number;
  totalErrors: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
} {
  try {
    const acc = db.prepare('SELECT COUNT(*) as count FROM system_access_logs').get() as { count: number };
    const err = db.prepare('SELECT COUNT(*) as count FROM system_error_logs').get() as { count: number };
    const emSent = db.prepare("SELECT COUNT(*) as count FROM system_email_logs WHERE status = 'sent'").get() as { count: number };
    const emFail = db.prepare("SELECT COUNT(*) as count FROM system_email_logs WHERE status = 'failed'").get() as { count: number };

    return {
      totalAccess: acc?.count || 0,
      totalErrors: err?.count || 0,
      totalEmailsSent: emSent?.count || 0,
      totalEmailsFailed: emFail?.count || 0,
    };
  } catch {
    return { totalAccess: 0, totalErrors: 0, totalEmailsSent: 0, totalEmailsFailed: 0 };
  }
}
