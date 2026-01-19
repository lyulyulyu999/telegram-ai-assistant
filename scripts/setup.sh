#!/bin/bash

# ========================================
# Meta Assistant 一键配置脚本
# ========================================

set -e

echo "🍵 Meta Assistant 配置向导"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

echo "📁 项目目录: $PROJECT_DIR"
echo ""

# 检查是否已有配置
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  检测到已有配置文件 .env${NC}"
    read -p "是否覆盖？(y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "保留现有配置，退出。"
        exit 0
    fi
fi

echo ""
echo "📱 步骤 1/4: Telegram Bot Token"
echo "--------------------------------"
echo "请在 Telegram 中找 @BotFather 创建两个 Bot"
echo ""

read -p "请输入 Bot 1 (收集) 的 Token: " INPUT_BOT_TOKEN
if [ -z "$INPUT_BOT_TOKEN" ]; then
    echo -e "${RED}❌ Token 不能为空${NC}"
    exit 1
fi

read -p "请输入 Bot 2 (控制) 的 Token: " OUTPUT_BOT_TOKEN
if [ -z "$OUTPUT_BOT_TOKEN" ]; then
    echo -e "${RED}❌ Token 不能为空${NC}"
    exit 1
fi

echo ""
echo "🔑 步骤 2/4: OpenRouter API Key"
echo "--------------------------------"
echo "请访问 https://openrouter.ai/keys 获取 API Key"
echo ""

read -p "请输入 OpenRouter API Key: " OPENROUTER_API_KEY
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${RED}❌ API Key 不能为空${NC}"
    exit 1
fi

echo ""
echo "🌐 步骤 3/4: HTTPS Webhook URL"
echo "--------------------------------"
echo "Telegram Webhook 需要 HTTPS 地址"
echo ""
echo "获取方式（选择其一）："
echo "  1. localtunnel: npm install -g localtunnel && lt --port 3000"
echo "  2. ngrok: ngrok http 3000"
echo ""
echo "如果你还没有 HTTPS URL，可以先留空，稍后配置"
echo ""

read -p "请输入 HTTPS URL (可留空): " WEBHOOK_URL

echo ""
echo "⚙️  步骤 4/4: 端口配置"
echo "--------------------------------"

read -p "Bot 服务端口 (默认 3000): " BOT_PORT
BOT_PORT=${BOT_PORT:-3000}

read -p "管理后台端口 (默认 3001): " ADMIN_PORT
ADMIN_PORT=${ADMIN_PORT:-3001}

# 写入配置文件
echo ""
echo "📝 正在写入配置..."

cat > "$ENV_FILE" << EOF
# ========================================
# Meta Assistant 配置文件
# 生成时间: $(date)
# ========================================

# Telegram Bot Token
INPUT_BOT_TOKEN=$INPUT_BOT_TOKEN
OUTPUT_BOT_TOKEN=$OUTPUT_BOT_TOKEN

# OpenRouter API Key
OPENROUTER_API_KEY=$OPENROUTER_API_KEY

# Webhook URL
WEBHOOK_URL=$WEBHOOK_URL

# 服务端口
BOT_PORT=$BOT_PORT
ADMIN_PORT=$ADMIN_PORT

# ChromaDB
CHROMA_URL=http://localhost:8000
EOF

echo -e "${GREEN}✅ 配置文件已保存到 .env${NC}"

# 安装依赖
echo ""
echo "📦 正在安装依赖..."

cd "$PROJECT_DIR/bot"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Bot 依赖安装完成${NC}"
fi

cd "$PROJECT_DIR/admin"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Admin 依赖安装完成${NC}"
fi

# 检查 Docker 和 ChromaDB
echo ""
echo "🐳 检查 ChromaDB..."

if command -v docker &> /dev/null; then
    if docker ps -a | grep -q chromadb; then
        echo "ChromaDB 容器已存在"
        docker start chromadb 2>/dev/null || true
    else
        echo "正在启动 ChromaDB..."
        docker run -d --name chromadb -p 8000:8000 chromadb/chroma
    fi
    echo -e "${GREEN}✅ ChromaDB 已就绪${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 Docker，请手动安装并启动 ChromaDB${NC}"
    echo "   docker run -d --name chromadb -p 8000:8000 chromadb/chroma"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 配置完成！${NC}"
echo ""
echo "下一步："

if [ -z "$WEBHOOK_URL" ]; then
    echo "  1. 获取 HTTPS URL:"
    echo "     npm install -g localtunnel && lt --port $BOT_PORT"
    echo ""
    echo "  2. 编辑 .env 填入 WEBHOOK_URL"
    echo ""
    echo "  3. 启动服务:"
else
    echo "  启动服务:"
fi

echo "     ./scripts/start.sh"
echo ""
echo "  或分别启动："
echo "     cd bot && node index.js"
echo "     cd admin && node server.js"
echo ""
