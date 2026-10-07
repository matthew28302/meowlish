/**
 * Adapter Postgres cho lớp dữ liệu người dùng.
 *
 * MỤC ĐÍCH: giữ nguyên cách gọi như better-sqlite3 (`db.prepare(sql).get/all/run`)
 * để không phải sửa hàng trăm câu SQL, và chỉ đổi đúng một thứ: kết quả trả về
 * là Promise (driver Postgres là bất đồng bộ) nên call site phải `await`.
 *
 * BA THỨ PHẢI GIỮ ĐÚNG — mỗi cái đều đã tạo ra lỗi ngầm ít nhất một lần:
 *
 * 1. `?` -> `$1..$n`. postgres.js dùng tham số đánh số, còn code hiện tại dùng
 *    `?` của SQLite. Bộ dịch phải BỎ QUA dấu `?` nằm trong chuỗi, trong identifier
 *    nháy kép và trong chú thích.
 * 2. `types: { BigInt: ... }` — tên type là `BigInt` (hoa ký tự đầu, OID 20).
 *    Mặc định postgres.js trả int8 về dạng CHUỖI, khiến mọi so sánh kiểu số sai
 *    (`expires_at > Date.now()`). Viết `bigint` chữ thường sẽ bị bỏ qua mà KHÔNG
 *    báo lỗi.
 * 3. Pool `max: 1` + `prepare: false`. Serverless mở rất nhiều kết nối ngắn; mặc
 *    định postgres.js là 10 kết nối mỗi instance và transaction pooler của
 *    Supabase không hỗ trợ prepared statement.
 */
import postgres from 'postgres';

export type SqlParam = string | number | bigint | boolean | null | undefined | Buffer | Date;

/** Chuyển placeholder `?` của SQLite sang `$1, $2, ...` của Postgres. */
export function toPgPlaceholders(sql: string): string {
  let out = '';
  let n = 0;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];

    // Chuỗi '...' (nhân đôi '' bên trong)
    if (ch === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") { j += 2; continue; }
          break;
        }
        j++;
      }
      out += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Identifier "..." (nhân đôi "" bên trong)
    if (ch === '"') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === '"') {
          if (sql[j + 1] === '"') { j += 2; continue; }
          break;
        }
        j++;
      }
      out += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Chú thích -- ... và /* ... */
    if (ch === '-' && sql[i + 1] === '-') {
      let j = i;
      while (j < sql.length && sql[j] !== '\n') j++;
      out += sql.slice(i, j);
      i = j;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      let j = i + 2;
      while (j < sql.length && !(sql[j] === '*' && sql[j + 1] === '/')) j++;
      out += sql.slice(i, Math.min(j + 2, sql.length));
      i = j + 2;
      continue;
    }

    if (ch === '?') {
      n += 1;
      out += '$' + n;
      i++;
      continue;
    }

    out += ch;
    i++;
  }
  return out;
}

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Thiếu DATABASE_URL. Đặt chuỗi kết nối transaction pooler của Supabase vào biến môi trường.'
    );
  }
  client = postgres(url, {
    max: 1,
    prepare: false,
    ssl: 'require',
    connect_timeout: 20,
    idle_timeout: 20,
    onnotice: () => {},
    types: {
      BigInt: {
        to: 20,
        from: [20],
        serialize: (x: unknown) => String(x),
        parse: (x: string) => Number(x),
      },
    },
  });
  return client;
}

/** Có Postgres hay không — dùng để quyết định fallback sang SQLite. */
export function isPgEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export type RunResult = { changes: number };

export interface PreparedStatement {
  sql: string;
  get<T = any>(...params: SqlParam[]): Promise<T | undefined>;
  all<T = any>(...params: SqlParam[]): Promise<T[]>;
  run(...params: SqlParam[]): Promise<RunResult>;
}

/** Giống better-sqlite3: handle có `.prepare()` — dùng cho transaction. */
export interface DbHandle {
  prepare(sqlText: string): PreparedStatement;
}

/** Chỉ phần `unsafe` mà ta thực sự gọi. */
type Executor = { unsafe: (sql: string, params?: never[]) => Promise<unknown[]> };

