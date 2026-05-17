import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoute from './routes/health.js';
import routinesRoute from './routes/routines.js';
import authPlugin from './plugins/auth.js';
import routineRepoPlugin from './plugins/routineRepo.js';

const isDev = process.env.APP_ENV === 'dev';
const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
});

if (isDev) {
  const { default: dbPlugin } = await import('./plugins/db.js');
  const { default: authRoutes } = await import('./routes/authRoutes.js');
  await fastify.register(dbPlugin);
  await fastify.register(authPlugin);
  await fastify.register(routineRepoPlugin);
  await fastify.register(authRoutes);
} else {
  const { default: supabasePlugin } = await import('./plugins/supabase.js');
  await fastify.register(supabasePlugin);
  await fastify.register(authPlugin);
  await fastify.register(routineRepoPlugin);
}

await fastify.register(healthRoute);
await fastify.register(routinesRoute);

const port = Number(process.env.PORT ?? 3000);

try {
  await fastify.listen({ port, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
