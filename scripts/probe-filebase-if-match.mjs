// ĐO Filebase có thực sự hỗ trợ `If-Match` không.
//
// Vì sao quan trọng: `s3Sync.ts` coi `If-Match` là cơ chế chống ghi đè DUY NHẤT.
// Nếu Filebase bỏ qua header này thì toàn bộ lớp CAS là CODE CHẾT và mọi thứ
// vẫn last-write-wins — tức là mất dữ liệu vẫn có thể xảy ra.
//
// Cách đo: PUT với ETag SAI. Ba kết quả khả dĩ, mỗi cái một nghĩa:
//   412 Precondition Failed → If-Match CÓ hiệu lực  ⇒ lớp CAS đang chạy thật
//   200 OK                  → If-Match BỊ BỎ QUA     ⇒ lớp CAS là code chết
//   400 / 501               → server từ chối header  ⇒ code hạ cấp về upload thường
//
// AN TOÀN: chỉ ghi vào key thử nghiệm `cas-probe/...`, không đụng file DB.
// Xoá sạch key thử nghiệm ở cuối kể cả khi có lỗi.
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
const probeKey = `cas-probe/probe-${Date.now()}.txt`;

const s3 = new S3Client({
  endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
  region:
    process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto'
      ? process.env.FILEBASE_REGION
      : 'us-east-1',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
    secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

async function put(body, ifMatch) {
  try {
    const res = await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: probeKey,
        Body: body,
        ...(ifMatch !== undefined ? { IfMatch: ifMatch } : {}),
      })
    );
    return { status: 200, etag: res.ETag ?? undefined };
  } catch (error) {
    return {
      status: error?.$metadata?.httpStatusCode ?? -1,
      code: error?.Code ?? error?.code,
      name: error?.name,
    };
  }
}

