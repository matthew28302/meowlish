/**
 * Next.js Instrumentation Hook:
 * Runs once upon server cold-start before serving incoming HTTP requests.
 * Used here to automatically restore the SQLite database from Filebase S3
 * when deployed on Vercel Serverless environment.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const isVercel = process.env.VERCEL === '1';
    if (isVercel) {
      try {
        console.log('[Instrumentation] Vercel Serverless cold-start detected. Restoring database from Filebase S3...');
        const { downloadDbFromS3 } = await import('@/lib/s3Sync');
        await downloadDbFromS3(true);
      } catch (err) {
        console.error('[Instrumentation] Error restoring database on Vercel cold-start:', err);
      }
    }
  }
}
