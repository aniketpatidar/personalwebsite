import { SignJWT, jwtVerify } from 'jose';

export interface Env {
  EMAIL: {
    send: (msg: any) => Promise<any>;
  };
  JWT_SECRET?: string;
  ALLOWED_SITES?: string;
  FROM_ADDRESS?: string;
  MAGIC_LINKS_KV: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const allowedSites = env.ALLOWED_SITES ? env.ALLOWED_SITES.split(',') : [];

    if (request.method === 'POST' && url.pathname === '/auth/request') {
      try {
        const body = (await request.json()) as { email?: string; site?: string };
        const { email, site } = body;

        if (!email || !site) {
          return Response.json({ error: 'Missing email or site' }, { status: 400, headers: corsHeaders });
        }

        if (!allowedSites.includes(site)) {
          return Response.json({ error: 'Unauthorized site' }, { status: 403, headers: corsHeaders });
        }

        const jti = crypto.randomUUID();
        await env.MAGIC_LINKS_KV.put(jti, 'true', { expirationTtl: 15 * 60 });

        const secret = new TextEncoder().encode(env.JWT_SECRET || 'dev-secret-change-me');
        const jwt = await new SignJWT({ email, site })
          .setProtectedHeader({ alg: 'HS256' })
          .setJti(jti)
          .setIssuedAt()
          .setExpirationTime('15m')
          .sign(secret);

        const verifyUrl = new URL(request.url);
        verifyUrl.pathname = '/auth/verify';
        verifyUrl.searchParams.set('token', jwt);
        verifyUrl.searchParams.set('site', site);

        const fromAddress = env.FROM_ADDRESS || 'no-reply@example.com';

        await env.EMAIL.send({
          from: fromAddress,
          to: email,
          subject: 'Your payload admin dashboard sign-in link',
          html: `
            <p>Your payload admin dashboard link is ready</p>
            <p>Verify your email and sign in with one click. This secure link expires in 15 minutes.</p>
            <p><a href="${verifyUrl.toString()}">verify email and sign in</a></p>
            <br />
            <p>If you didn’t request this link, you can safely ignore this email. Nothing will change.</p>
          `,
          text: `Your payload admin dashboard link is ready\n\nVerify your email and sign in with one click. This secure link expires in 15 minutes.\n\nverify email and sign in: ${verifyUrl.toString()}\n\nIf you didn’t request this link, you can safely ignore this email. Nothing will change.`,
        });

        return Response.json({ success: true, message: 'Magic link sent' }, { headers: corsHeaders });
      } catch (err: any) {
        console.error('Error generating magic link:', err);
        return Response.json({ error: 'Failed to process request' }, { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'GET' && url.pathname === '/auth/verify') {
      try {
        const token = url.searchParams.get('token');
        if (!token) {
          return new Response('Missing token', { status: 400, headers: corsHeaders });
        }

        const secret = new TextEncoder().encode(env.JWT_SECRET || 'dev-secret-change-me');
        const { payload } = await jwtVerify(token, secret);

        const email = payload.email as string;
        const site = payload.site as string;
        const jti = payload.jti as string;

        if (!email || !site || !allowedSites.includes(site)) {
          return new Response('Invalid token payload or unauthorized site', { status: 403, headers: corsHeaders });
        }

        if (!jti) {
          return new Response('Invalid token payload (missing jti)', { status: 403, headers: corsHeaders });
        }

        const nonce = await env.MAGIC_LINKS_KV.get(jti);
        if (!nonce) {
          return new Response('Magic link has already been used or expired.', { status: 401, headers: corsHeaders });
        }

        await env.MAGIC_LINKS_KV.delete(jti);

        const sessionJwt = await new SignJWT({ email, collection: 'users' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setAudience(site)
          .setExpirationTime('7d')
          .sign(secret);

        const protocol = site.includes('localhost') ? 'http' : 'https';
        const redirectUrl = `${protocol}://${site}/auth/callback?token=${sessionJwt}`;

        return Response.redirect(redirectUrl, 302);
      } catch (err: any) {
        console.error('Error verifying token:', err);
        return new Response('Invalid or expired magic link.', { status: 401, headers: corsHeaders });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
} satisfies ExportedHandler<Env>;
