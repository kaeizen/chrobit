import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Group, GroupTransitionPlacement } from '@routine/shared';
import { type TaskFormState, EMPTY_FORM, newId } from './builderTypes';
import { ChevronIcon, TrashSmIcon } from './BuilderIcons';
import { type ReactNode } from 'react';
import { SortableItem } from './SortableItem';
import { GroupTaskRow } from './GroupTaskRow';
import { InlineEditRows } from './InlineEditRows';
import { TransitionTaskRow } from './TransitionTaskRow';

export function GroupBlock({
  group,
  onUpdateGroup,
  onDelete,
  dragHandle,
}: {
  group: Group;
  onUpdateGroup: (updated: Group) => void;
  onDelete: () => void;
  dragHandle: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [addingTaskForm, setAddingTaskForm] = useState<TaskFormState>(EMPTY_FORM);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);

  function saveName() {
    const n = nameDraft.trim();
    if (n) onUpdateGroup({ ...group, name: n });
    else setNameDraft(group.name);
    setEditingName(false);
  }

  return (
    <div data-group-id={group.id} className="bg-zinc-900 border border-zinc-700 rounded-2xl">
      <div className={`flex items-center gap-2 px-3 py-2.5 bg-zinc-800/50 rounded-t-2xl ${collapsed ? 'rounded-b-2xl' : ''}`}>
        {dragHandle}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              className="bg-transparent border-b border-violet-500 px-0 py-1 text-sm font-semibold text-violet-300 focus:outline-none w-full transition-colors"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="text-left font-semibold text-sm text-violet-300 hover:text-violet-200 w-full truncate"
              onClick={() => { setNameDraft(group.name); setEditingName(true); }}
            >
              {group.name}
              {collapsed && (
                <span className="text-zinc-500 font-normal ml-2 text-xs">
                  {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          )}
        </div>
        <button type="button" onClick={() => onUpdateGroup({ ...group, repeatCount: Math.max(1, group.repeatCount - 1) })} className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 flex items-center justify-center text-sm transition-colors shrink-0">−</button>
        <span className="text-xs text-zinc-300 w-5 text-center shrink-0">{group.repeatCount}</span>
        <button type="button" onClick={() => onUpdateGroup({ ...group, repeatCount: group.repeatCount + 1 })} className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 flex items-center justify-center text-sm transition-colors shrink-0">+</button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors ml-1 shrink-0"
          aria-label={collapsed ? 'Expand group' : 'Collapse group'}
        >
          <ChevronIcon up={!collapsed} />
        </button>
        <button type="button" onClick={onDelete} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors shrink-0"><TrashSmIcon /></button>
      </div>

      {!collapsed && (
        <>
          <div className="px-3 py-2 border-t border-zinc-800">
            <TransitionTaskRow
              task={group.transitionTask}
              onChange={(t) => onUpdateGroup({ ...group, transitionTask: t })}
              onClear={() => onUpdateGroup({ ...group, transitionTask: undefined, transitionPlacements: undefined })}
              hint="A timed buffer played between tasks or after the group finishes — useful for a short break or a moment to reset."
              placementOptions={[
                { value: 'before-first-round', label: 'Before group start' },
                { value: 'between-tasks', label: 'Between tasks' },
                { value: 'after-last-round', label: 'After last round' },
              ]}
              placements={group.transitionPlacements ?? ['between-tasks']}
              onPlacementsChange={(p) => onUpdateGroup({ ...group, transitionPlacements: p as GroupTransitionPlacement[] })}
            />
          </div>

          <div className="p-2 flex flex-col gap-1.5 border-t border-zinc-800">
            {/* No inner DndContext — tasks participate in the outer DndContext for kanban DnD */}
            <SortableContext items={group.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {group.tasks.map((task) => (
                <SortableItem key={task.id} id={task.id} data={{ level: 'group', groupId: group.id }}>
                  {(dh) => (
                    <GroupTaskRow
                      task={task}
                      dragHandle={dh}
                      onSave={(f) => {
                        const name = f.name.trim();
                        const dur = parseInt(f.duration, 10);
                        if (!name || isNaN(dur) || dur <= 0) return;
                        onUpdateGroup({
                          ...group,
                          tasks: group.tasks.map((t) =>
                            t.id === task.id
                              ? { ...t, name, durationSeconds: dur, description: f.notes.trim() || undefined }
                              : t
                          ),
                        });
                      }}
                      onDelete={() => setPendingDeleteTaskId(task.id)}
                    />
                  )}
                </SortableItem>
              ))}
            </SortableContext>

            {addingTask ? (
              <div className="bg-zinc-800 rounded-xl px-3 py-3">
                <InlineEditRows
                  form={addingTaskForm}
                  setForm={setAddingTaskForm}
                  onSave={() => {
                    const name = addingTaskForm.name.trim()
                    const dur = parseInt(addingTaskForm.duration, 10)
                    if (!name || isNaN(dur) || dur <= 0) return
                    onUpdateGroup({
                      ...group,
                      tasks: [...group.tasks, { id: newId(), name, durationSeconds: dur, description: addingTaskForm.notes.trim() || undefined }],
                    })
                    setAddingTask(false)
                    setAddingTaskForm(EMPTY_FORM)
                  }}
                  onCancel={() => { setAddingTask(false); setAddingTaskForm(EMPTY_FORM) }}
                  handleSlot={<div className="w-8 shrink-0" />}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setAddingTask(true); setAddingTaskForm(EMPTY_FORM) }}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-violet-400 px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="text-base leading-none">+</span> Add task
              </button>
            )}
          </div>
        </>
      )}

      {pendingDeleteTaskId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setPendingDeleteTaskId(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-100 font-semibold mb-1">Delete task?</p>
            <p className="text-zinc-400 text-sm mb-5">This task will be permanently removed.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPendingDeleteTaskId(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button type="button" onClick={() => { onUpdateGroup({ ...group, tasks: group.tasks.filter((t) => t.id !== pendingDeleteTaskId) }); setPendingDeleteTaskId(null); }} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
