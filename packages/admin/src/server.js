import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载配置
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const CONFIG_FILE = path.join(__dirname, '../data', 'config.json');
const VERSIONS_DIR = path.join(__dirname, '../data', 'versions');

// 确保目录存在
if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}
if (!fs.existsSync(VERSIONS_DIR)) {
  fs.mkdirSync(VERSIONS_DIR, { recursive: true });
}

// 默认配置
const defaultConfig = {
  botSettings: {
    collectFeedback: true,
    chatEnabled: false,
    webhookUrl: ''
  },
  prompts: {
    collect: {
      name: '信息收集师',
      content: '你是一个信息收集整理师。你知道用户给你的每一条信息背后的意思。你能洞察用户背后的意思。语气陪伴，温柔，鼓励。简短回复，不超过50字。',
      description: '处理用户发送到收集Bot的信息'
    },
    chat: {
      name: 'AI对话助手',
      content: '你是一个智能助手，根据用户的笔记库提供帮助。',
      description: '与用户进行AI对话时使用'
    },
    draft: {
      name: '草稿生成器',
      content: '根据用户的素材库生成社交媒体帖子，风格简洁有力。',
      description: '生成内容草稿时使用'
    },
    summary: {
      name: '摘要生成器',
      content: '将长文本压缩成简洁的摘要，保留核心信息。',
      description: '生成内容摘要时使用'
    }
  },
  models: {
    collect: { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: '快速响应' },
    chat: { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: '日常对话' },
    draft: { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: '创意写作' },
    voice: { id: 'openai/whisper-1', name: 'Whisper', description: '语音转文字' }
  },
  availableModels: [
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', speed: '快', capability: '中' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', speed: '中', capability: '强' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', speed: '快', capability: '中' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', speed: '中', capability: '强' },
    { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', speed: '快', capability: '中' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', speed: '中', capability: '强' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', speed: '慢', capability: '强' }
  ]
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) { console.error('加载配置失败:', e); }
  return { ...defaultConfig };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// 初始化配置
if (!fs.existsSync(CONFIG_FILE)) {
  saveConfig(defaultConfig);
}

// ========================================
// API 路由
// ========================================

// 获取配置
app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

// 更新配置
app.post('/api/config', (req, res) => {
  try {
    saveConfig(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 获取版本列表
app.get('/api/versions', (req, res) => {
  try {
    const files = fs.readdirSync(VERSIONS_DIR).filter(f => f.endsWith('.json'));
    const versions = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(VERSIONS_DIR, f), 'utf8'));
      return { id: f.replace('.json', ''), ...data };
    }).sort((a, b) => b.timestamp - a.timestamp);
    res.json(versions);
  } catch (e) {
    res.json([]);
  }
});

// 保存版本
app.post('/api/versions', (req, res) => {
  const { name, config } = req.body;
  const id = Date.now().toString();
  const version = { name, timestamp: Date.now(), config };
  fs.writeFileSync(path.join(VERSIONS_DIR, `${id}.json`), JSON.stringify(version, null, 2));
  res.json({ success: true, id });
});

// 恢复版本
app.post('/api/versions/:id/restore', (req, res) => {
  try {
    const versionFile = path.join(VERSIONS_DIR, `${req.params.id}.json`);
    const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    saveConfig(version.config);
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ success: false, error: '版本不存在' });
  }
});

// 删除版本
app.delete('/api/versions/:id', (req, res) => {
  try {
    fs.unlinkSync(path.join(VERSIONS_DIR, `${req.params.id}.json`));
    res.json({ success: true });
  } catch (e) {
    res.status(404).json({ success: false });
  }
});

// 导出配置
app.get('/api/export', (req, res) => {
  const config = loadConfig();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=meta-assistant-config.json');
  res.json(config);
});

// 导入配置
app.post('/api/import', (req, res) => {
  try {
    saveConfig(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: '导入失败' });
  }
});

// 启动服务器
const PORT = process.env.ADMIN_PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🍵 Telegram AI Assistant 管理后台');
  console.log('================================');
  console.log('🌐 访问地址: http://localhost:' + PORT);
  console.log('📁 配置文件: ' + CONFIG_FILE);
  console.log('================================');
  console.log('');
});
