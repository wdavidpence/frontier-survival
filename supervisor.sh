#!/usr/bin/env bash
set -euo pipefail
# Durable manual entrypoint for one bounded judge pass.
# The supervisor never edits or publishes; it runs the machine scorecard.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
node scorecard.js