/**
 * Lấy số dòng bị ảnh hưởng từ kết quả của postgres.js.
 *
 * postgres.js trả về MẢNG CÁC DÒNG, không trả số dòng bị ảnh hưởng. Với
 * `UPDATE`/`DELETE` không có `RETURNING` thì mảng luôn rỗng ⇒ `rows.length === 0`
 * dù câu lệnh đã sửa hàng loạt dòng.
 *
 * Bản cũ trả `changes: rows.length` ⇒ mọi câu `UPDATE` đều báo `changes === 0`.
 * Nếu chuyển sang Postgres nguyên trạng thì 6 tính năng hỏng ngay:
 *   - `claimTimedReward` không bao giờ trả thưởng PVP/đua
 *   - `consumeProgressBudget` không bao giờ cộng thưởng học tập
 *   - `/api/progress` không bao giờ ghi được item mới
 *   - mua vật phẩm / trừ coins báo "không đủ coins" dù còn đủ
 *   - `finish_battle_room` không bao giờ trao thưởng
 *
 * Cách đúng: đọc `result.count` mà postgres.js đính kèm, fallback về `rows.length`.
 */
function affectedRows(rows: Record<string, unknown>[], raw: unknown): number {
  if (raw && typeof raw === 'object') {
    const count = (raw as { count?: unknown }).count;
    if (typeof count === 'number' && Number.isFinite(count)) return count;
  }
  return rows.length;
}

function buildStatement(exec: Executor, sqlText: string): PreparedStatement {
  const translated = toPgPlaceholders(sqlText);
  const run = (params: SqlParam[]) =>
    exec.unsafe(translated, params.map((p) => (p === undefined ? null : p)) as unknown as never[]) as Promise<
      Record<string, unknown>[]
    >;

  return {
    sql: translated,
    async get<T>(...params: SqlParam[]): Promise<T | undefined> {
      const rows = await run(params);
      return rows[0] as unknown as T | undefined;
    },
    async all<T>(...params: SqlParam[]): Promise<T[]> {
      const rows = await run(params);
      return rows as unknown as T[];
    },
    async run(...params: SqlParam[]): Promise<RunResult> {
      // Gọi trực tiếp để giữ được object kết quả gốc (chứa `count`).
      const raw = (await exec.unsafe(
        translated,
        params.map((p) => (p === undefined ? null : p)) as unknown as never[]
      )) as unknown;
      const rows = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      return { changes: affectedRows(rows, raw) };
    },
  };
}

/**
 * Điểm vào chính: `pgDb.prepare(...)`.
 * Chỉ nên dùng cho bảng DỮ LIỆU NGƯỜI DÙNG — bảng nội dung tĩnh vẫn nằm ở SQLite.
 */
export const pgDb: DbHandle & {
  transaction<T>(fn: (t: DbHandle) => Promise<T>): Promise<T>;
  exec(sqlText: string): Promise<void>;
  end(): Promise<void>;
} = {
  prepare(sqlText: string): PreparedStatement {
    return buildStatement(getClient() as unknown as Executor, sqlText);
  },

  /**
   * Transaction thật của Postgres: mọi statement trong callback cùng commit hoặc
   * cùng rollback. Callback nhận HANDLE (`t.prepare(...)`), giống
   * `db.transaction()` của better-sqlite3 — không phải một statement.
   */
  async transaction<T>(fn: (t: DbHandle) => Promise<T>): Promise<T> {
    const c = getClient();
    const out = await c.begin(async (inner) => {
      const handle: DbHandle = {
        prepare: (sqlText: string) => buildStatement(inner as unknown as Executor, sqlText),
      };
      return fn(handle);
    });
    return out as T;
  },

  /**
   * Chạy SQL không tham số (DDL, `SET`, v.v.).
   *
   * SQLite có `db.exec()` và code đang dùng ở nhiều nơi; Postgres không có câu
   * tương đương một lệnh. Ở đây chỉ chấp nhận SQL không có tham số — không nối
   * chuỗi từ input của người dùng vào đây.
   */
  async exec(sqlText: string): Promise<void> {
    const trimmed = sqlText.trim();
    if (!trimmed) return;
    if (trimmed.includes('?') || /\$[0-9]+/.test(trimmed)) {
      throw new Error(
        'pgDb.exec() khong chap nhan tham so. Dung prepare() cho cau lenh co bien.'
      );
    }
    await getClient().unsafe(trimmed);
  },

  async end() {
    if (client) {
      await client.end({ timeout: 5 });
      client = null;
    }
  },
};
