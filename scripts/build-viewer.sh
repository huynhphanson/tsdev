#!/bin/bash

# Cố định đường dẫn (giả sử bạn đang ở thư mục TSDEV)
ROOT_DIR=$(pwd)

echo "➡️  [1/4] Build viewer tại threejs/"
cd "$ROOT_DIR/threejs"
npm install
npm run build

echo "🧹  [2/4] Xoá thư mục _viewer cũ trong server/public/"
rm -rf "$ROOT_DIR/server/public/_viewer"

echo "📦  [3/4] Copy viewer mới sang server"
cp -r "$ROOT_DIR/threejs/dist" "$ROOT_DIR/server/public/_viewer"

echo "✅  [4/4] Hoàn tất đồng bộ viewer!"
