# 升级指南 | Upgrade Guide

## 从旧版本升级到 1.0.0

本版本对项目结构进行了标准化重构，采用 monorepo 架构。

### 主要变更

1. **目录结构变更**
   ```
   旧版本:
   telegram-ai-assistant/
   ├── bot/
   │   └── index.js
   └── admin/
       └── server.js
   
   新版本:
   telegram-ai-assistant/
   ├── packages/
   │   ├── bot/
   │   │   └── src/index.js
   │   └── admin/
   │       └── src/server.js
   └── package.json (root workspace)
   ```

2. **依赖管理**
   - 采用 npm workspaces
   - 根目录统一管理依赖版本

3. **Docker 支持**
   - 新增 `docker-compose.yml`
   - 新增 multi-stage Dockerfile

### 升级步骤

#### 方式一：直接使用新版本（推荐）

```bash
# 1. 备份数据
cp -r data data.backup
cp -r admin/data admin_data.backup

# 2. 克隆新版本
git clone https://github.com/你的用户名/telegram-ai-assistant.git telegram-ai-assistant-new
cd telegram-ai-assistant-new

# 3. 复制配置和数据
cp ../telegram-ai-assistant-old/.env .
cp -r ../data ./
cp -r ../admin_data.backup ./packages/admin/data

# 4. 安装依赖
npm install

# 5. 启动服务
npm start
```

#### 方式二：使用 Docker（推荐生产环境）

```bash
# 1. 准备配置
cp .env.example .env
# 编辑 .env

# 2. 复制数据（如果有）
cp -r ../telegram-ai-assistant-old/data ./
cp -r ../telegram-ai-assistant-old/admin/data ./packages/admin/

# 3. 启动
docker compose up -d
```

### 配置文件变更

无需变更，`.env` 文件格式保持兼容。

### 数据迁移

**无需迁移**！数据文件位置不变：
- 用户配置：`data/user_config.json`
- 管理后台配置：`packages/admin/data/config.json`
- ChromaDB 向量数据：保持原有 Docker volume

### 验证升级

```bash
# 检查服务状态
curl http://localhost:3000
curl http://localhost:3001/api/config

# 查看日志
npm run docker:logs
# 或
pm2 logs
```

### 回滚

如遇问题可以回滚到旧版本：

```bash
# 1. 停止新版本
docker compose down
# 或
pm2 stop all

# 2. 恢复数据
cp -r data.backup data
cp -r admin_data.backup admin/data

# 3. 启动旧版本
cd ../telegram-ai-assistant-old
./scripts/start.sh
```

### 常见问题

**Q: 升级后提示找不到模块？**

A: 重新安装依赖
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: ChromaDB 数据丢失？**

A: 检查 Docker volume
```bash
docker volume ls
docker volume inspect telegram-ai-assistant-chroma
```

**Q: Web 管理后台无法访问？**

A: 检查端口和路径
```bash
# 确认 admin 服务运行
curl http://localhost:3001/api/config
```

### 新功能

- ✅ Docker Compose 一键部署
- ✅ 完整的开源文档（CONTRIBUTING.md, CODE_OF_CONDUCT.md）
- ✅ GitHub Actions CI/CD
- ✅ 更清晰的项目结构
- ✅ 统一的依赖管理

### 获取帮助

- GitHub Issues: https://github.com/你的用户名/telegram-ai-assistant/issues
- 文档: https://github.com/你的用户名/telegram-ai-assistant/tree/main/docs
