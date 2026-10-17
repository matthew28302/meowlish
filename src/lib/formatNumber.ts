/**
 * Số dư Coins — MỘT định dạng duy nhất cho toàn bộ app (UX-009).
 *
 * VÌ SAO CẦN FILE NÀY (sai lệch đo được trong audit 2026-10-15):
 * cùng một số dư 9291 xuất hiện dưới 3 kiểu khác nhau —
 *   - header AppShell: "9291"      (in thẳng `{coins}`, không phân tách)
 *   - nông trại PixelFarmGame: "9,291"  (`toLocaleString()` không locale ⇒
 *     mặc định theo locale của runtime, ở máy dev/en là dấu PHẨY)
 *   - PvP/Racing canvas: "9.291"   (`toLocaleString('vi-VN')`, dấu CHẤM)
 * Người dùng tưởng đang ở 3 tài khoản khác nhau. Chuẩn Việt Nam dùng dấu
 * CHẤM (9.291) và dấu phẩy cho phần thập phân — mọi màn phải giống nhau.
 *
 * CHÍNH SÁCH:
 *   - `0` → "0" (không đổi thành "0 Coins" hay gì cả — chỗ hiển thị tự thêm
 *     đơn vị "Coins"/"xu" sau, tránh lặp chữ).
 *   - số âm → giữ dấu "-", ví dụ "-500" → "-500". Số dư âm là trạng thái
 *     lỗi thật cần thấy, không được làm cho nó biến mất hay đổi thành
 *     dương (nhiều game hay "trừ bớt" để người dùng khỏi thấy).
 *   - số thực: làm tròn về 0 chữ số thập phân vì Coins là đơn vị nguyên.
 *   - NaN / Infinity → "0": dữ liệu hỏng không được làm vỡ cả render.
 *
 * `new Intl.NumberFormat()` chỉ khởi tạo 1 lần: hàm này chạy trong vòng
 * lặp render (header, shop, farm), tạo formatter mới mỗi lần thì tốn hơn
 * `toLocaleString` chứ không hơn.
 */
const VI_COINS = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/**
 * Định dạng một số dư/giá tiền Coins theo chuẩn Việt Nam (dấu chấm phân
 * nhóm). Dùng cho MỌI nơi hiển thị số dư Coins — không tự gọi
 * `toLocaleString()` ở component nữa.
 *
 * @example formatCoins(9291)      // "9.291"
 * @example formatCoins(0)         // "0"
 * @example formatCoins(-500)      // "-500"
 */
export function formatCoins(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  // `Intl.NumberFormat` render `-0` thành chuỗi "-0" (đã đo trên Node full-ICU
  // v78.3). Hiện "-0 Coins" cho người dùng là vô nghĩa và khác hẳn "0",
  // nên chuẩn hoá -0 về 0 trước khi format — giống hệt cách biểu thức
  // `value || 0` từng làm trước đây.
  return VI_COINS.format(Object.is(value, -0) ? 0 : value);
}