/**
 * =============================================================================
 * Meowlish — Transactional Email Templates
 * =============================================================================
 * MỘT nơi duy nhất dựng HTML cho mọi email transactional của hệ thống.
 *
 * Quy tắc thiết kế (anti-spam + email-client safe):
 * - Bố cục table-based, max-width 600px, CHỈ inline style (không CSS ngoài,
 *   không flexbox, không gradient — hiển thị ổn định trên Gmail/Outlook/Yahoo).
 * - Không emoji, không chữ HOA nguyên câu trong subject, không dấu ! liên tục,
 *   không nội dung marketing trong email transactional.
 * - Luôn có bản plain-text (`text`) kèm theo HTML (SMTP multipart/alternative).
 * - Toàn bộ nội dung do người dùng cung cấp đều được escapeHtml().
 *
 * Email types exported:
 *   - userEmailOtpTemplate        (verify_email / 2fa_login / toggle_2fa)
 *   - adminOtpTemplate            (admin 2FA)
 *   - passwordResetTemplate       (forgot-password: mật khẩu tạm thời)
 *   - passwordResetLinkTemplate   (forgot-password: link đặt lại mật khẩu one-time token)
 *   - supportAckTemplate          (xác nhận đã tiếp nhận phiếu hỗ trợ)
 *   - supportAdminAlertTemplate   (thông báo phiếu hỗ trợ mới tới admin)
 *   - supportReplyTemplate        (phản hồi của admin gửi cho người dùng)
 */

/** URL gốc của site — dùng cho mọi link trong email. */
export const APP_URL = (process.env.APP_URL || 'https://meowlish.io.vn').replace(/\/+$/, '');

