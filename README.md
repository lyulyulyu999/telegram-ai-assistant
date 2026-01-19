# 🍵 Meta Assistant

**你的第二大脑 - 随时随地捕捉灵感，AI 帮你整理思绪**

---

## ✨ 功能

| 发送内容 | 自动处理 |
|---------|---------|
| 📝 文字 | AI 分类 + 打标签 |
| 🔗 链接 | 自动摘要（开发中） |
| 🎙️ 语音 | 转文字（开发中） |

**示例：**
```
你发送：今天想到一个产品创意，用 AI 整理笔记

Bot 回复：
📂 分类：灵感
🏷️ 标签：#产品 #AI #创意
💬 很棒的想法！已帮你记录~
```

---

## 🚀 3 分钟部署

### 1. 准备 Key（2 分钟）

**创建 2 个 Telegram Bot：**
1. 打开 Telegram，搜索 `@BotFather`
2. 发送 `/newbot`，按提示创建，复制 Token
3. 重复一次，创建第二个 Bot

**获取 AI Key：**
1. 打开 https://openrouter.ai
2. 注册 → Keys → 创建 → 复制

### 2. 部署（1 分钟）

```bash
git clone https://github.com/lyulyulyu999/metaassistant.git
cd metaassistant
cp .env.example .env
nano .env
```

粘贴你的 3 个 Key：
```
INPUT_BOT_TOKEN=第一个Bot的Token
OUTPUT_BOT_TOKEN=第二个Bot的Token
OPENROUTER_API_KEY=OpenRouter的Key
```

启动：
```bash
./scripts/start.sh
```

### 3. 开始使用

- **Bot 1**：发任何内容 → 自动保存并分类
- **Bot 2**：发 `/start` → 打开控制台
- **管理后台**：`http://你的IP:3001`

---

## 📖 更多文档

| 文档 | 说明 |
|------|------|
| [功能介绍](docs/FEATURES.md) | 详细功能说明 |
| [使用教程](docs/USAGE.md) | 如何使用 |
| [配置说明](docs/CONFIG.md) | 自定义设置 |
| [故障排除](docs/TROUBLESHOOTING.md) | 常见问题 |

---

## 📄 License

MIT

**⭐ 如果觉得有用，请给个 Star！**
