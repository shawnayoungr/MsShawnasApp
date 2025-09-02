#!/usr/bin/env bash
# Quick smoke test for PREPOP-only server endpoints
set -euo pipefail
BASE=http://localhost:5177/api/careers/careeronestop
echo "GET /local"
curl -sS ${BASE}/local | jq '.[0] | {keyword: .keyword, onetCode: .onetCode, medianWage: .medianWage}'

echo "GET /search/Computer"
curl -sS ${BASE}/search/Computer | jq '.[0]'

echo "GET /details/Computer"
curl -sS ${BASE}/details/Computer | jq '.onetCode, .onetTitle'

echo "GET /details/onet/15-1252.00"
curl -sS ${BASE}/details/onet/15-1252.00 | jq '.onetCode, .onetTitle, .wages'

echo "GET /salary/Computer"
curl -sS ${BASE}/salary/Computer | jq '.median'

echo "done"
