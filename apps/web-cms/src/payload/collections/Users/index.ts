import type { CollectionConfig } from 'payload'

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
  // The worker-auth strategy (JWT from the shared master-auth Worker) is
  // attached via the workerAuthPlugin in src/payload/plugins/index.ts.
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
