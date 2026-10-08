// Bảng ánh xạ ngược: Unicode char -> byte cp1252.
// Chỉ vùng 0x80–0x9F khác ISO-8859-1; 0x00–0x7F và 0xA0–0xFF giống Latin-1.
const CP1252_HIGH = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

const REVERSE = new Map();
for (const [cp, byte] of Object.entries(CP1252_HIGH)) {
  REVERSE.set(Number(cp), byte);
}

/**
 * Giải mã một tầng double-encoding.
 *
 * PowerShell đọc file UTF-8 bằng cp1252 rồi ghi lại bằng UTF-8. Nên byte bản
 * gốc = byte cp1252 của chuỗi hiện tại, và bản gốc là UTF-8 decode của chúng.
 *
 * Xử lý TỪNG ký tự: ký tự nào không thể tới được từ cp1252 (vd ký tự vẽ
 * `─` U+2500, emoji) thì giữ nguyên — nó vốn đã đúng, không phải dữ liệu
 * hỏng. Trước đây hàm trả `null` cho cả file nếu gặp một ký tự như vậy, khiến
 * mọi file có box-drawing / emoji đều bị bỏ sót.
 */
export function undoDoubleEncoding(text) {
  const out = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (REVERSE.has(cp)) {
      out.push(REVERSE.get(cp));
    } else if (cp <= 0xff) {
      out.push(cp);
    } else {
      // Vượt tầm cp1252 ⇒ ký tự này không do lỗi encoding tạo ra, giữ nguyên.
      for (const b of Buffer.from(ch, 'utf8')) out.push(b);
    }
  }
  return Buffer.from(out).toString('utf8');
}

/** Số dấu vết mojibake: U+FFFD + chuỗi byte thô liên tiếp. */
export function mojibakeScore(s) {
  let score = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0xfffd) score += 3;
    else if (c >= 0x80 && c <= 0xff) {
      const n = s.charCodeAt(i + 1);
      if (n >= 0x80 && n <= 0xbf) score += 1;
    }
  }
  return score;
}
