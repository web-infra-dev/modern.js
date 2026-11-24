import { execFileSync } from 'node:child_process';

export function parseProcesses(output) {
  return output.split('\n').flatMap(line => {
    const match = line.match(
      /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\w+\s+\w+\s+\d+\s+[\d:]+\s+\d+)\s+(\S+)\s+(.+)$/,
    );
    return match
      ? [
          {
            pid: Number(match[1]),
            parent: Number(match[2]),
            group: Number(match[3]),
            birth: match[4].replace(/\s+/g, ' '),
            state: match[5],
            command: match[6],
          },
        ]
      : [];
  });
}

export function readProcesses() {
  const output = execFileSync(
    'ps',
    ['-axo', 'pid=,ppid=,pgid=,lstart=,stat=,command='],
    { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } },
  );
  const rows = parseProcesses(output);
  if (!rows.length) throw new Error('No process identities returned by ps');
  return rows;
}

const identity = row => `${row.pid}:${row.birth}`;
const running = row => !row.state.startsWith('Z');

export class ProcessTracker {
  active = new Map();
  groups = new Set();
  observed = new Map();

  seed(row) {
    this.active.set(row.pid, row);
    this.groups.add(row.group);
    this.observed.set(identity(row), row);
  }

  update(rows) {
    const current = new Map(rows.map(row => [row.pid, row]));
    const previous = this.active;
    const active = new Map();
    for (const [pid, old] of previous) {
      const row = current.get(pid);
      if (row && identity(row) === identity(old)) active.set(pid, row);
    }
    // A group number grants no ownership after its last known member exits.
    const groups = new Set(
      [...this.groups].filter(group =>
        [...active.values()].some(
          row => row.group === group && previous.get(row.pid)?.group === group,
        ),
      ),
    );
    let size;
    do {
      size = active.size;
      for (const row of rows) {
        if (
          active.has(row.pid) ||
          active.has(row.parent) ||
          groups.has(row.group)
        ) {
          active.set(row.pid, row);
          if (row.pid === row.group) groups.add(row.group);
          this.observed.set(identity(row), row);
        }
      }
    } while (size !== active.size);
    this.active = active;
    this.groups = groups;
    return [...active.values()].filter(running);
  }
}

// Never broadcast to a historical PGID. Revalidate each incarnation immediately
// before its individual signal, including when escalating TERM to KILL.
export function signalTrackedProcesses(
  tracker,
  read,
  kill,
  signal,
  exclude = [],
) {
  const targets = tracker.update(read());
  for (const target of targets) {
    if (exclude.includes(target.pid)) continue;
    const current = tracker.update(read());
    if (!current.some(row => identity(row) === identity(target))) continue;
    try {
      kill(target.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
}