/** Thông tin thương hiệu dùng trong footer / chữ ký. */
export const EMAIL_BRAND = {
  name: 'Meowlish',
  tagline: 'Học Tiếng Anh Giao Tiếp & IT Thực Chiến',
  /** Hộp thư phản hồi — fallback theo SMTP_USER. */
  contactEmail: process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'admin@imfishball.id.vn',
  /** Địa chỉ vật lý (đặt qua env BRAND_ADDRESS để thay thế). */
  address: process.env.BRAND_ADDRESS || 'TP. Hồ Chí Minh, Việt Nam',
  supportUrl: `${(process.env.APP_URL || 'https://meowlish.io.vn').replace(/\/+$/, '')}/support`,
  // Canonical là non-www (khớp Google Search Console). www 308-redirect về non-www.
  adminUrl: `${(process.env.APP_URL || 'https://meowlish.io.vn').replace(/\/+$/, '')}/duahau`,
} as const;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Design tokens (inline styles only)
// ---------------------------------------------------------------------------
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";
const C = {
  headerBg: '#047857',
  headerSub: '#a7f3d0',
  accent: '#059669',
  text: '#334155',
  heading: '#0f172a',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#e2e8f0',
  footerBg: '#f8fafc',
  pageBg: '#f1f5f9',
  codeBg: '#ecfdf5',
  codeBorder: '#a7f3d0',
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape toàn bộ ký tự HTML đặc biệt (chống injected markup từ user input). */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** From-header thống nhất: `"Meowlish" <smtpUser>` (SMTP_USER khi được set). */
export function mailFrom(smtpUser: string): string {
  return `"${EMAIL_BRAND.name}" <${smtpUser}>`;
}

/** Chuẩn hóa mã phiếu hỗ trợ: 12 -> #12, #TK-01 giữ nguyên. */
function formatTicketCode(ticketId?: string | null): string {
  if (!ticketId) return '#TK-MEOW';
  const id = String(ticketId).trim();
  return id.startsWith('#') ? id : `#${id}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  feedback: 'Góp ý tính năng',
  bug: 'Báo lỗi kỹ thuật',
  guide: 'Thắc mắc học tập',
  account: 'Tài khoản & bảo mật',
  other: 'Ý kiến khác',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
}

function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] || PRIORITY_LABELS.medium;
}

/** Khung email chung: header thương hiệu + body + footer. */
function layout({
  preheader,
  title,
  body,
  reason,
}: {
  preheader: string;
  title: string;
  body: string;
  reason: string;
}): string {
  const year = new Date().getFullYear();
  const contact = EMAIL_BRAND.contactEmail;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${C.pageBg};">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background-color:${C.pageBg};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; border-collapse:collapse; background-color:#ffffff; border:1px solid ${C.border};">
          <tr>
            <td style="background-color:${C.headerBg}; padding:22px 32px;">
              <div style="font-family:${FONT}; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">${EMAIL_BRAND.name}</div>
              <div style="font-family:${FONT}; font-size:12px; color:${C.headerSub}; margin-top:5px;">${EMAIL_BRAND.tagline}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px; font-family:${FONT}; font-size:15px; line-height:1.65; color:${C.text};">
${body}
            </td>
          </tr>
          <tr>
            <td style="background-color:${C.footerBg}; border-top:1px solid ${C.border}; padding:20px 32px; font-family:${FONT}; font-size:11px; line-height:1.75; color:${C.faint};">
              <div style="color:${C.muted}; font-weight:600;">${EMAIL_BRAND.name} — ${EMAIL_BRAND.tagline}</div>
              <div>&copy; ${year} ${EMAIL_BRAND.name}. Địa chỉ: ${escapeHtml(EMAIL_BRAND.address)}. Liên hệ: <a href="mailto:${escapeHtml(contact)}" style="color:${C.headerBg}; text-decoration:none;">${escapeHtml(contact)}</a></div>
              <div>Bạn nhận được email này vì đã ${escapeHtml(reason)}.</div>
              <div>Tin này được gửi tự động từ hệ thống ${EMAIL_BRAND.name}.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Tiêu đề đoạn văn lớn. */
function heading(text: string): string {
  return `<p style="margin:0 0 16px 0; font-size:19px; font-weight:700; color:${C.heading};">${escapeHtml(text)}</p>`;
}

/** Đoạn văn thường. */
function paragraph(text: string, style?: string): string {
  return `<p style="margin:0 0 14px 0; font-size:15px; line-height:1.65; color:${C.text};${style || ''}">${escapeHtml(text)}</p>`;
}

/** Ô mã OTP / mật khẩu: chữ mono lớn trong nền sáng, viền emerald. */
function codeBox(label: string, code: string, note: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background-color:${C.codeBg}; border:1px solid ${C.codeBorder}; margin:24px 0;">
            <tr>
              <td align="center" style="padding:22px 16px;">
                <div style="font-family:${FONT}; font-size:11px; font-weight:700; letter-spacing:2px; color:${C.headerBg}; text-transform:uppercase;">${escapeHtml(label)}</div>
                <div style="font-family:${MONO}; font-size:36px; font-weight:700; letter-spacing:8px; color:${C.headerBg}; padding:10px 0 8px;">${escapeHtml(code)}</div>
                <div style="font-family:${FONT}; font-size:12px; color:${C.muted}; text-align:center;">${escapeHtml(note)}</div>
              </td>
            </tr>
          </table>`;
}

/** Một nút CTA emerald duy nhất (nếu email cần hành động). */
function accentButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
            <tr>
              <td align="center" style="background-color:${C.accent}; border-radius:6px;">
                <a href="${escapeHtml(url)}" style="display:inline-block; padding:12px 28px; font-family:${FONT}; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:6px;">${escapeHtml(label)}</a>
              </td>
            </tr>
          </table>`;
}

/** Bảng thông tin key/value (thẻ <th>/<td> thuần, không flexbox). */
function infoTable(rows: Array<{ label: string; value: string }>): string {
  const trs = rows
    .map((r, i) => {
      const divider = i < rows.length - 1 ? ` border-bottom:1px solid ${C.border};` : '';
      return `<tr>
                <td style="padding:8px 0; font-family:${FONT}; font-size:13px; color:${C.muted}; width:140px; vertical-align:top;${divider}">${escapeHtml(r.label)}</td>
                <td style="padding:8px 0; font-family:${FONT}; font-size:13px; color:${C.text}; vertical-align:top;${divider}">${escapeHtml(r.value)}</td>
              </tr>`;
    })
    .join('\n                ');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background-color:${C.footerBg}; border:1px solid ${C.border}; margin:20px 0;">
            <tr>
              <td style="padding:6px 18px;">
                ${trs}
              </td>
            </tr>
          </table>`;
}

