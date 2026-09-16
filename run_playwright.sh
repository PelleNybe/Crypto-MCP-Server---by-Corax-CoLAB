#!/bin/bash
cd gui/frontend && pnpm run dev &
DEV_PID=$!
sleep 5
pnpm test
TEST_EXIT_CODE=$?
kill $DEV_PID
exit $TEST_EXIT_CODE
