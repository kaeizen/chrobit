import fp from 'fastify-plugin';
import pg from 'pg';
import type { FastifyPluginAsync } from 'fastify';

const { Pool } = pg;

declare module 'fastify' {
  interface FastifyInstance {
    pg: InstanceType<typeof Pool>;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required in dev mode');

  const pool = new Pool({ connectionString: url });
  await pool.query('SELECT 1'); // fail fast if DB unreachable

  fastify.decorate('pg', pool);
  fastify.addHook('onClose', async () => pool.end());
};

export default fp(dbPlugin, { name: 'db' });
