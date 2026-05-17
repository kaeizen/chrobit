import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import type { IRoutineRepo } from '../repos/IRoutineRepo.js';
import { PgRoutineRepo } from '../repos/PgRoutineRepo.js';
import { SupabaseRoutineRepo } from '../repos/SupabaseRoutineRepo.js';

declare module 'fastify' {
  interface FastifyInstance {
    routineRepo: IRoutineRepo;
  }
}

const routineRepoPlugin: FastifyPluginAsync = async (fastify) => {
  const repo =
    process.env.APP_ENV === 'dev'
      ? new PgRoutineRepo(fastify.pg)
      : new SupabaseRoutineRepo(fastify.supabase);

  fastify.decorate('routineRepo', repo as IRoutineRepo);
};

export default fp(routineRepoPlugin, { name: 'routineRepo' });
