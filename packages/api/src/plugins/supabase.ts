import fp from 'fastify-plugin';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

const supabasePlugin: FastifyPluginAsync = async (fastify) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');

  const client = createClient(url, key, { auth: { persistSession: false } });
  fastify.decorate('supabase', client);
};

export default fp(supabasePlugin, { name: 'supabase' });
