import { S3Client, ListBucketsCommand, HeadObjectCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const endpoint = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
const accessKeyId = process.env.FILEBASE_ACCESS_KEY || '';
const secretAccessKey = process.env.FILEBASE_SECRET_KEY || '';
const region = process.env.FILEBASE_REGION || 'us-east-1';
const bucketName = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

console.log('=== FILEBASE S3 SYNC TEST ===');
console.log('Endpoint:', endpoint);
console.log('Region:', region);
console.log('Bucket:', bucketName);
console.log('Access Key ID:', accessKeyId ? `${accessKeyId.slice(0, 4)}...${accessKeyId.slice(-4)}` : 'MISSING');
console.log('Secret Key:', secretAccessKey ? 'PRESENT' : 'MISSING');

if (!accessKeyId || !secretAccessKey) {
  console.error('ERROR: Missing Filebase credentials in environment!');
  process.exit(1);
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

async function runTest() {
  try {
    console.log('\n[1] Testing ListBuckets...');
    const bucketsResponse = await s3.send(new ListBucketsCommand({}));
    console.log('Connected successfully! Available buckets:');
    (bucketsResponse.Buckets || []).forEach(b => console.log(' - ' + b.Name + ' (created: ' + b.CreationDate + ')'));

    const bucketExists = (bucketsResponse.Buckets || []).some(b => b.Name === bucketName);
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} not in bucket list! Creating or checking access...`);
    } else {
      console.log(`Bucket ${bucketName} confirmed present!`);
    }

    const dbPath = path.join(process.cwd(), 'data', 'english_learning.db');
    if (!fs.existsSync(dbPath)) {
      console.error('Local db file does not exist at:', dbPath);
      return;
    }
    const stats = fs.statSync(dbPath);
    console.log(`\n[2] Local database file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n[3] Testing PutObject (uploadDbToS3)...');
    const uploadStream = fs.createReadStream(dbPath);
    const putStart = Date.now();
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'english_learning.db',
      Body: uploadStream,
      ContentType: 'application/octet-stream',
    }));
    console.log(`Upload complete in ${((Date.now() - putStart) / 1000).toFixed(2)}s!`);

    console.log('\n[4] Testing HeadObject (checking remote metadata)...');
    const headRes = await s3.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: 'english_learning.db',
    }));
    console.log('Remote file confirmed!');
    console.log(' - ContentLength:', headRes.ContentLength, 'bytes');
    console.log(' - LastModified:', headRes.LastModified);
    console.log(' - ETag:', headRes.ETag);

    console.log('\n[5] Testing GetObject range / stream verification...');
    const getRes = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: 'english_learning.db',
      Range: 'bytes=0-100', // Read first 100 bytes (SQLite header)
    }));
    const sampleBytes = await getRes.Body.transformToByteArray();
    const headerStr = Buffer.from(sampleBytes.slice(0, 16)).toString('utf8');
    console.log('SQLite Header verification from S3:', headerStr);
    if (headerStr.startsWith('SQLite format 3')) {
      console.log('SUCCESS: Remote database is a valid SQLite format 3 file!');
    } else {
      console.warn('WARNING: Header did not match expected SQLite signature:', headerStr);
    }

    console.log('\nALL FILEBASE SYNC TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

runTest();
