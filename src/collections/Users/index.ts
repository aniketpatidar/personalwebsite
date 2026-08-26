import type { CollectionConfig } from 'payload'
import { jwtVerify } from 'jose'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    strategies: [
      {
        name: 'worker-auth',
        authenticate: async ({ headers, payload }) => {
          let token = headers.get('authorization')?.replace('Bearer ', '');
          if (!token) {
            const cookieStr = headers.get('cookie');
            if (cookieStr) {
              const match = cookieStr.match(/(?:^|;\s*)payload-token=([^;]*)/);
              token = match ? match[1] : undefined;
            }
          }
          
          const clearCookieHeaders = new Headers({
            'Set-Cookie': 'payload-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
          });

          if (!token) {
            console.error('Auth Strategy Error: No token provided');
            return { user: null };
          }

          try {
            const secretStr = process.env.JWT_SECRET || 'dev-secret-change-me';
            const secret = new TextEncoder().encode(secretStr);
            
            const host = headers.get('x-forwarded-host') || headers.get('host') || 'claireboston.net';

            const { payload: jwtPayload } = await jwtVerify(token, secret, {
              audience: host, 
            });
            
            const email = jwtPayload.email as string;
            if (!email) {
              console.error('Auth Strategy Error: No email in JWT payload');
              return { user: null, responseHeaders: clearCookieHeaders };
            }

            let user;
            const { docs } = await payload.find({
              collection: 'users',
              where: { email: { equals: email } },
            });

            if (docs.length === 0) {
              console.error('Auth Strategy Error: User not found. User must be pre-registered.');
              return { user: null, responseHeaders: clearCookieHeaders };
            }

            user = docs[0];

            return { 
              user: {
                ...user,
                collection: 'users'
              } 
            };
          } catch (error) {
            console.error('Auth Strategy Error:', error);
            return { user: null, responseHeaders: clearCookieHeaders };
          }
        },
      }
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
