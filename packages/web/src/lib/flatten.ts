import type { FlatStep, Routine, TransitionTask } from '@routine/shared';

export function flattenRoutine(routine: Routine): FlatStep[] {
  const steps: FlatStep[] = [];
  const sorted = [...routine.items].sort((a, b) => a.orderIndex - b.orderIndex);
  const rp = new Set(routine.transitionPlacements ?? ['between']);

  if (routine.transitionTask && rp.has('before')) {
    steps.push(makeTransitionStep('routine-transition-before', routine.transitionTask));
  }

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];

    if (i > 0 && routine.transitionTask && rp.has('between')) {
      steps.push(makeTransitionStep(`routine-transition-${i}`, routine.transitionTask));
    }

    if (item.type === 'task' && item.task) {
      steps.push({
        id: `item-${item.id}`,
        name: item.task.name,
        durationSeconds: item.task.durationSeconds,
        description: item.task.description,
      });
    } else if (item.type === 'group' && item.group) {
      const g = item.group;
      const totalRounds = g.repeatCount;
      const gp = new Set(g.transitionPlacements ?? ['between-tasks']);

      for (let round = 1; round <= totalRounds; round++) {
        const repeatLabel = totalRounds > 1 ? `Round ${round} of ${totalRounds}` : undefined;
        const isLastRound = round === totalRounds;

        for (let ti = 0; ti < g.tasks.length; ti++) {
          const t = g.tasks[ti];
          const isFirstTask = ti === 0;
          const isLastTask = ti === g.tasks.length - 1 && isLastRound;
          const isFirstRound = round === 1;

          if (g.transitionTask && gp.has('before-first-round') && isFirstTask && isFirstRound) {
            steps.push({
              ...makeTransitionStep(`group-${item.id}-before-first-round`, g.transitionTask),
              groupName: g.name,
            });
          }

          steps.push({
            id: `item-${item.id}-round-${round}-task-${t.id}`,
            name: t.name,
            durationSeconds: t.durationSeconds,
            description: t.description,
            groupName: g.name,
            repeatLabel,
          });

          if (g.transitionTask && gp.has('between-tasks') && !isLastTask) {
            steps.push({
              ...makeTransitionStep(`group-${item.id}-round-${round}-transition-${ti}`, g.transitionTask),
              groupName: g.name,
              repeatLabel,
            });
          }

          if (g.transitionTask && gp.has('after-last-round') && isLastTask) {
            steps.push({
              ...makeTransitionStep(`group-${item.id}-after-last-round`, g.transitionTask),
              groupName: g.name,
            });
          }
        }
      }
    }
  }

  if (routine.transitionTask && rp.has('after')) {
    steps.push(makeTransitionStep('routine-transition-after', routine.transitionTask));
  }

  return steps;
}

export function totalRoutineDuration(routine: Routine): number {
  return flattenRoutine(routine).reduce((sum, s) => sum + s.durationSeconds, 0);
}

function makeTransitionStep(id: string, t: TransitionTask): FlatStep {
  return {
    id,
    name: t.name,
    durationSeconds: t.durationSeconds,
    description: t.description,
    isTransition: true,
  };
}
