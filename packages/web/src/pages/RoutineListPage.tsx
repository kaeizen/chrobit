import { useNavigate } from 'react-router-dom';
import { useRoutineStore } from '../store/routineStore';
import { RoutineCard } from '../components/routine/RoutineCard';
import { Button } from '../components/ui/Button';

export function RoutineListPage() {
  const routines = useRoutineStore((s) => s.routines);
  const add = useRoutineStore((s) => s.add);
  const navigate = useNavigate();

  function handleNew() {
    const routine = add('New Routine');
    navigate(`/builder/${routine.id}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Routines</h1>
        <Button onClick={handleNew} size="sm">+ New</Button>
      </div>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-5xl">⏱</div>
          <p className="text-zinc-400 text-lg font-medium">No routines yet</p>
          <p className="text-zinc-600 text-sm max-w-xs">
            Create your first routine to get started. Add tasks, set durations, and run timed sessions.
          </p>
          <Button onClick={handleNew} size="lg" className="mt-2">Create routine</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map((r) => (
            <RoutineCard key={r.id} routine={r} />
          ))}
        </div>
      )}
    </div>
  );
}
