#!/usr/bin/env bash
# Fail CI on high or critical advisories in the production dependency tree.
# `pnpm audit` exits non-zero only when it finds advisories at or above
# `--audit-level`, so its exit code can be trusted directly.
set -euo pipefail

pnpm audit --prod --audit-level high

echo "No high or critical vulnerabilities in production dependencies"
