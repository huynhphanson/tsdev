#!/bin/bash

ROOT_DIR=$(pwd)
CONFIG_SRC="$ROOT_DIR/threejs/public/configs"
CONFIG_DEST="$ROOT_DIR/server/public/configs"
DIST_DIR="$ROOT_DIR/threejs/dist"
VIEWER_DEST_BASE="$ROOT_DIR/server/public/viewer"

cd "$ROOT_DIR/threejs"

find "$CONFIG_SRC" -type f -name "*.json" | while read configPath; do
  filename=$(basename "$configPath")
  slug="${filename%.*}"
  client=$(basename $(dirname "$configPath"))
  DEST="$VIEWER_DEST_BASE/$client/$slug"

  # So sánh thời gian file JSON vs thư mục đã build
  if [ -d "$DEST" ] && [ "$configPath" -ot "$DEST" ]; then
    echo "⏭️  Bỏ qua: viewer/$client/$slug đã được build và không thay đổi"
    continue
  fi

  echo "🔧 Building viewer: $client/$slug"

  cp "$configPath" "$CONFIG_SRC/config.json"
  npm run build
  mkdir -p "$DEST"
  cp -r "$DIST_DIR/"* "$DEST"

  echo "✅ Built: $client/$slug"
done

# Xoá config.json tạm
rm -f "$CONFIG_SRC/config.json"

# Cập nhật configs
echo "📦 Sync configs → server/public/configs/"
rm -rf "$CONFIG_DEST"
cp -r "$CONFIG_SRC" "$CONFIG_DEST"

echo "🏁 DONE: Chỉ build mô hình mới hoặc đã chỉnh sửa."
