# 故障排除指南

本文档记录了部署和使用过程中常见的问题及解决方案。

## 目录

1. [Webhook 相关问题](#webhook-相关问题)
2. [Bot 无响应](#bot-无响应)
3. [ChromaDB 问题](#chromadb-问题)
4. [API 错误](#api-错误)
5. [服务管理](#服务管理)

---

## Webhook 相关问题

### 问题：按钮点击没有反应

**症状**: 在 Bot 2 中点击按钮（如「提示词管理」），没有任何响应。

**原因**: Webhook 的 `allowed_updates` 没有包含 `callback_query`。

**诊断**:
```bash
source .env
curl "https://api.telegram.org/bot$OUTPUT_BOT_TOKEN/getWebhookInfo" | python3 -m json.tool
```

检查 `allowed_updates` 字段，如果只有 `["message"]`，则需要修复。

**解决方案**:
```bash
source .env
curl "https://api.telegram.org/bot$OUTPUT_BOT_TOKEN/setWebhook" \
  -d "url=$WEBHOOK_URL/webhook/output" \
  -d 'allowed_updates=["message","callback_query"]'
```

---

### 问题：Webhook 返回 404 Not Found

**症状**: `getWebhookInfo` 显示 `last_error_message: "Wrong response from the webhook: 404 Not Found"`

**原因**: 
1. Bot 服务没有运行
2. HTTPS 隧道（localtunnel/ngrok）已断开
3. Webhook URL 不正确

**诊断**:
```bash
# 检查 Bot 服务
ps aux | grep "node.*index.js"

# 检查隧道服务
ps aux | grep -E "lt|ngrok"

# 测试本地服务
curl http://localhost:3000
```

**解决方案**:

1. 启动 Bot 服务:
```bash
cd bot && node index.js
```

2. 启动隧道服务:
```bash
# localtunnel
lt --port 3000

# 或 ngrok
ngrok http 3000
```

3. 更新 Webhook URL:
```bash
source .env
curl "https://api.telegram.org/bot$INPUT_BOT_TOKEN/setWebhook" \
  -d "url=新的HTTPS地址/webhook/input" \
  -d 'allowed_updates=["message"]'

curl "https://api.telegram.org/bot$OUTPUT_BOT_TOKEN/setWebhook" \
  -d "url=新的HTTPS地址/webhook/output" \
  -d 'allowed_updates=["message","callback_query"]'
```

---

### 问题：Webhook 设置失败

**症状**: 设置 Webhook 时返回错误

**常见原因**:
- URL 不是 HTTPS
- URL 无法访问
- SSL 证书问题

**解决方案**:
1. 确保使用 HTTPS URL
2. 确保隧道服务正在运行
3. 测试 URL 是否可访问:
```bash
curl -I https://你的URL/
```

---

## Bot 无响应

### 问题：发送消息后没有反应

**诊断步骤**:

1. 检查服务是否运行:
```bash
ps aux | grep node
```

2. 查看服务日志:
```bash
tail -f logs/bot.log
```

3. 检查 Webhook 状态:
```bash
source .env
curl "https://api.telegram.org/bot$INPUT_BOT_TOKEN/getWebhookInfo"
```

4. 检查是否有待处理的更新:
```bash
# pending_update_count > 0 说明消息在队列中
```

**解决方案**:
- 如果服务未运行，启动服务
- 如果有错误日志，根据错误修复
- 如果 Webhook 有错误，参考上面的 Webhook 问题

---

### 问题：Bot 1 收集消息后 Bot 2 没有反馈

**原因**: 
1. `collectFeedback` 设置为 false
2. OpenRouter API 调用失败
3. Bot 2 的 Webhook 未正确设置

**诊断**:
```bash
# 检查管理后台配置
cat admin/data/config.json | grep collectFeedback

# 检查 Bot 2 Webhook
source .env
curl "https://api.telegram.org/bot$OUTPUT_BOT_TOKEN/getWebhookInfo"
```

**解决方案**:
1. 在管理后台开启「收集反馈」
2. 检查 OpenRouter API Key 是否有效
3. 确保 Bot 2 Webhook 正确设置

---

## ChromaDB 问题

### 问题：ChromaDB 连接失败

**症状**: 日志显示 `保存笔记失败` 或连接错误

**诊断**:
```bash
# 检查 Docker 是否运行
docker ps

# 检查 ChromaDB 容器
docker ps -a | grep chroma

# 测试连接
curl http://localhost:8000/api/v1/heartbeat
```

**解决方案**:

1. 启动 Docker（如果未运行）:
```bash
sudo systemctl start docker
```

2. 启动 ChromaDB:
```bash
# 如果容器存在
docker start chromadb

# 如果容器不存在
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

3. 检查端口是否被占用:
```bash
lsof -i :8000
```

---

## API 错误

### 问题：OpenRouter API 返回错误

**常见错误**:

1. **401 Unauthorized**: API Key 无效
   - 检查 `.env` 中的 `OPENROUTER_API_KEY`
   - 在 OpenRouter 网站验证 Key 是否有效

2. **402 Payment Required**: 账户余额不足
   - 在 OpenRouter 充值

3. **429 Too Many Requests**: 请求过于频繁
   - 等待一段时间后重试
   - 考虑使用更快的模型

4. **模型不存在**: 模型 ID 错误
   - 检查模型 ID 格式（如 `anthropic/claude-3-haiku`）
   - 在 OpenRouter 确认模型可用

---

## 服务管理

### 启动所有服务

```bash
./scripts/start.sh
```

### 停止所有服务

```bash
./scripts/stop.sh
```

### 查看日志

```bash
# Bot 日志
tail -f logs/bot.log

# 管理后台日志
tail -f logs/admin.log
```

### 使用 PM2 管理（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start scripts/ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启
pm2 restart all

# 停止
pm2 stop all
```

---

## 防火墙配置

### GCP 防火墙

如果无法从外部访问管理后台：

```bash
gcloud compute firewall-rules create allow-meta-admin \
  --allow tcp:3001 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Meta Assistant Admin Panel"
```

### 本地防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

---

## 获取帮助

如果以上方案都无法解决问题：

1. 查看完整日志
2. 检查所有配置文件
3. 在 GitHub Issues 提交问题，附上：
   - 错误信息
   - 相关日志
   - 操作系统和 Node.js 版本
