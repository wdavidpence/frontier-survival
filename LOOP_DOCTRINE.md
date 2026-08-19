# Coastal Expedition Sprint Loop

Hermes owns the judge and release gate. Workers implement bounded slices in isolated worktrees and never publish.

Each pass is: inspect exact worktree -> verify diff scope -> run syntax/smoke/diff/parity/cache checks -> serve exact artifact -> Start/runtime/console probe -> ordinary fixed-seed screenshot -> accept or reject -> update STATE.json.

Accepted slices are synthesized into a clean release candidate. Publication remains separate from implementation, runtime verification, visual acceptance, remote push, and live Pages verification. A worker summary, smoke pass, or HTTP 200 is not visual proof.

The canonical dirty checkout is quarantined. Never reset, clean, or overwrite it. Keep hot-file ownership serialized and reject indistinguishable, darker, black/gray, noisy, or HUD-obscuring frames.
