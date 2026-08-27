import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const ctx = await getCloudflareContext({ async: true });
    const bucket = ctx.env.R2;
    
    if (!bucket) {
      return new NextResponse('R2 Bucket not found in env', { status: 500 });
    }

    const obj = await bucket.get(filename);
    if (!obj) {
      return new NextResponse('Not found', { status: 404 });
    }

    const buffer = await obj.arrayBuffer();

    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };
    
    let contentType = 'application/octet-stream';
    if (ext && types[ext]) {
      contentType = types[ext];
    } else if (obj.httpMetadata && obj.httpMetadata.contentType) {
      contentType = obj.httpMetadata.contentType;
    }

    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    });

    return new NextResponse(buffer, {
      headers,
    });
  } catch (err) {
    return new NextResponse('Internal Server Error: ' + String(err), { status: 500 });
  }
}
