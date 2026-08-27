import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const cloudflare = await getCloudflareContext({ async: true });
  return NextResponse.json({
    hasR2: !!cloudflare?.env?.R2,
    hasD1: !!cloudflare?.env?.D1,
    envKeys: cloudflare?.env ? Object.keys(cloudflare.env) : null
  });
}
