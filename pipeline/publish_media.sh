#!/usr/bin/env bash
# Publish a day's media folder to the `media` branch (served by GitHub Pages).
# Keeps freebies/ and the last KEEP_DAYS dated folders; rewrites branch history each time so the repo never bloats.
# usage: pipeline/publish_media.sh SITE_DIR DATE   (SITE_DIR/DATE must exist)
set -euo pipefail
SITE="$(cd "$1" && pwd)"; DATE="$2"; KEEP_DAYS="${KEEP_DAYS:-3}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="$(git -C "$REPO_DIR" remote get-url origin)"
WORK="$(mktemp -d)"
git clone -q --depth 1 --branch media "$REMOTE" "$WORK/m"
cd "$WORK/m"
# prune old dated folders
cutoff=$(date -u -d "-${KEEP_DAYS} days" +%Y-%m-%d)
for d in 20??-??-??; do [ -d "$d" ] && [[ "$d" < "$cutoff" ]] && rm -rf "$d"; done
rm -rf "$DATE" && cp -r "$SITE/$DATE" "$DATE"
touch .nojekyll
git checkout -q --orphan rebuilt
git add -A
git -c user.name="ClayByte Autopilot" -c user.email="sakshamsharma7845@gmail.com" commit -q -m "media $DATE"
git push -q -f origin rebuilt:media
echo "pushed media/$DATE; Pages redeploys in ~1-2 min"
rm -rf "$WORK"
