#!/usr/bin/env bash
# One-time setup in a fresh session. Safe to re-run.
set -e
cd "$(dirname "$0")"
pip install --break-system-packages -q kokoro-onnx soundfile scipy playwright >/dev/null 2>&1 || true
(cd engine/reel && npm ci --silent >/dev/null 2>&1 || npm install --silent >/dev/null 2>&1)
python3 -c "import kokoro_onnx, soundfile, scipy, playwright; print('python deps ok')"
ls engine/reel/node_modules/three/build/three.module.js >/dev/null && echo "node deps ok"