/** Khung trích dẫn nội dung (message / reply) — pre-wrap, viền trái emerald. */
function quoteBox(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background-color:#ffffff; border:1px solid ${C.border}; border-left:4px solid ${C.accent}; margin:18px 0;">
            <tr>
              <td style="padding:16px; font-family:${FONT}; font-size:14px; line-height:1.65; color:${C.text}; white-space:pre-wrap;">${escapeHtml(text)}</td>
            </tr>
          </table>`;
}

/** Chữ ký thống nhất. */
function signature(): string {
  return `<p style="margin:24px 0 0 0; font-size:15px; color:${C.text};">Trân trọng,<br /><strong>Đội ngũ ${EMAIL_BRAND.name}</strong></p>`;
}

/** Chữ ký plain-text + footer cho bản text. */
function textFooter(reason: string): string {
  const year = new Date().getFullYear();
  return [
    '',
    'Trân trọng,',
    'Đội ngũ Meowlish',
    '',
    '----------------------------------------',
    `Meowlish — ${EMAIL_BRAND.tagline}`,
    `© ${year} Meowlish · Địa chỉ: ${EMAIL_BRAND.address} · Liên hệ: ${EMAIL_BRAND.contactEmail}`,
    `Bạn nhận được email này vì đã ${reason}.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 1. User OTP (verify_email / 2fa_login / toggle_2fa)
// ---------------------------------------------------------------------------
export type UserOtpPurpose = '2fa_login' | 'verify_email' | 'toggle_2fa';

export function userEmailOtpTemplate({
  purpose,
  otp,
  displayName,
}: {
  purpose: UserOtpPurpose;
  otp: string;
  displayName?: string;
}): RenderedEmail {
  const name = (displayName || '').trim() || 'bạn';

  const copy: Record<
    UserOtpPurpose,
    { subject: string; heading: string; intro: string; reason: string }
  > = {
    verify_email: {
      subject: 'Xác thực địa chỉ email của bạn',
      heading: 'Xác thực địa chỉ email',
      intro:
        'Cảm ơn bạn đã đăng ký Meowlish. Dưới đây là mã dùng để xác thực địa chỉ email này và kích hoạt tài khoản.',
      reason: `yêu cầu mã xác thực email trên ${APP_URL}`,
    },
    '2fa_login': {
      subject: 'Mã xác thực đăng nhập',
      heading: 'Mã xác thực đăng nhập',
      intro:
        'Bạn đang đăng nhập vào Meowlish. Dưới đây là mã xác thực hai lớp (2FA) để hoàn tất đăng nhập.',
      reason: `đăng nhập vào ${APP_URL}`,
    },
    toggle_2fa: {
      subject: 'Xác nhận thay đổi cài đặt bảo mật',
      heading: 'Xác nhận cài đặt bảo mật',
      intro:
        'Bạn đang thay đổi cài đặt xác thực hai lớp (2FA) cho tài khoản. Dưới đây là mã dùng để xác nhận thay đổi này.',
      reason: `thay đổi cài đặt bảo mật trên ${APP_URL}`,
    },
  };

  const c = copy[purpose] || copy['verify_email'];

  const body = `              ${heading(c.heading)}
              ${paragraph(`Chào ${name},`)}
              ${paragraph(c.intro)}
${codeBox('Mã xác thực của bạn', otp, 'Mã có hiệu lực trong 10 phút và chỉ dùng một lần.')}
              ${paragraph('Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và không chia sẻ mã này với bất kỳ ai.', `font-size:13px; color:${C.muted};`)}
${signature()}`;

  const html = layout({
    preheader: `Mã xác thực của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
    title: c.subject,
    body,
    reason: c.reason,
  });

  const text = [
    `Chào ${name},`,
    '',
    c.intro,
    '',
    `Mã xác thực: ${otp}`,
    '',
    'Mã có hiệu lực trong 10 phút và chỉ dùng một lần.',
    '',
    'Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và không chia sẻ mã này với bất kỳ ai.',
    textFooter(c.reason),
  ].join('\n');

  return { subject: c.subject, html, text };
}

// ---------------------------------------------------------------------------
// 2. Admin OTP (2FA đăng nhập cổng quản trị)
// ---------------------------------------------------------------------------
export function adminOtpTemplate({
  otp,
  expiresInMinutes = 5,
  maxAttempts = 3,
  sentAt,
}: {
  otp: string;
  expiresInMinutes?: number;
  maxAttempts?: number;
  sentAt?: string;
}): RenderedEmail {
  const subject = 'Mã xác thực đăng nhập quản trị';
  const reason = `đăng nhập vào cổng quản trị ${EMAIL_BRAND.name}`;
  const timeText = sentAt || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const body = `              ${heading('Đăng nhập quản trị')}
              ${paragraph('Chào Quản trị viên,')}
              ${paragraph(`Bạn đang yêu cầu đăng nhập vào cổng quản trị ${EMAIL_BRAND.name}. Dưới đây là mã xác thực hai lớp.`)}
${codeBox('Mã xác thực của bạn', otp, `Mã có hiệu lực trong ${expiresInMinutes} phút, tối đa ${maxAttempts} lần thử.`)}
${infoTable([
    { label: 'Thời gian gửi', value: timeText },
    { label: 'Tài khoản', value: 'admin' },
    { label: 'Hiệu lực', value: `${expiresInMinutes} phút · tối đa ${maxAttempts} lần thử` },
  ])}
              ${paragraph('Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại mật khẩu quản trị.', `font-size:13px; color:${C.muted};`)}
${signature()}`;

  const html = layout({
    preheader: `Mã xác thực quản trị: ${otp}. Hiệu lực ${expiresInMinutes} phút.`,
    title: subject,
    body,
    reason,
  });

  const text = [
    'Chào Quản trị viên,',
    '',
    `Bạn đang yêu cầu đăng nhập vào cổng quản trị ${EMAIL_BRAND.name}.`,
    '',
    `Mã xác thực: ${otp}`,
    '',
    `Mã có hiệu lực trong ${expiresInMinutes} phút, tối đa ${maxAttempts} lần thử.`,
    `Thời gian gửi: ${timeText}`,
    '',
    'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại mật khẩu quản trị.',
    textFooter(reason),
  ].join('\n');

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 3. Forgot password — mật khẩu tạm thời
// ---------------------------------------------------------------------------
export function passwordResetTemplate({
  displayName,
  username,
  newPassword,
}: {
  displayName?: string | null;
  username: string;
  newPassword: string;
}): RenderedEmail {
  const subject = 'Mật khẩu tạm thời cho tài khoản của bạn';
  const name = (displayName || '').trim() || username;
  const reason = `yêu cầu đặt lại mật khẩu trên ${APP_URL}`;

  const body = `              ${heading('Đặt lại mật khẩu')}
              ${paragraph(`Chào ${name},`)}
              ${paragraph(`Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản "${username}". Mật khẩu tạm thời của bạn là:`)}
${codeBox('Mật khẩu tạm thời', newPassword, 'Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.')}
${accentButton(APP_URL, 'Đăng nhập ngay')}
              ${paragraph('Để thay đổi mật khẩu, đăng nhập rồi vào phần cài đặt tài khoản của bạn.', `font-size:13px; color:${C.muted};`)}
              ${paragraph('Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và kiểm tra lại mật khẩu của tài khoản.', `font-size:13px; color:${C.muted};`)}
${signature()}`;

  const html = layout({
    preheader: 'Mật khẩu tạm thời cho tài khoản Meowlish của bạn.',
    title: subject,
    body,
    reason,
  });

  const text = [
    `Chào ${name},`,
    '',
    `Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản "${username}".`,
    '',
    `Mật khẩu tạm thời: ${newPassword}`,
    '',
    'Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.',
    `Đăng nhập tại: ${APP_URL}`,
    '',
    'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.',
    textFooter(reason),
  ].join('\n');

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 5. Forgot password — link đặt lại mật khẩu (one-time token, TTL 60 phút)
// ---------------------------------------------------------------------------
export function passwordResetLinkTemplate({
  displayName,
  username,
  resetLink,
}: {
  displayName?: string | null;
  username: string;
  resetLink: string;
}): RenderedEmail {
  const subject = 'Đặt lại mật khẩu tài khoản Meowlish';
  const name = (displayName || '').trim() || username;
  const reason = `yêu cầu đặt lại mật khẩu trên ${APP_URL}`;

  const body = `              ${heading('Đặt lại mật khẩu')}
              ${paragraph(`Chào ${name},`)}
              ${paragraph(`Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản "${username}".`)}
              ${paragraph('Nhấn nút bên dưới để đặt lại mật khẩu — link chỉ dùng được 1 lần và hết hạn sau 60 phút:')}
              ${accentButton(resetLink, 'Đặt lại mật khẩu ngay')}
              ${paragraph('Nếu nút không hoạt động, hãy sao chép link sau vào trình duyệt:', `font-size:13px; color:${C.muted};`)}
              ${paragraph(`<a href="${escapeHtml(resetLink)}" style="color:${C.accent}; word-break:break-all;">${escapeHtml(resetLink)}</a>`, `font-size:13px; color:${C.muted};`)}
              ${paragraph('Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.', `font-size:13px; color:${C.muted};`)}
              ${signature()}`;

  const html = layout({
    preheader: 'Link đặt lại mật khẩu tài khoản Meowlish của bạn.',
    title: subject,
    body,
    reason,
  });

  const text = [
    `Chào ${name},`,
    '',
    `Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản "${username}".`,
    '',
    `Nhấn vào link dưới để đặt lại mật khẩu (chỉ dùng 1 lần, hết hạn sau 60 phút):`,
    resetLink,
    '',
    'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.',
    textFooter(reason),
  ].join('\n');

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 6. Support — xác nhận đã tiếp nhận phiếu (gửi cho người dùng)
// ---------------------------------------------------------------------------
export function supportAckTemplate({
  name,
  ticketId,
  subject,
  category,
  priority,
}: {
  name: string;
  ticketId?: string;
  subject: string;
  category: string;
  priority?: string;
}): RenderedEmail {
  const code = formatTicketCode(ticketId);
  const mailSubject = `Đã tiếp nhận phiếu hỗ trợ ${code}`;
  const reason = `gửi phiếu hỗ trợ ${code} qua ${EMAIL_BRAND.supportUrl}`;

  const body = `              ${heading(`Đã tiếp nhận phiếu hỗ trợ ${code}`)}
              ${paragraph(`Chào ${name},`)}
              ${paragraph('Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn. Đội ngũ Meowlish sẽ kiểm tra và phản hồi trong thời gian sớm nhất.')}
${infoTable([
    { label: 'Mã phiếu', value: code },
    { label: 'Tiêu đề', value: subject },
    { label: 'Chuyên mục', value: categoryLabel(category) },
    { label: 'Độ ưu tiên', value: priorityLabel(priority || 'medium') },
  ])}
              ${paragraph(`Bạn có thể theo dõi phản hồi tại mục Hỗ trợ (${EMAIL_BRAND.supportUrl}) theo mã phiếu ${code}.`, `font-size:13px; color:${C.muted};`)}
${signature()}`;

  const html = layout({
    preheader: `Phiếu hỗ trợ ${code} của bạn đã được tiếp nhận.`,
    title: mailSubject,
    body,
    reason,
  });

  const text = [
    `Chào ${name},`,
    '',
    'Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn. Đội ngũ Meowlish sẽ kiểm tra và phản hồi trong thời gian sớm nhất.',
    '',
    `Mã phiếu: ${code}`,
    `Tiêu đề: ${subject}`,
    `Chuyên mục: ${categoryLabel(category)}`,
    `Độ ưu tiên: ${priorityLabel(priority || 'medium')}`,
    '',
    `Theo dõi phản hồi tại: ${EMAIL_BRAND.supportUrl}`,
    textFooter(reason),
  ].join('\n');

  return { subject: mailSubject, html, text };
}

// ---------------------------------------------------------------------------
// 5. Support — thông báo phiếu mới (gửi cho admin)
// ---------------------------------------------------------------------------
export function supportAdminAlertTemplate({
  name,
  email,
  ticketId,
  subject,
  category,
  priority,
  message,
}: {
  name: string;
  email: string;
  ticketId?: string;
  subject: string;
  category: string;
  priority?: string;
  message: string;
}): RenderedEmail {
  const code = formatTicketCode(ticketId);
  const mailSubject = `Phiếu hỗ trợ mới ${code}: ${subject}`.slice(0, 180);
  const reason = `học viên ${name} gửi phiếu hỗ trợ ${code} qua ${EMAIL_BRAND.supportUrl}`;
  const sentAt = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const body = `              ${heading(`Phiếu hỗ trợ mới ${code}`)}
${infoTable([
    { label: 'Người gửi', value: name },
    { label: 'Email', value: email },
    { label: 'Tiêu đề', value: subject },
    { label: 'Chuyên mục', value: categoryLabel(category) },
    { label: 'Độ ưu tiên', value: priorityLabel(priority || 'medium') },
    { label: 'Thời gian', value: sentAt },
  ])}
              ${paragraph('Nội dung yêu cầu:')}
${quoteBox(message)}
${accentButton(EMAIL_BRAND.adminUrl, 'Mở trang quản trị')}
${signature()}`;

  const html = layout({
    preheader: `Phiếu hỗ trợ ${code} từ ${name}: ${subject}`,
    title: mailSubject,
    body,
    reason,
  });

  const text = [
    `Phiếu hỗ trợ mới ${code}`,
    '',
    `Người gửi: ${name}`,
    `Email: ${email}`,
    `Tiêu đề: ${subject}`,
    `Chuyên mục: ${categoryLabel(category)}`,
    `Độ ưu tiên: ${priorityLabel(priority || 'medium')}`,
    `Thời gian: ${sentAt}`,
    '',
    'Nội dung yêu cầu:',
    '----------------------------------------',
    message,
    '----------------------------------------',
    '',
    `Trang quản trị: ${EMAIL_BRAND.adminUrl}`,
    textFooter(reason),
  ].join('\n');

  return { subject: mailSubject, html, text };
}

// ---------------------------------------------------------------------------
// 6. Support — phản hồi của admin (gửi cho người dùng)
// ---------------------------------------------------------------------------
export function supportReplyTemplate({
  name,
  ticketId,
  subject,
  reply,
}: {
  name: string;
  ticketId?: string;
  subject: string;
  reply: string;
}): RenderedEmail {
  const code = formatTicketCode(ticketId);
  const mailSubject = `Re: ${subject}`.slice(0, 180);
  const reason = `gửi phiếu hỗ trợ ${code} qua ${EMAIL_BRAND.supportUrl}`;

  const body = `              ${heading(`Phản hồi cho phiếu hỗ trợ ${code}`)}
              ${paragraph(`Chào ${name},`)}
              ${paragraph(`Đội ngũ Meowlish đã phản hồi yêu cầu của bạn với tiêu đề "${subject}":`)}
${quoteBox(reply)}
${accentButton(EMAIL_BRAND.supportUrl, 'Xem phiếu hỗ trợ')}
              ${paragraph('Nếu bạn có thêm câu hỏi, hãy trả lời email này hoặc gửi phiếu hỗ trợ mới tại trang Hỗ trợ.', `font-size:13px; color:${C.muted};`)}
${signature()}`;

  const html = layout({
    preheader: `Phản hồi từ Meowlish cho phiếu ${code}: ${subject}`,
    title: mailSubject,
    body,
    reason,
  });

  const text = [
    `Chào ${name},`,
    '',
    `Đội ngũ Meowlish đã phản hồi yêu cầu của bạn với tiêu đề "${subject}":`,
    '',
    '----------------------------------------',
    reply,
    '----------------------------------------',
    '',
    `Nếu bạn có thêm câu hỏi, hãy trả lời email này hoặc truy cập: ${EMAIL_BRAND.supportUrl}`,
    textFooter(reason),
  ].join('\n');

  return { subject: mailSubject, html, text };
}
