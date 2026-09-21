#!/bin/sh
set -e

# Bring the schema up to date; a no-op when there is nothing to apply.
node node_modules/prisma/build/index.js migrate deploy

# Demo data. The seed skips tables that already contain rows, so this is safe on every start.
if [ "$RUN_SEED" = "true" ]; then
  node dist/database/seed.js
fi

exec node dist/server.js
