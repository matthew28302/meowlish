/**
 * Chặn tái phát các lỗ hổng đã vá (đợt audit thứ 2).
 *
 * Mỗi test dưới đây mô tả đúng một đòn tấn công đã THÀNH CÔNG trên code cũ.
 * Nếu ai đó gỡ bỏ biện pháp bảo vệ, test này phải đỏ.
 *
 * Đã sửa ở đợt này:
 *  1. request_email_verification không xác thực → ghi đè email nạn nhân → forgot-password
 *     đặt mật khẩu mới gửi về email đó ⇒ chiếm tài khoản.
 *  2. GET /api/auth không xác thực, trả email/coins của bất kỳ ai (enumeration + PII).
 *  3. verify_email lấy userId từ body ⇒ bật email_verified cho nạn nhân + lộ hồ sơ.
 *  4. finish_battle_room không kiểm thành viên ⇒ cước 2× cược của người khác.
 *  5. respond_proposal không kiểm thành viên ⇒ cưỡng ép kết hôn + hoàn coins tùy ý.
 *  6. POST /api/progress cộng thưởng mỗi request (vòng `changes` là code chết).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function read(file: string): string {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

/**
 * Trích đoạn xử lý một `action` cụ thể trong route, để test đúng phạm vi.
 *
 * Phải khớp đúng dòng so sánh `action === '<tên>'` — tên action cũng xuất hiện
 * sớm hơn trong phần khai báo rate limit; tìm chuỗi đầu tiên sẽ lấy nhầm khối và
 * mọi khẳng định bảo mật phía sau trở nên vô nghĩa.
 */
function actionBlock(file: string, action: string, maxLines = 90): string {
  const lines = read(file).split(/\r?\n/);
  const handler = new RegExp(`action\\s*===\\s*['"]${action}['"]`);
  const matches: number[] = [];
  lines.forEach((l, i) => {
    if (handler.test(l)) matches.push(i);
  });
  if (matches.length === 0) {
    throw new Error(`Khong tim thay nhanh xu ly cho action "${action}" trong ${file}`);
  }

  // Lần khớp nằm trong khối khai báo rate limit sẽ đi kèm maxAttempts/windowMs.
  const handlerLine = matches.find((i) =>
    !/maxAttempts|windowMs/.test(lines[i]) &&
    !lines.slice(Math.max(0, i - 3), i).some((l) => /checkRateLimit|rateLimit|key:/.test(l))
  );
  const start = handlerLine ?? matches[matches.length - 1];
  return lines.slice(start, start + maxLines).join('\n');
}

const AUTH_ROUTE = 'src/app/api/auth/route.ts';
const PET_ROUTE = 'src/app/api/pet/route.ts';
const PROGRESS_ROUTE = 'src/app/api/progress/route.ts';

