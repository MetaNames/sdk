#!/usr/bin/env bash
# Fail CI on high (8) or critical (16) advisories in the production dependency
# tree. `yarn audit` ignores `--level` for exit-code purposes and instead
# returns a bitmask of the severities it found:
#
#   1 = info   2 = low   4 = moderate   8 = high   16 = critical
#
# so gating requires masking the code rather than trusting a non-zero exit.
set -uo pipefail

yarn audit --groups dependencies
code=$?

if [ $((code & 24)) -ne 0 ]; then
  echo "::error::High or critical vulnerabilities found in production dependencies (yarn audit bitmask: $code)"
  exit 1
fi

echo "No high or critical vulnerabilities in production dependencies (yarn audit bitmask: $code)"
