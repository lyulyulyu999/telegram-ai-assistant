# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- 项目更名为 Telegram AI Assistant (原 Meta Assistant)
- GitHub 仓库更名为 telegram-ai-assistant

### Added
- Initial open source release preparation
- Docker Compose support for one-click deployment
- Monorepo structure with npm workspaces

### Changed
- Restructured project for better maintainability

### Deprecated

### Removed

### Fixed

### Security

---

## [1.0.0] - 2025-01-XX

### Added
- 📥 **Input Bot**: Silent note collection with AI feedback
- 🎛 **Output Bot**: Control panel with AI chat, search, and draft generation
- 🌐 **Web Admin**: Visual configuration management
- 🔍 **Semantic Search**: ChromaDB-powered vector retrieval
- 🤖 **Multi-model Support**: Claude / GPT / Gemini / Llama via OpenRouter
- 📄 **RAG Drafts**: Generate content based on your knowledge base

### Technical
- Telegram Bot API (Webhook mode)
- ChromaDB for vector storage
- OpenRouter for AI model access
- Express.js backend
- PM2 process management support

---

## Version History Format

Each version entry should include:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security fixes
```

### Commit Message to Changelog Mapping

| Commit Type | Changelog Section |
|-------------|------------------|
| `feat`      | Added            |
| `fix`       | Fixed            |
| `perf`      | Changed          |
| `refactor`  | Changed          |
| `docs`      | (usually omitted)|
| `style`     | (usually omitted)|
| `test`      | (usually omitted)|
| `chore`     | (usually omitted)|
| `security`  | Security         |

---

[Unreleased]: https://github.com/YOUR_USERNAME/telegram-ai-assistant/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_USERNAME/telegram-ai-assistant/releases/tag/v1.0.0
