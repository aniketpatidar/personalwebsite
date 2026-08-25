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

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    
    if (!headers.has('Content-Type')) {
      const ext = filename.split('.').pop()?.toLowerCase();
      const types: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'svg': 'image/svg+xml'
      };
      if (ext && types[ext]) {
        headers.set('Content-Type', types[ext]);
      }
    }

    return new NextResponse(obj.body as any, {
      headers,
    });
  } catch (err) {
    return new NextResponse('Internal Server Error: ' + String(err), { status: 500 });
  }
}
