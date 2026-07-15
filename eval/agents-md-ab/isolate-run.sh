#!/bin/bash
# Real OS isolation for experiment runs (review gate item 1, revision 2).
#
# ISOLATION MODEL: file + process isolation (network namespace NOT unshared —
# declared limitation; the private harness must not listen on local ports
# while an agent is alive). Two SEQUENTIAL, non-overlapping namespaces per run:
#
#   phase "agent":  lower = arm template node_modules (physically ro)
#                   upper = per-run agent upper (KEPT after exit — frozen)
#   phase "grader": lower = <agent upper>:<arm template>   (agent's real final
#                   dependency state, read-only) ; upper = grader's own upper
#
# Namespaces: user + mount + pid (--fork --kill-child), private propagation,
# fresh procfs, fresh tmpfs /tmp, pivot_root with old root fully detached,
# /etc exposed file-by-file (DNS/certs/passwd only), host HOME//tmp/private
# harness/sibling runs/opposite arm all unreachable.
#
# Usage:
#   isolate-run.sh WORKDIR LOWERDIRS HOMEDIR SCRATCH -- COMMAND [ARGS...]
#     WORKDIR   run workspace (rw)  -> /workspace
#     LOWERDIRS colon-joined overlay lower stack, top first
#               (agent phase: "<armNM>"; grader phase: "<agentUpper>:<armNM>")
#     HOMEDIR   the run's HOME (rw) -> /agent-home
#     SCRATCH   per-phase scratch; nm-upper/ inside it is the phase's upper
set -euo pipefail

if [[ "${1:-}" != "__inner__" ]]; then
  WORKDIR=$1; LOWERS=$2; HOMEDIR=$3; SCRATCH=$4
  shift 4
  [[ "${1:-}" == "--" ]] && shift
  exec unshare --user --map-root-user --mount --pid --fork --kill-child \
    --propagation private -- \
    bash "$0" __inner__ "$WORKDIR" "$LOWERS" "$HOMEDIR" "$SCRATCH" "$@"
fi

shift # __inner__
WORKDIR=$1; LOWERS=$2; HOMEDIR=$3; SCRATCH=$4
shift 4

CLAUDE_GLOBAL="${AB_CLAUDE_GLOBAL:-$HOME/.npm-global}"
mkdir -p "$SCRATCH/newroot" "$SCRATCH/nm-upper" "$SCRATCH/nm-work"
NEWROOT="$SCRATCH/newroot"

mount -t tmpfs tmpfs "$NEWROOT"
mkdir -p "$NEWROOT"/{usr,bin,lib,sbin,etc,proc,dev,tmp,workspace,agent-home,old-root}
[[ -d /lib64 ]] && mkdir -p "$NEWROOT/lib64"

bind_ro_dir() {
  mount --rbind "$1" "$2"
  mount --rbind -o remount,ro,bind "$2" 2>/dev/null || true
}

bind_ro_dir /usr "$NEWROOT/usr"
bind_ro_dir /bin "$NEWROOT/bin"
bind_ro_dir /lib "$NEWROOT/lib"
[[ -d /lib64 ]] && bind_ro_dir /lib64 "$NEWROOT/lib64"
bind_ro_dir /sbin "$NEWROOT/sbin"

# /etc: individual necessary files only — no blanket exposure
for f in resolv.conf hosts nsswitch.conf passwd group localtime ssl ca-certificates pki; do
  if [[ -e "/etc/$f" ]]; then
    if [[ -d "/etc/$f" ]]; then
      mkdir -p "$NEWROOT/etc/$f"
      bind_ro_dir "/etc/$f" "$NEWROOT/etc/$f"
    else
      touch "$NEWROOT/etc/$f"
      mount --bind -o ro "/etc/$f" "$NEWROOT/etc/$f" 2>/dev/null ||
        { mount --bind "/etc/$f" "$NEWROOT/etc/$f"; mount -o remount,ro,bind "$NEWROOT/etc/$f" 2>/dev/null || true; }
    fi
  fi
done

# /dev: minimal device nodes via bind (mknod is not permitted in userns)
for d in null zero urandom random tty; do
  touch "$NEWROOT/dev/$d"
  mount --bind "/dev/$d" "$NEWROOT/dev/$d"
done
mkdir -p "$NEWROOT/dev/shm"
mount -t tmpfs tmpfs "$NEWROOT/dev/shm"

# claude CLI at its host-absolute path
mkdir -p "$NEWROOT$CLAUDE_GLOBAL"
bind_ro_dir "$CLAUDE_GLOBAL" "$NEWROOT$CLAUDE_GLOBAL"

# workspace (rw) + dependency overlay (upper persisted in SCRATCH/nm-upper)
mount --bind "$WORKDIR" "$NEWROOT/workspace"
mkdir -p "$NEWROOT/workspace/node_modules"
mount -t overlay overlay \
  -o "lowerdir=$LOWERS,upperdir=$SCRATCH/nm-upper,workdir=$SCRATCH/nm-work" \
  "$NEWROOT/workspace/node_modules"

mount --bind "$HOMEDIR" "$NEWROOT/agent-home"
mount -t tmpfs tmpfs "$NEWROOT/tmp"

cd "$NEWROOT"
pivot_root . old-root
# fresh procfs for the new pid namespace, then drop the old root completely
mount -t proc proc /proc
umount -l /old-root
rmdir /old-root 2>/dev/null || true

cd /workspace
export HOME=/agent-home
export TMPDIR=/tmp
export PATH="$CLAUDE_GLOBAL/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
exec "$@"
