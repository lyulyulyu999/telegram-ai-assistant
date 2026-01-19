# 贡献指南 | Contributing Guide

[English](#english) | [中文](#中文)

---

## 中文

感谢你对 Telegram AI Assistant 的关注！我们欢迎任何形式的贡献。

### 🚀 快速开始

1. **Fork 项目**
   
   点击页面右上角的 Fork 按钮

2. **克隆到本地**
   ```bash
   git clone https://github.com/你的用户名/telegram-ai-assistant.git
   cd telegram-ai-assistant
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑 .env 填写你的配置
   ```

5. **启动开发环境**
   ```bash
   docker compose up chromadb -d  # 启动 ChromaDB
   npm run dev                     # 启动开发服务器
   ```

### 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型 (type):**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例:**
```bash
git commit -m "feat(bot): 添加语音消息支持"
git commit -m "fix(admin): 修复配置保存失败的问题"
git commit -m "docs: 更新安装指南"
```

### 🔀 Pull Request 流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/你的功能名
   # 或
   git checkout -b fix/修复内容
   ```

2. **开发并测试**
   ```bash
   npm run lint      # 检查代码规范
   npm run test      # 运行测试
   ```

3. **推送分支**
   ```bash
   git push origin feature/你的功能名
   ```

4. **创建 Pull Request**
   - 填写清晰的标题和描述
   - 关联相关的 Issue（如有）
   - 等待 Review

### 🐛 报告 Bug

提交 Issue 时请包含：

1. **环境信息**
   - Node.js 版本
   - 操作系统
   - Docker 版本（如使用）

2. **复现步骤**
   - 详细描述如何触发问题

3. **期望行为**
   - 你认为应该发生什么

4. **实际行为**
   - 实际发生了什么

5. **日志/截图**
   - 相关的错误日志或截图

### 💡 功能建议

我们欢迎新功能建议！提交前请：

1. 先搜索是否已有类似的建议
2. 清楚描述使用场景
3. 说明为什么这个功能有价值

### 📂 项目结构

```
telegram-ai-assistant/
├── packages/
│   ├── bot/          # Telegram Bot
│   │   └── src/
│   │       ├── handlers/   # 消息处理器
│   │       ├── services/   # 业务逻辑
│   │       └── utils/      # 工具函数
│   └── admin/        # Web 管理后台
│       └── src/
├── config/           # 共享配置
├── scripts/          # 部署脚本
└── docs/             # 文档
```

### 🎯 开发重点领域

当前我们特别欢迎以下方面的贡献：

- [ ] 多语言支持 (i18n)
- [ ] 更多 AI 模型支持
- [ ] 语音消息处理
- [ ] 图片 OCR 识别
- [ ] 更好的 RAG 策略
- [ ] 移动端适配

---

## English

Thank you for your interest in Telegram AI Assistant! We welcome all forms of contributions.

### 🚀 Quick Start

1. **Fork the repository**

2. **Clone locally**
   ```bash
   git clone https://github.com/YOUR_USERNAME/telegram-ai-assistant.git
   cd telegram-ai-assistant
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development**
   ```bash
   docker compose up chromadb -d
   npm run dev
   ```

### 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (no functional changes)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Testing
- `chore`: Build/tooling

### 🔀 Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm run test`
4. Push and create a PR

### 📜 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📫 联系方式 | Contact

- GitHub Issues: 提问和 Bug 报告
- Discussions: 功能建议和讨论

感谢你的贡献！🙏
