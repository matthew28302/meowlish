/**
 * Cổng kiểm soát `FARM_CYCLE_TEST` — backdoor rút ngắn chu kỳ chăn nuôi.
 *
 * VÌ SAO PHẢI CHẶN THEO MÔI TRƯỜNG (security, phát hiện 2026-10-15):
 * `FARM_CYCLE_TEST` rút toàn bộ chu kỳ gà/bò/cừu về **1 giây**. Trước đây
 * `resolveCycleSeconds()` đọc thẳng `process.env` không hề kiểm tra
 * `NODE_ENV`, nên chỉ cần biến này lọt lên production (Vercel: ai đó copy
 * `.env.local` lên dashboard, hoặc CI tự set) là gà đẻ trứng + máy sữa
 * mãi ⇒ phá vỡ kinh tế game (farm coin inflation) chỉ bằng MỘT biến môi
 * trường. Đường rút ngắn chỉ được tồn tại ở dev/test.
 *
 * Hàm ở đây CỐ Ý thuần (không đọc `process.env`, không `console.*`) để unit
 * test được toàn bộ ma trận quyết định mà không cần dựng môi trường thật.
 */

/** Tập env tối thiểu cần cho quyết định — cho phép test truyền object thuần. */
export interface CycleEnv {
  NODE_ENV?: string | undefined;
  FARM_CYCLE_TEST?: string | undefined;
}

/**
 * Có được phép rút ngắn chu kỳ chăn nuôi trong môi trường này không?
 *
 * Quy tắc (có chủ đích, siết dần):
 * 1. `NODE_ENV === 'production'` ⇒ LUÔN false. Đây là chốt chặn duy nhất
 *    quan trọng; mọi thứ khác chỉ để cho dev/test tiện.
 * 2. Biến phải có mặt, parse ra được số hữu hạn và > 0.
 * 3. Sàn 1 giây — không cho 0 / âm làm chu kỳ vô hạn hoặc lùi thời gian.
 */
export function shouldUseTestCycles(env: CycleEnv): boolean {
  if (env.NODE_ENV === 'production') return false;
  const raw = env.FARM_CYCLE_TEST;
  if (raw === undefined || raw === '') return false;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0;
}

/**
 * `FARM_CYCLE_TEST` có đang "lọt" vào production không? Dùng để cảnh báo
 * một lần cho đội vận hành — biến cấu hình bị set ở production là dấu hiệu
 * pipeline deploy bị lẫn env, cần sửa gốc chứ không chỉ im lặng bỏ qua.
 */
export function isTestCycleLeak(env: CycleEnv): boolean {
  return env.NODE_ENV === 'production' && !!env.FARM_CYCLE_TEST;
}

/**
 * Chu kỳ (giây) cho một loài vật nuôi, đã áp cổng kiểm soát ở trên.
 *
 * @param env môi trường hiện tại
 * @param animalType key loài (dùng `defaults` tra cứu)
 * @param defaults bảng chu kỳ thật của game (giữ ở route, không nhân bản ở đây)
 * @param fallback chu kỳ dùng khi loài lạ
 */
export function resolveCycleSeconds(
  env: CycleEnv,
  animalType: string,
  defaults: Record<string, number>,
  fallback: number,
): number {
  if (shouldUseTestCycles(env)) {
    return Math.max(1, Math.floor(Number(env.FARM_CYCLE_TEST)));
  }
  return defaults[animalType] ?? fallback;
}