// lib/s3Upload.js
export async function s3Upload(file, endpoint) {
    if (!file) throw new Error('No file provided');
  
    // 1) Get presigned URL from your Next API
    const signRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
  
    if (!signRes.ok) {
      const err = await signRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to get signed URL');
    }
  
    const { uploadUrl, publicUrl } = await signRes.json();
  
    // 2) Upload directly to S3
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  
    if (!putRes.ok) throw new Error('S3 upload failed');
  
    // 3) Return public link (or key if you prefer)
    return publicUrl;
  }
  