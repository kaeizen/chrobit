import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface AuthBody {
  email: string;
  password: string;
}

function signToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET required');
  return jwt.sign({ sub: userId, email }, secret, { expiresIn: '7d' });
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: AuthBody }>('/api/auth/register', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) return reply.status(400).send({ error: 'Email and password required' });

    const hash = await bcrypt.hash(password, 12);
    try {
      const { rows } = await fastify.pg.query<{ id: string; email: string }>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email.toLowerCase().trim(), hash]
      );
      const user = rows[0];
      return { token: signToken(user.id, user.email), user: { id: user.id, email: user.email } };
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        return reply.status(409).send({ error: 'Email already registered' });
      }
      throw err;
    }
  });

  fastify.post<{ Body: AuthBody }>('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) return reply.status(400).send({ error: 'Email and password required' });

    const { rows } = await fastify.pg.query<{ id: string; email: string; password_hash: string }>(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    return { token: signToken(user.id, user.email), user: { id: user.id, email: user.email } };
  });
};

export default authRoutes;
