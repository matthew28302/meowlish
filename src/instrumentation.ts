/**
 * Next.js Instrumentation Hook:
 * Runs once upon server cold-start before serving incoming HTTP requests.
 * Used here to automatically restore the SQLite database from Filebase S3
 * when deployed on Vercel Serverless environment.
 *
 * LƯU Ý QUAN TRỌNG: KHÔNG ép ghi đè nữa. downloadDbFromS3() tự so sánh
 * remote (ETag/LastModified) với sync_state.json và mtime cục bộ:
 *  - /tmp trống (cold-start thật) → tải về bình thường;
 *  - cục bộ đang là bản remote này (có thể có ghi mới chưa upload) → GIỮ cục bộ;
 *  - remote mới hơn / lệch pha → tải về, nhưng bản cục bộ có dữ liệu riêng
 *    sẽ được lưu vào key 'english_learning.conflict.db' trước.
 * (Bản cũ dùng force=true đã ghi đè mù quáng → một trong các nguyên nhân gốc
 * gây rollback mật khẩu/dữ liệu người dùng trên production.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const isVercel = process.env.VERCEL === '1';
    if (isVercel) {
      try {
        console.log('[Instrumentation] Vercel Serverless cold-start detected. Đối chiếu DB cục bộ với Filebase S3...');
        const { downloadDbFromS3 } = await import('@/lib/s3Sync');
        const restored = await downloadDbFromS3();
        console.log(
          '[Instrumentation] Kết quả khôi phục cold-start:',
          restored ? 'đã tải bản mới nhất từ Filebase' : 'giữ nguyên DB cục bộ / chưa có bản remote'
        );
      } catch (err) {
        console.error('[Instrumentation] Error restoring database on Vercel cold-start:', err);
      }
    }
  }
}
