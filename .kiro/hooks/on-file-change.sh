#!/bin/bash
# Kiro Hook: Auto-run tests on source file changes
# Trigger: File save in app.js, style.css, or tests/test.js
# Format: kiro-cli 3.5.0 native hook syntax
#
# Usage:
#   This hook automatically runs the Node test suite whenever a source file
#   under the project changes. Results are reported in the Kiro session.
#
# Installation:
#   This file should be placed at .kiro/hooks/on-file-change.sh
#   Kiro will detect and trigger this hook on file save events.

set -e

# Get the workspace root (Kiro provides this)
WORKSPACE_ROOT="${WORKSPACE_ROOT:-.}"
TEST_FILE="${WORKSPACE_ROOT}/tests/test.js"

# Only proceed if test file exists
if [ ! -f "$TEST_FILE" ]; then
  echo "Test file not found at $TEST_FILE. Skipping test run."
  exit 0
fi

# Run tests and capture output
echo "🧪 Running test suite..."
echo ""

if node "$TEST_FILE"; then
  echo ""
  echo "✅ All tests passed!"
  exit 0
else
  echo ""
  echo "❌ Tests failed. Review the output above for details."
  exit 1
fi