describe('1. Không được xác thực email cho tài khoản khác', () => {
  const block = actionBlock(AUTH_ROUTE, 'request_email_verification');

  it('nhánh xác thực email phải kiểm tra phiên', () => {
    expect(block).toMatch(/getAuthenticatedUser\s*\(/);
  });

  it('phải so khớp userId trong phiên với userId trong yêu cầu', () => {
    expect(block).toMatch(/userId\s*!==\s*userId|auth\.userId\s*!==|userId\s*!==\s*auth\.userId/);
  });

  it('phải chặn trước khi ghi email (không ghi khi chưa xác thực)', () => {
    const verifyIdx = block.indexOf('getAuthenticatedUser');
    const writeIdx = block.indexOf('SET email = ?');
    expect(verifyIdx).toBeGreaterThan(-1);
    expect(writeIdx).toBeGreaterThan(-1);
    expect(verifyIdx, 'phai xac thuc TRUOC khi ghi email').toBeLessThan(writeIdx);
  });
});

describe('2. GET /api/auth không được lộ hồ sơ người khác', () => {
  const getBlock = read(AUTH_ROUTE).slice(0, 12000);

  it('GET yêu cầu phiên hợp lệ', () => {
    expect(getBlock).toMatch(/getAuthenticatedUser\s*\(/);
  });

  it('không còn tra cứu người dùng bằng tham số `username` tùy ý', () => {
    // Tra cứu theo username không xác thực là công cụ enumeration hoàn hảo.
    expect(getBlock).not.toMatch(/searchParams\.get\('username'\)/);
  });

  it('xem tài khoản khác chỉ trả thông tin tối thiểu', () => {
    expect(getBlock).toMatch(/limited:\s*true/);
  });
});

describe('3. verify_email phải khớp tài khoản của OTP', () => {
  const block = actionBlock(AUTH_ROUTE, 'verify_email');

  it('so sánh verifyRes.userId với userId trong yêu cầu', () => {
    expect(block).toMatch(/verifyRes\.userId\s*!==\s*userId/);
  });

  it('trả 403 khi OTP thuộc tài khoản khác', () => {
    expect(block).toMatch(/status:\s*403/);
  });
});

describe('4. finish_battle_room phải kiểm tra thành viên phòng', () => {
  const block = actionBlock(PET_ROUTE, 'finish_battle_room');

  it('kiểm tra người gọi là host hoặc guest', () => {
    expect(block).toMatch(/room\.host_id\s*===\s*userId\s*&&\s*room\.guest_id\s*===\s*userId|isParticipant/);
  });

  it('người thắng phải là một trong hai thành viên', () => {
    expect(block).toMatch(/winnerId\s*!==\s*room\.host_id\s*&&\s*winnerId\s*!==\s*room\.guest_id/);
  });

  it('chuyển trạng thái có điều kiện để chống trao thưởng lặp', () => {
    expect(block).toMatch(/status\s*=\s*'in_progress'/);
  });
});

describe('5. respond_proposal phải kiểm tra thành viên', () => {
  const block = actionBlock(PET_ROUTE, 'respond_proposal');

  it('từ chối khi người gọi không thuộc hai bên', () => {
    expect(block).toMatch(/proposal\.user_id_1\s*!==\s*userId\s*&&\s*proposal\.user_id_2\s*!==\s*userId/);
  });

  it('chỉ xử lý lời cầu hôn đang chờ', () => {
    expect(block).toMatch(/status\s*!==\s*'pending'/);
  });
});

describe('6. POST /api/progress chống farm thưởng', () => {
  const src = read(PROGRESS_ROUTE);

  it('upsert phải dùng DO NOTHING để changes phản ánh đúng lần chèn', () => {
    // DO UPDATE luôn trả changes=1 ⇒ vòng bảo vệ bằng `changes` là code chết.
    expect(src).toMatch(/ON CONFLICT\(user_id, module_type, item_id\)\s*DO NOTHING/);
    expect(src).not.toMatch(/ON CONFLICT\(user_id, module_type, item_id\)\s*\n?\s*DO UPDATE SET score/);
  });

  it('phải có hạn mức thưởng theo ngày (vì itemId do client tự gửi)', () => {
    expect(src).toMatch(/consumeProgressBudget\s*\(/);
  });
});

describe('7. Tai khoan demo chi duoc DOC khi khach chua dang nhap', () => {
  const authSrc = read('src/lib/userAuth.ts');

  it('cho phep GET/HEAD vao tai khoan demo (khach xem thu)', () => {
    // Đo 2026-10-09: GET /api/pet?userId=user_demo_default không cookie -> 200,
    // trả dữ liệu thật của tài khoản demo. Đây là CHỦ Ý (demo dùng chung).
    expect(authSrc).toMatch(/isReadOnly\s*=\s*request\.method\s*===\s*'GET'\s*\|\|\s*request\.method\s*===\s*'HEAD'/);
  });

  it('chan MOI method ghi (POST/PUT/PATCH/DELETE) khi khong co phien', () => {
    // Không có bảo vệ này thì bất kỳ ai cũng POST vào tài khoản demo thật
    // (tiêu coins, sửa thú cưng, ghi tiến độ).
    expect(authSrc).toMatch(/if\s*\(!isReadOnly\)\s*\{[\s\S]{0,400}status:\s*'unauthorized'/);
  });

  it('khong cap quyen cho userId khac demo khi khong co phien', () => {
    expect(authSrc).toMatch(/requestedUserId\s*!==\s*'user_demo_default'/);
  });
});

describe('8. Trang /pet lay so xu tu phien that, khong tu fallback demo', () => {
  const petSrc = read('src/app/pet/page.tsx');

  it('khong seed coins tu getStoredUser() (fallback demo coins 1000)', () => {
    // getStoredUser() trả fallback demo (id user_demo_default, coins 1000) khi
    // chưa đăng nhập -> khách thấy "1.000" xu ma không tiêu được (mọi POST
    // /api/pet trả 401). Phải lấy từ getCurrentUser().
    expect(petSrc).toMatch(/getCurrentUser\(\)/);
    expect(petSrc).not.toMatch(/setUserCoins\(user\.coins\)/);
  });

  it('khong co fallback so xu ma thuat (|| 1000)', () => {
    expect(petSrc).not.toMatch(/\|\|\s*1000/);
  });

  it('GET /api/pet khong duoc ghi de coins trong localStorage', () => {
    // read-your-writes: ghi de bang gia tri GET (co the STALE do sync lag)
    // lam coin nhay lui roi action sau nhay lai.
    expect(petSrc).toMatch(/storedCoins\s*===\s*undefined/);
  });
});