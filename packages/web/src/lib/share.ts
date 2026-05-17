import type { Routine, RoutineItem, Group } from '@routine/shared';

export interface SharePayload {
  version: 1;
  routines: Routine[];
}

interface QRTrans { n: string; d: number; desc?: string; }
interface QRTask  { n: string; d: number; desc?: string; }
interface QRGroup { n: string; r: number; t: QRTask[]; tr?: QRTrans; tp?: string[]; }
interface QRItem  { task?: QRTask; group?: QRGroup; }
interface QRRoutine { title: string; desc?: string; items: QRItem[]; tr?: QRTrans; tp?: string[]; }
interface QRPayload { v: 2; r: QRRoutine[]; }

function toQRPayload(routines: Routine[]): QRPayload {
  const trans = (t: { name: string; durationSeconds: number; description?: string }): QRTrans =>
    ({ n: t.name, d: t.durationSeconds, ...(t.description ? { desc: t.description } : {}) });

  return {
    v: 2,
    r: routines.map((r) => ({
      title: r.title,
      ...(r.description ? { desc: r.description } : {}),
      ...(r.transitionTask ? { tr: trans(r.transitionTask) } : {}),
      ...(r.transitionPlacements ? { tp: r.transitionPlacements } : {}),
      items: [...r.items]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .flatMap((item): QRItem[] => {
          if (item.type === 'task' && item.task) {
            return [{ task: trans(item.task) }];
          }
          if (item.type === 'group' && item.group) {
            const g = item.group;
            return [{
              group: {
                n: g.name,
                r: g.repeatCount,
                t: g.tasks.map(trans),
                ...(g.transitionTask ? { tr: trans(g.transitionTask) } : {}),
                ...(g.transitionPlacements ? { tp: g.transitionPlacements } : {}),
              },
            }];
          }
          return [];
        }),
    })),
  };
}

// crypto.randomUUID() requires a secure context on some browsers (HTTP vs HTTPS).
// Fall back to Math.random-based UUID so imports work over local HTTP on mobile.
export function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function fromQRPayload(p: QRPayload): Routine[] {
  const id = safeUUID;
  const now = new Date().toISOString();
  const fullTrans = (t: QRTrans) => ({ name: t.n, durationSeconds: t.d, description: t.desc });

  return p.r.map((qr) => ({
    id: id(),
    title: qr.title,
    description: qr.desc,
    transitionTask: qr.tr ? fullTrans(qr.tr) : undefined,
    transitionPlacements: qr.tp as Routine['transitionPlacements'],
    items: qr.items.map((qi, idx): RoutineItem => {
      if (qi.task) {
        return { id: id(), type: 'task', orderIndex: idx, task: { id: id(), name: qi.task.n, durationSeconds: qi.task.d, description: qi.task.desc } };
      }
      if (qi.group) {
        return {
          id: id(), type: 'group', orderIndex: idx,
          group: {
            id: id(), name: qi.group.n, repeatCount: qi.group.r,
            tasks: qi.group.t.map((t) => ({ id: id(), name: t.n, durationSeconds: t.d, description: t.desc })),
            transitionTask: qi.group.tr ? fullTrans(qi.group.tr) : undefined,
            transitionPlacements: qi.group.tp as Group['transitionPlacements'],
          },
        };
      }
      return { id: id(), type: 'task', orderIndex: idx };
    }),
    createdAt: now,
    updatedAt: now,
  }));
}

// URL-safe base64 (RFC 4648): +→- /→_ no padding. Safe to embed in query strings.
function b64encode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64decode(b64: string): string {
  const standard = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  return decodeURIComponent(
    Array.from(atob(padded))
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function encodeSharePayload(routines: Routine[]): string {
  return b64encode(JSON.stringify({ version: 1, routines } satisfies SharePayload));
}

// Compact encoder for QR codes — produces much smaller output than the full payload.
export function encodeForQR(routines: Routine[]): string {
  return b64encode(JSON.stringify(toQRPayload(routines)));
}

// Decodes both v1 (file export) and v2 (QR compact) payloads.
export function decodeSharePayload(encoded: string): Routine[] | null {
  try {
    const data = JSON.parse(b64decode(encoded));
    if (data.v === 2) return fromQRPayload(data as QRPayload);
    if (data.version === 1 && Array.isArray(data.routines)) return data.routines as Routine[];
    return null;
  } catch {
    return null;
  }
}

// Assign fresh UUIDs to a routine and all its children to avoid ID collisions on import.
export function withFreshIds(routine: Routine): Routine {
  return {
    ...routine,
    id: safeUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: routine.items.map((item): RoutineItem => ({
      ...item,
      id: safeUUID(),
      task: item.task ? { ...item.task, id: safeUUID() } : undefined,
      group: item.group
        ? {
            ...item.group,
            id: safeUUID(),
            tasks: item.group.tasks.map((t) => ({ ...t, id: safeUUID() })),
          }
        : undefined,
    })),
  };
}
