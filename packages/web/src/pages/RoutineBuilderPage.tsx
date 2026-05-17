import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { RoutineItem, Task, Group, RoutineTransitionPlacement } from '@routine/shared';
import { useRoutineStore } from '../store/routineStore';
import { totalRoutineDuration } from '../lib/flatten';
import { type TaskFormState, type DragKind, type Containers, type DragMetrics, EMPTY_FORM, newId, uf } from '../components/builder/builderTypes';
import { formatSecs } from '../components/builder/BuilderIcons';
import { InfoTip } from '../components/builder/InfoTip';
import { TransitionTaskRow } from '../components/builder/TransitionTaskRow';
import { SortableItem } from '../components/builder/SortableItem';
import { InlineEditRows } from '../components/builder/InlineEditRows';
import { TaskRow } from '../components/builder/TaskRow';
import { GroupBlock } from '../components/builder/GroupBlock';
import { DragPreview } from '../components/builder/DragPreview';
import { EditableTitle } from '../components/builder/EditableTitle';
import { EditableDescription } from '../components/builder/EditableDescription';

export function RoutineBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routines = useRoutineStore((s) => s.routines);
  const update = useRoutineStore((s) => s.update);
  const routine = routines.find((r) => r.id === id);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [, _setVC] = useState<Containers | null>(null);
  const vcRef = useRef<Containers | null>(null);
  const dragLookupRef = useRef<Map<string, DragKind>>(new Map());
  const groupRectsRef = useRef<Map<string, DOMRect>>(new Map());

  const [addingTask, setAddingTask] = useState(false);
  const [addingTaskForm, setAddingTaskForm] = useState<TaskFormState>(EMPTY_FORM);
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function setVC(next: Containers | null) {
    vcRef.current = next;
    _setVC(next);
  }

  function updateVC(fn: (prev: Containers | null) => Containers | null) {
    const next = fn(vcRef.current);
    vcRef.current = next;
    _setVC(next);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Groups only collide with main-level items. Tasks collide with everything.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const activeData = args.active.data.current as { type?: string } | undefined;
    if (activeData?.type === 'group') {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => {
          const d = c.data.current as { level?: string } | undefined;
          return d?.level === 'main';
        }),
      });
    }
    return closestCenter(args);
  }, []);

  // StrictMode mounts→unmounts→remounts. Capture isFirst so the Strict Mode
  // cleanup (first unmount) is skipped; only the real unmount cleans up.
  const _firstMount = useRef(true);
  useEffect(() => {
    const isFirst = _firstMount.current;
    _firstMount.current = false;
    return () => {
      if (isFirst) return;
      const r = useRoutineStore.getState().routines.find((r) => r.id === id);
      if (r && r.items.length === 0) useRoutineStore.getState().remove(id!);
    };
  }, [id]);

  const items = routine ? [...routine.items].sort((a, b) => a.orderIndex - b.orderIndex) : [];

  function patchItems(newItems: RoutineItem[]) {
    if (!routine) return;
    update(routine.id, { items: newItems.map((item, i) => ({ ...item, orderIndex: i })) });
  }

  // Build ID→entry lookup. Main tasks keyed by task.id; groups by item.id; group tasks by task.id.
  function buildDragLookup(its: RoutineItem[]): Map<string, DragKind> {
    const map = new Map<string, DragKind>();
    for (const item of its) {
      if (item.type === 'task' && item.task) {
        map.set(item.task.id, { kind: 'main-task', item });
      } else if (item.type === 'group' && item.group) {
        map.set(item.id, { kind: 'group-item', item });
        for (const task of item.group.tasks) {
          map.set(task.id, { kind: 'group-task', task, groupId: item.group.id });
        }
      }
    }
    return map;
  }

  // Container arrays. Main uses task.id for tasks, item.id for groups.
  function buildContainers(its: RoutineItem[]): Containers {
    const main = its.map((i) => (i.type === 'task' ? i.task!.id : i.id));
    const c: Containers = { main };
    for (const item of its) {
      if (item.type === 'group' && item.group) {
        c[item.group.id] = item.group.tasks.map((t) => t.id);
      }
    }
    return c;
  }

  function findContainer(entryId: string, vc: Containers): string | null {
    for (const [key, ids] of Object.entries(vc)) {
      if (ids.includes(entryId)) return key;
    }
    return null;
  }

  function getDragMetrics(active: Active, delta: { x: number; y: number }): DragMetrics {
    const translated = active.rect.current?.translated
    const initial = active.rect.current?.initial
    const top = translated?.top ?? (initial ? initial.top + delta.y : null)
    const height = translated?.height ?? initial?.height ?? 48
    const centerY = top !== null ? top + height / 2 : null
    return { top, height, centerY }
  }

  // Rebuild RoutineItem[] from final virtual containers and commit to store.
  function applyContainers(vc: Containers) {
    const lookup = dragLookupRef.current;
    const newItems: RoutineItem[] = [];

    for (let index = 0; index < vc.main.length; index++) {
      const entryId = vc.main[index];
      const entry = lookup.get(entryId);
      if (!entry) continue;

      if (entry.kind === 'main-task') {
        newItems.push({ ...entry.item, orderIndex: index });
      } else if (entry.kind === 'group-item') {
        const origGroup = entry.item.group!;
        const taskIds = vc[origGroup.id] ?? origGroup.tasks.map((t) => t.id);
        const tasks = taskIds
          .map((tid) => {
            const te = lookup.get(tid);
            if (!te) return null;
            if (te.kind === 'group-task') return te.task;
            if (te.kind === 'main-task') return te.item.task ?? null;
            return null;
          })
          .filter((t): t is Task => t !== null);
        newItems.push({ ...entry.item, orderIndex: index, group: { ...origGroup, tasks } });
      } else if (entry.kind === 'group-task') {
        // Promoted to main list
        newItems.push({ id: newId(), type: 'task', orderIndex: index, task: entry.task });
      }
    }

    patchItems(newItems);
  }

  // Compute effective items for rendering, incorporating virtual container state during drag.
  function getEffectiveItems(): RoutineItem[] {
    const vc = vcRef.current;
    if (!vc) return items;
    const lookup = dragLookupRef.current;

    return vc.main
      .map((entryId, index) => {
        const entry = lookup.get(entryId);
        if (!entry) return null;

        if (entry.kind === 'main-task') {
          return { ...entry.item, orderIndex: index };
        }
        if (entry.kind === 'group-item') {
          const origGroup = entry.item.group!;
          const taskIds = vc[origGroup.id] ?? origGroup.tasks.map((t) => t.id);
          const tasks = taskIds
            .map((tid) => {
              const te = lookup.get(tid);
              if (!te) return null;
              if (te.kind === 'group-task') return te.task;
              if (te.kind === 'main-task') return te.item.task ?? null;
              return null;
            })
            .filter((t): t is Task => t !== null);
          return { ...entry.item, orderIndex: index, group: { ...origGroup, tasks } };
        }
        if (entry.kind === 'group-task') {
          // Temporarily in main as a standalone task; id = task.id for sortable consistency
          return { id: entryId, type: 'task' as const, orderIndex: index, task: entry.task };
        }
        return null;
      })
      .filter((i): i is RoutineItem => i !== null);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    dragLookupRef.current = buildDragLookup(items);
    setVC(buildContainers(items));
    // Snapshot each group block's bounding rect so the drag-move handler can
    // reliably detect when a task has been dragged above the group boundary.
    const rects = new Map<string, DOMRect>();
    for (const item of items) {
      if (item.type === 'group' && item.group) {
        const el = document.querySelector(`[data-group-id="${item.group.id}"]`);
        if (el) rects.set(item.group.id, el.getBoundingClientRect());
      }
    }
    groupRectsRef.current = rects;
  }

  // Fires on every pointer move during drag. Used as the primary mechanism for
  // detecting when a task is pulled above its own group's top boundary, since
  // this event always has `delta` populated and we can combine it with the
  // snapshotted group rect — no reliance on active.rect.current.translated.
  function handleDragMove({ active, delta }: DragMoveEvent) {
    const aid = String(active.id);

    // Only care about tasks currently inside a group
    const activeEntry = dragLookupRef.current.get(aid);
    if (activeEntry?.kind !== 'group-task') return;

    const vc = vcRef.current;
    if (!vc) return;
    const activeContainer = findContainer(aid, vc);
    if (!activeContainer || activeContainer === 'main') return;

    const groupRect = groupRectsRef.current.get(activeContainer);
    if (!groupRect) return;

    const metrics = getDragMetrics(active, delta);
    if (metrics.top === null) return;
    // Trigger exit when the card's top edge enters the group header zone
    if (metrics.top >= groupRect.top + 56) return;

    const groupEntry = [...dragLookupRef.current.values()].find(
      (e) => e.kind === 'group-item' && e.item.group?.id === activeContainer,
    );
    if (!groupEntry || groupEntry.kind !== 'group-item') return;

    updateVC((currentVc) => {
      if (!currentVc) return currentVc;
      const container = findContainer(aid, currentVc);
      if (!container || container === 'main') return currentVc;
      const fromIds = currentVc[container].filter((i) => i !== aid);
      const toIds = currentVc.main.filter((i) => i !== aid);
      const idx = toIds.indexOf(groupEntry.item.id);
      toIds.splice(idx >= 0 ? idx : 0, 0, aid);
      return { ...currentVc, [container]: fromIds, main: toIds };
    });
  }

  // Returns true when the dragged item has moved past the group header area and should
  // enter the group. Hovering near the top of the group keeps the item in the main list,
  // which fixes two problems:
  //   1. Placing a task between two consecutive groups.
  //   2. Placing a task before the very first item when it is a group.
  function shouldEnterGroup(dragCenterY: number | null, overRect: { top: number }): boolean {
    if (dragCenterY === null) return false;
    // GROUP_HEADER_PX ≈ height of the group header row (py-2.5 + 28px button = ~48px)
    const GROUP_HEADER_PX = 48;
    return dragCenterY > overRect.top + GROUP_HEADER_PX;
  }

  // Resolves which container a task should land in (and the insertion anchor ID).
  // `delta` is the total drag movement since drag-start; it is always populated
  // by dnd-kit and used as a fallback when `active.rect.current.translated` is
  // null (which can happen on the first few drag events).
  //
  //   Guard A — group-item hover: only enter the group when the dragged item's
  //   center has cleared the header area.
  //
  //   Guard B — cross-group-task hover: closestCenter resolves `over` to a task
  //   inside the next group rather than the group block; approach from above
  //   routes to main before the group.
  //
  //   Guard C — pull-out from top of own group: when dragging upward,
  //   closestCenter stays on sibling tasks in the same group. If the dragged
  //   item's top edge is above the over-task's top edge, the task has escaped
  //   upward and should exit to main.
  function resolveTarget(
    active: Active,
    over: NonNullable<DragOverEvent['over']>,
    delta: { x: number; y: number },
    vc: Containers,
    activeContainer: string,
  ): { overContainer: string; insertBeforeId: string } | null {
    const oid = String(over.id);
    let overContainer = findContainer(oid, vc);
    let insertBeforeId = oid;
    const overEntry = dragLookupRef.current.get(oid);

    // Compute the current dragged-item position. `translated` may be null on
    // early events; fall back to initial + delta which is always available.
    const metrics = getDragMetrics(active, delta);

    if (overEntry?.kind === 'group-item' && overEntry.item.group) {
      // Guard A
      if (shouldEnterGroup(metrics.centerY, over.rect)) {
        overContainer = overEntry.item.group.id;
        const targetGroupIds = vc[overContainer] ?? [];
        // When hovering the group block itself (not a specific task), anchor to the
        // group's first task so returning tasks don't intermittently append to bottom.
        if (targetGroupIds.length > 0) insertBeforeId = targetGroupIds[0];
      }
    } else if (overEntry?.kind === 'group-task' && activeContainer !== overEntry.groupId) {
      // Guard B: approaching a foreign group's task from above → stay in main
      const threshold = over.rect.top + over.rect.height / 2;
      if (metrics.centerY === null || metrics.centerY < threshold) {
        const groupEntry = [...dragLookupRef.current.values()].find(
          (e) => e.kind === 'group-item' && e.item.group?.id === overEntry.groupId,
        );
        if (groupEntry?.kind === 'group-item') {
          overContainer = 'main';
          insertBeforeId = groupEntry.item.id;
        }
      }
    } else if (overEntry?.kind === 'group-task' && activeContainer === overEntry.groupId) {
      // Guard C: task pulled above own group's top boundary.
      // Uses the group's DOM rect snapshotted at drag-start — reliable even when
      // active.rect.current.translated is null on early events.
      const groupRect = groupRectsRef.current.get(activeContainer);
      if (groupRect && metrics.top !== null && metrics.top < groupRect.top + groupRect.height * 0.25) {
        const groupEntry = [...dragLookupRef.current.values()].find(
          (e) => e.kind === 'group-item' && e.item.group?.id === overEntry.groupId,
        );
        if (groupEntry?.kind === 'group-item') {
          overContainer = 'main';
          insertBeforeId = groupEntry.item.id;
        }
      }
    }

    if (!overContainer) return null;
    return { overContainer, insertBeforeId };
  }

  // When the dragged item is pulled so far above all droppables that
  // closestCenter returns null (over === null), and the active item is a
  // group-task, exit it to main before its parent group.
  function exitGroupToMain(aid: string, vc: Containers): Containers | null {
    const activeEntry = dragLookupRef.current.get(aid);
    if (activeEntry?.kind !== 'group-task') return null;
    const activeContainer = findContainer(aid, vc);
    if (!activeContainer || activeContainer === 'main') return null;
    const groupEntry = [...dragLookupRef.current.values()].find(
      (e) => e.kind === 'group-item' && e.item.group?.id === activeContainer,
    );
    if (!groupEntry || groupEntry.kind !== 'group-item') return null;
    const fromIds = vc[activeContainer].filter((i) => i !== aid);
    const toIds = vc.main.filter((i) => i !== aid);
    const idx = toIds.indexOf(groupEntry.item.id);
    toIds.splice(idx >= 0 ? idx : 0, 0, aid);
    return { ...vc, [activeContainer]: fromIds, main: toIds };
  }

  function handleDragOver({ active, over, delta }: DragOverEvent) {
    const aid = String(active.id);

    if (!over) {
      // Task dragged above all droppables → pull out of group into main
      updateVC((vc) => {
        if (!vc) return vc;
        return exitGroupToMain(aid, vc) ?? vc;
      });
      return;
    }

    updateVC((vc) => {
      if (!vc) return vc;

      // Groups never cross containers
      const activeEntry = dragLookupRef.current.get(aid);
      if (activeEntry?.kind === 'group-item') return vc;

      const activeContainer = findContainer(aid, vc);
      if (!activeContainer) return vc;

      const resolved = resolveTarget(active, over, delta, vc, activeContainer);
      if (!resolved || resolved.overContainer === activeContainer) return vc;

      const { overContainer, insertBeforeId } = resolved;

      const fromIds = vc[activeContainer].filter((i) => i !== aid);
      const toIds = vc[overContainer].filter((i) => i !== aid);
      const overIdx = toIds.indexOf(insertBeforeId);
      toIds.splice(overIdx >= 0 ? overIdx : toIds.length, 0, aid);

      return { ...vc, [activeContainer]: fromIds, [overContainer]: toIds };
    });
  }

  function handleDragEnd({ active, over, delta }: DragEndEvent) {
    const aid = String(active.id);
    const vc = vcRef.current;

    if (!vc) {
      setActiveId(null);
      return;
    }

    const finalVc = { ...vc };

    if (over) {
      const activeContainer = findContainer(aid, finalVc);
      const resolved = activeContainer
        ? resolveTarget(active, over, delta, finalVc, activeContainer)
        : null;

      if (resolved && activeContainer && resolved.overContainer === activeContainer) {
        // Same-container reorder
        const ids = finalVc[activeContainer];
        const oldIdx = ids.indexOf(aid);
        const newIdx = ids.indexOf(resolved.insertBeforeId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          finalVc[activeContainer] = arrayMove(ids, oldIdx, newIdx);
        }
      }
    }

    applyContainers(finalVc);
    setActiveId(null);
    setVC(null);
  }

  function deleteItem(itemId: string) {
    patchItems(items.filter((i) => i.id !== itemId));
  }

  function updateGroup(itemId: string, updated: Group) {
    patchItems(items.map((item) => item.id === itemId ? { ...item, group: updated } : item));
  }

  function saveGroup() {
    const name = groupName.trim();
    if (!name) return;
    patchItems([...items, {
      id: newId(),
      type: 'group',
      orderIndex: items.length,
      group: { id: newId(), name, repeatCount: 2, tasks: [] },
    }]);
    setAddingGroup(false);
    setGroupName('');
  }

  if (!routine) return <div className="p-6 text-zinc-400">Routine not found.</div>;

  const effectiveItems = getEffectiveItems();
  // SortableContext items: task.id for tasks, item.id for groups
  const mainSortableIds = effectiveItems.map((i) => i.type === 'task' ? i.task!.id : i.id);
  const hasItems = items.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <EditableTitle
          value={routine.title}
          onChange={(t) => update(routine.id, { title: t })}
        />
        <button
          type="button"
          onClick={() => navigate('/')}
          disabled={!hasItems}
          className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            hasItems ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          Done
        </button>
      </div>

      <EditableDescription
        value={routine.description ?? ''}
        onChange={(d) => update(routine.id, { description: d || undefined })}
      />

      {items.length > 0 && (
        <div className="text-xs text-zinc-500 mt-2 mb-1">
          {formatSecs(totalRoutineDuration(routine))} total
        </div>
      )}

      <div className="mt-3 mb-5">
        <TransitionTaskRow
          task={routine.transitionTask}
          onChange={(t) => update(routine.id, { transitionTask: t })}
          onClear={() => update(routine.id, { transitionTask: undefined, transitionPlacements: undefined })}
          hint="A timed buffer played at configurable points in the routine — between items, before it starts, or after it ends."
          placementOptions={[
            { value: 'before', label: 'Before routine start' },
            { value: 'between', label: 'Between items' },
            { value: 'after', label: 'After routine' },
          ]}
          placements={routine.transitionPlacements ?? ['between']}
          onPlacementsChange={(p) => update(routine.id, { transitionPlacements: p as RoutineTransitionPlacement[] })}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => { setActiveId(null); setVC(null); }}
      >
        <SortableContext items={mainSortableIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 mb-4">
            {effectiveItems.map((item) => {
              const sortableId = item.type === 'task' ? item.task!.id : item.id;
              return (
                <SortableItem key={item.id} id={sortableId} data={{ level: 'main', type: item.type }}>
                  {(dragHandle) =>
                    item.type === 'task' && item.task ? (
                      <TaskRow
                        task={item.task}
                        dragHandle={dragHandle}
                        onSave={(f) => {
                          const name = f.name.trim();
                          const dur = parseInt(f.duration, 10);
                          if (!name || isNaN(dur) || dur <= 0) return;
                          patchItems(items.map((i) =>
                            i.id === item.id && i.task
                              ? { ...i, task: { ...i.task, name, durationSeconds: dur, description: f.notes.trim() || undefined } }
                              : i
                          ));
                        }}
                        onDelete={() => setPendingDeleteId(item.id)}
                      />
                    ) : item.group ? (
                      <GroupBlock
                        group={item.group}
                        dragHandle={dragHandle}
                        onUpdateGroup={(g) => updateGroup(item.id, g)}
                        onDelete={() => setPendingDeleteId(item.id)}
                      />
                    ) : null
                  }
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? <DragPreview activeId={activeId} dragLookup={dragLookupRef.current} /> : null}
        </DragOverlay>
      </DndContext>

      {!hasItems && !addingTask && !addingGroup && (
        <div className="text-center py-12 text-zinc-600">
          <p className="text-lg mb-1">Empty routine</p>
          <p className="text-sm">Add at least one task to save.</p>
        </div>
      )}

      {addingTask && (
        <div className="mb-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3">
          <InlineEditRows
            form={addingTaskForm}
            setForm={setAddingTaskForm}
            onSave={() => {
              const name = addingTaskForm.name.trim()
              const dur = parseInt(addingTaskForm.duration, 10)
              if (!name || isNaN(dur) || dur <= 0) return
              patchItems([...items, {
                id: newId(),
                type: 'task',
                orderIndex: items.length,
                task: { id: newId(), name, durationSeconds: dur, description: addingTaskForm.notes.trim() || undefined },
              }])
              setAddingTask(false)
              setAddingTaskForm(EMPTY_FORM)
            }}
            onCancel={() => { setAddingTask(false); setAddingTaskForm(EMPTY_FORM) }}
            handleSlot={<div className="w-8 shrink-0" />}
          />
        </div>
      )}

      {addingGroup && (
        <div className="mb-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-3 py-3 flex flex-col gap-3">
          <input
            className={`${uf} w-full text-sm text-zinc-100 placeholder-zinc-600`}
            placeholder="Group name, e.g. Circuit, Warm Up…"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveGroup()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAddingGroup(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors">Cancel</button>
            <button type="button" onClick={saveGroup} className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">Add group</button>
          </div>
        </div>
      )}

      {!addingTask && !addingGroup && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setAddingTask(true); setAddingTaskForm(EMPTY_FORM) }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-zinc-900 border border-zinc-700 hover:border-violet-600 hover:bg-zinc-800 rounded-2xl text-sm font-medium text-zinc-300 transition-colors"
          >
            + Task
            <InfoTip text="A single timed step in your routine." />
          </button>
          <button
            type="button"
            onClick={() => { setAddingGroup(true); setGroupName(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-zinc-900 border border-zinc-700 hover:border-violet-600 hover:bg-zinc-800 rounded-2xl text-sm font-medium text-zinc-300 transition-colors"
          >
            + Group
            <InfoTip text="A named block of tasks that repeats N times." />
          </button>
        </div>
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setPendingDeleteId(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-100 font-semibold mb-1">Delete?</p>
            <p className="text-zinc-400 text-sm mb-5">This item will be permanently removed.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPendingDeleteId(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button type="button" onClick={() => { deleteItem(pendingDeleteId); setPendingDeleteId(null); }} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
