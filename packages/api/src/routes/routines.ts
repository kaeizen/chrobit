import type { FastifyPluginAsync } from 'fastify';
import type { Routine } from '@routine/shared';

interface Params { id: string; }

const routinesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/routines', async (request) => {
    return fastify.routineRepo.list(request.userId);
  });

  fastify.post<{ Body: Routine }>('/api/routines', async (request, reply) => {
    const routine = await fastify.routineRepo.create(request.body, request.userId);
    return reply.status(201).send(routine);
  });

  fastify.put<{ Params: Params; Body: Routine }>('/api/routines/:id', async (request, reply) => {
    const { title, description, items } = request.body;
    const routine = await fastify.routineRepo.update(request.params.id, request.userId, { title, description, items });
    if (!routine) return reply.status(404).send({ error: 'Not found' });
    return routine;
  });

  fastify.delete<{ Params: Params }>('/api/routines/:id', async (request, reply) => {
    await fastify.routineRepo.remove(request.params.id, request.userId);
    return reply.status(204).send();
  });
};

export default routinesRoute;
