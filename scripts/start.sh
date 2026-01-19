#!/bin/bash

# ========================================
# Meta Assistant 启动脚本
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🍵 Meta Assistant 启动中..."
echo "================================"
echo ""

# 检查配置文件
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}❌ 未找到配置文件 .env${NC}"
    echo "请先运行: ./scripts/setup.sh"
    exit 1
fi

# 加载配置
source "$PROJECT_DIR/.env"

# 检查必要配置
if [ -z "$INPUT_BOT_TOKEN" ] || [ -z "$OUTPUT_BOT_TOKEN" ]; then
    echo -e "${RED}❌ Bot Token 未配置${NC}"
    exit 1
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${RED}❌ OpenRouter API Key 未配置${NC}"
    exit 1
fi

# 设置默认端口
BOT_PORT=${BOT_PORT:-3000}
ADMIN_PORT=${ADMIN_PORT:-3001}

# 停止已有进程
echo "🛑 停止已有进程..."
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
sleep 1

# 启动 ChromaDB
echo ""
echo "🐳 检查 ChromaDB..."
if command -v docker &> /dev/null; then
    if docker ps | grep -q chromadb; then
        echo -e "${GREEN}✅ ChromaDB 已运行${NC}"
    else
        docker start chromadb 2>/dev/null || docker run -d --name chromadb -p 8000:8000 chromadb/chroma
        echo -e "${GREEN}✅ ChromaDB 已启动${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker 未安装，请确保 ChromaDB 已运行${NC}"
fi

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

# 启动管理后台
echo ""
echo "🌐 启动管理后台..."
cd "$PROJECT_DIR/admin"
nohup node server.js > "$PROJECT_DIR/logs/admin.log" 2>&1 &
ADMIN_PID=$!
echo -e "${GREEN}✅ 管理后台已启动 (PID: $ADMIN_PID)${NC}"

# 启动 Bot 服务
echo ""
echo "🤖 启动 Bot 服务..."
cd "$PROJECT_DIR/bot"
nohup node index.js > "$PROJECT_DIR/logs/bot.log" 2>&1 &
BOT_PID=$!
echo -e "${GREEN}✅ Bot 服务已启动 (PID: $BOT_PID)${NC}"

# 等待服务启动
sleep 2

# 检查服务状态
echo ""
echo "📊 服务状态检查..."

# 检查 Bot 服务
if curl -s "http://localhost:$BOT_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bot 服务运行正常 (端口 $BOT_PORT)${NC}"
else
    echo -e "${YELLOW}⚠️  Bot 服务可能还在启动中...${NC}"
fi

# 检查管理后台
if curl -s "http://localhost:$ADMIN_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 管理后台运行正常 (端口 $ADMIN_PORT)${NC}"
else
    echo -e "${YELLOW}⚠️  管理后台可能还在启动中...${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 启动完成！${NC}"
echo ""
echo "📱 Bot 服务: http://localhost:$BOT_PORT"
echo "🌐 管理后台: http://localhost:$ADMIN_PORT"
echo ""

if [ -z "$WEBHOOK_URL" ]; then
    echo -e "${YELLOW}⚠️  WEBHOOK_URL 未配置${NC}"
    echo ""
    echo "请执行以下步骤："
    echo "  1. 启动 HTTPS 隧道:"
    echo "     npm install -g localtunnel && lt --port $BOT_PORT"
    echo ""
    echo "  2. 复制 HTTPS URL 并更新 Webhook:"
    echo "     source .env"
    echo "     curl \"https://api.telegram.org/bot\$INPUT_BOT_TOKEN/setWebhook\" \\"
    echo "       -d \"url=你的HTTPS地址/webhook/input\" \\"
    echo "       -d 'allowed_updates=[\"message\"]'"
    echo ""
    echo "     curl \"https://api.telegram.org/bot\$OUTPUT_BOT_TOKEN/setWebhook\" \\"
    echo "       -d \"url=你的HTTPS地址/webhook/output\" \\"
    echo "       -d 'allowed_updates=[\"message\",\"callback_query\"]'"
else
    echo "Webhook URL: $WEBHOOK_URL"
fi

echo ""
echo "📋 查看日志:"
echo "   Bot:   tail -f logs/bot.log"
echo "   Admin: tail -f logs/admin.log"
echo ""
echo "🛑 停止服务: ./scripts/stop.sh"
echo ""