async function main() {
  // 1. Tạo object, không kèm điều kiện.
  const first = await put('v1');
  console.log('Filebase endpoint : ' + (process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io'));
  console.log('Bucket            : ' + bucket);
  console.log('Key thu nghiem    : ' + probeKey);
  console.log('');
  console.log('| Thuoc tinh                                   | Mong doi | HTTP | Ket qua |');
  console.log('|----------------------------------------------|----------|------|---------|');

  if (first.status !== 200) {
    console.log(`| PUT khong dieu kien                          | 200      | ${first.status} | that bai |`);
    throw new Error(`Khong ghi duoc key thu nghiem (HTTP ${first.status}) — quyen ghi co van de.`);
  }
  console.log('| PUT khong dieu kien                          | 200      | 200  | PASS    |');

  const realEtag = (first.etag || '').replace(/^"|"$/g, '');
  const isMd5 = /^[0-9a-f]{32}$/i.test(realEtag);
  console.log(`| ETag tra ve: MD5 that khong?                  | co       | ${isMd5 ? 'co' : 'KHONG'} | ${isMd5 ? 'PASS' : 'can luu y'} |`);

  const attempts = [
    { label: 'PUT If-Match = ETag DUNG (bao loi neu hien)', ifMatch: realEtag, expect: '200' },
    { label: 'PUT If-Match = ETag SAI  <-- PHAN QUYET DINH', ifMatch: '"0000000000000000000000000000dead"', expect: '412' },
    { label: 'PUT If-Match = * (ky tu dong)', ifMatch: '*', expect: '400/501' },
  ];

  let decisive = null;
  for (const a of attempts) {
    const out = await put('v' + Math.floor(Math.random() * 1e6), a.ifMatch);
    if (a.expect === '412') decisive = out;
    const ok =
      a.expect === '200' ? out.status === 200
      : a.expect === '412' ? out.status === 412
      : out.status === 400 || out.status === 501;
    console.log(`| ${a.label} | ${a.expect.padEnd(8)} | ${String(out.status).padEnd(4)} | ${ok ? 'PASS' : 'FAIL'}${out.code ? ` (` + out.code + `)` : ''} |`);
  }

  // 3. If-None-Match: * — điều kiện "chỉ tạo nếu chưa có", dùng cho lần publish đầu.
  try {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: probeKey, Body: 'inm', IfNoneMatch: '*' }));
    console.log('| PUT If-None-Match = * tren key da ton tai     | 412      | 200  | BI BO QUA |');
  } catch (error) {
    const st = error?.$metadata?.httpStatusCode ?? -1;
    const ok = st === 412;
    console.log(`| PUT If-None-Match = * tren key da ton tai     | 412      | ${String(st).padEnd(4)} | ${ok ? 'PASS' : 'FAIL'}${error?.Code ? ` (${error.Code})` : ''} |`);
  }

  // Xác nhận ETag đổi sau khi ghi — cơ sở của việc so phiên bản.
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: probeKey }));
  const headEtag = (head.ETag || '').replace(/^"|"$/g, '');
  console.log(`| ETag doi sau moi lan ghi                      | co       | ${headEtag !== realEtag ? 'co' : 'KHONG'} | ${headEtag !== realEtag ? 'PASS' : 'FAIL'} |`);

  console.log('');
  const s = decisive?.status ?? -1;
  if (s === 412) {
    console.log('KET LUAN: Filebase HON TRO If-Match.');
    console.log('  => Lop CAS trong s3Sync.ts DANG CHAY THAT. Co so nang doi remote se bi chan bang 412.');
    console.log('  => Kien truc Filebase con dung de giu, van duoc xem xa truoc khi chuyen sang Postgres.');
  } else if (s === 200) {
    console.log('KET LUAN: Filebase BO QUA If-Match.');
    console.log('  => Lop CAS la CODE CHET. Moi ghi deu la last-write-wins.');
    console.log('  => KHONG duoc tin vao co bao ve duy nhat; phai chuyen sang Postgres.');
  } else {
    console.log(`KET LUAN: Filebase TU CHOI If-Match (HTTP ${s}) — KHONG ho tro.`);
    console.log('  => s3Sync.ts ha cap xuong upload thuong (khong dieu kien).');
    console.log('  => Lop CAS khong bao ve duoc gi; phai chuyen sang Postgres.');
  }

  // ---------------------------------------------------------------------------
  // Phụ: Filebase có hỗ trợ Server-Side Copy không?
  // Nếu CÓ, cron sao lưu chỉ là một lệnh copy trên server — không tải 67MB
  // qua instance, không tốn RAM, không sợ vượt maxDuration.
  // Nếu KHÔNG, cron phải tải về rồi đẩy lên (nặng hơn nhiều).
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('=== Server-Side Copy (can cho cron sao luu) ===');
  const copyKey = `${probeKey}.copy`;
  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: copyKey,
        CopySource: `${bucket}/${probeKey}`,
        MetadataDirective: 'REPLACE',
        Metadata: { 'saved-by': 'cas-probe' },
      })
    );
    const copied = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: copyKey }));
    console.log(`| CopyObject trong cung bucket | 200 | 200 | ${Number(copied.ContentLength) > 0 ? 'PASS' : 'FAIL'} |`);
    console.log('  => Co the sao luu bang lenh copy server-side: nhanh, re, khong ton RAM.');
  } catch (error) {
    console.log(`| CopyObject trong cung bucket | 200 | ${error?.$metadata?.httpStatusCode ?? -1} | FAIL${error?.Code ? ' (' + error.Code + ')' : ''} |`);
    console.log('  => KHONG dung duoc copy server-side. Cron phai tai ve roi day len.');
  } finally {
    try { await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: copyKey })); } catch {}
  }
}

main()
  .catch((e) => {
    console.error('LOI:', e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  })
  .finally(async () => {
    // Luôn dọn key thử nghiệm, kể cả khi script lỗi.
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: probeKey }));
      console.log('');
      console.log(`Da xoa key thu nghiem: ${probeKey}`);
    } catch {
      console.error(`Khong xoa duoc key thu nghiem: ${probeKey} — can xoa tay tren Filebase.`);
    }
  });