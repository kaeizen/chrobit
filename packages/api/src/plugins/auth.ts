import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('userId', '');

  fastify.addHook('preHandler', async (request: FastifyRequest, reply) => {
    const skipPaths = ['/health', '/api/auth/login', '/api/auth/register'];
    if (skipPaths.includes(request.url)) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing token' });
    }

    const token = authHeader.slice(7);

    if (process.env.APP_ENV === 'dev') {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET required');
      try {
        const payload = jwt.verify(token, secret) as { sub: string };
        request.userId = payload.sub;
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }
    } else {
      const { data, error } = await fastify.supabase.auth.getUser(token);
      if (error || !data.user) {
        return reply.status(401).send({ error: 'Invalid token' });
      }
      request.userId = data.user.id;
    }
  });
};

export default fp(authPlugin, { name: 'auth' });
