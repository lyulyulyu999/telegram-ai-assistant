#!/bin/bash

# ========================================
# Meta Assistant 停止脚本
# ========================================

echo "🛑 正在停止 Meta Assistant..."

# 停止 Bot 服务
pkill -f "node.*bot.*index.js" 2>/dev/null && echo "✅ Bot 服务已停止" || echo "Bot 服务未运行"

# 停止管理后台
pkill -f "node.*admin.*server.js" 2>/dev/null && echo "✅ 管理后台已停止" || echo "管理后台未运行"

# 可选：停止 ChromaDB
read -p "是否停止 ChromaDB? (y/N): " stop_chroma
if [ "$stop_chroma" = "y" ] || [ "$stop_chroma" = "Y" ]; then
    docker stop chromadb 2>/dev/null && echo "✅ ChromaDB 已停止" || echo "ChromaDB 未运行"
fi

echo ""
echo "🍵 所有服务已停止"
