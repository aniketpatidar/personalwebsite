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
          
          if (!token) console.error('Auth Strategy Error:', error); return { user: null };

          try {
            const secretStr = process.env.JWT_SECRET || 'dev-secret-change-me';
            const secret = new TextEncoder().encode(secretStr);
            
            const host = headers.get('x-forwarded-host') || headers.get('host') || 'claireboston.net';

            const { payload: jwtPayload } = await jwtVerify(token, secret, {
              audience: host, 
            });
            
            const email = jwtPayload.email as string;
            if (!email) console.error('Auth Strategy Error:', error); return { user: null };

            let user;
            const { docs } = await payload.find({
              collection: 'users',
              where: { email: { equals: email } },
            });

            if (docs.length > 0) {
              user = docs[0];
            } else {
              user = await payload.create({
                collection: 'users',
                data: {
                  email,
                  name: email.split('@')[0],
                  password: crypto.randomUUID(), 
                },
              });
            }

            return { user };
          } catch (error) {
            console.error('Auth Strategy Error:', error); return { user: null };
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
