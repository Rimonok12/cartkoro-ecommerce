import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(request) {
  try {
    const { filename, contentType } = await request.json();
    if (!filename || !contentType) {
      return new Response(JSON.stringify({ message: 'filename and contentType are required' }), { status: 400 });
    }

    // build a unique key
    const ext = filename.split('.').pop();
    const key = `product/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read', // if your bucket policy allows; otherwise remove
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60s validity

    const publicUrl = `${process.env.AWS_S3_PUBLIC_BASE}/${key}`;
    return new Response(JSON.stringify({ uploadUrl, key, publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
}
