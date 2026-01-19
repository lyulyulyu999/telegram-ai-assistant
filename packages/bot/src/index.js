import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载配置
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const app = express();
app.use(express.json());

const INPUT_BOT_TOKEN = process.env.INPUT_BOT_TOKEN;
const OUTPUT_BOT_TOKEN = process.env.OUTPUT_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BOT_PORT = process.env.BOT_PORT || 3000;
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

// ========================================
// 管理后台配置集成
// ========================================
const ADMIN_CONFIG_FILE = path.join(__dirname, '../../admin/data/config.json');

function getAdminConfig() {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('读取管理后台配置失败:', e.message);
  }
  return null;
}

// 用户配置
const CONFIG_DIR = path.join(__dirname, '../../../data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'user_config.json');
let userConfigs = {};

function loadConfigs() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      userConfigs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) { userConfigs = {}; }
}

function saveConfigs() {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(userConfigs, null, 2));
  } catch (e) { console.error('保存失败', e); }
}

function getConfig(userId) {
  const adminConfig = getAdminConfig();
  if (!userConfigs[userId]) {
    const defaultPrompts = adminConfig && adminConfig.prompts ? {
      '信息收集师': adminConfig.prompts.collect?.content || '你是一个信息收集整理师。',
      'AI对话助手': adminConfig.prompts.chat?.content || '你是一个智能助手。',
      '草稿生成器': adminConfig.prompts.draft?.content || '根据素材生成社交媒体帖子。'
    } : {
      '默认助理': '你是一个简洁高效的生活助理。'
    };
    const defaultModel = adminConfig?.models?.chat?.id || 'anthropic/claude-3-haiku';
    userConfigs[userId] = {
      prompts: defaultPrompts,
      activePrompt: Object.keys(defaultPrompts)[0],
      model: defaultModel,
      chatEnabled: adminConfig?.botSettings?.chatEnabled || false
    };
    saveConfigs();
  }
  return userConfigs[userId];
}

function getCollectConfig() {
  const adminConfig = getAdminConfig();
  return {
    prompt: adminConfig?.prompts?.collect?.content || '你是一个信息收集整理师。你知道用户给你的每一条信息背后的意思。你能洞察用户背后的意思。语气陪伴，温柔，鼓励。简短回复，不超过50字。',
    model: adminConfig?.models?.collect?.id || 'anthropic/claude-3-haiku',
    enabled: adminConfig?.botSettings?.collectFeedback ?? true
  };
}

function getDraftConfig() {
  const adminConfig = getAdminConfig();
  return {
    prompt: adminConfig?.prompts?.draft?.content || '根据用户的素材库生成社交媒体帖子，风格简洁有力。',
    model: adminConfig?.models?.draft?.id || 'openai/gpt-4o-mini'
  };
}

loadConfigs();

// 初始化 Bot（Webhook 模式）
const inputBot = new TelegramBot(INPUT_BOT_TOKEN);
const outputBot = new TelegramBot(OUTPUT_BOT_TOKEN);

const chroma = new ChromaClient({ path: CHROMA_URL });
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
});

// ========================================
// ChromaDB 操作
// ========================================
async function saveNote(content, userId) {
  try {
    const collection = await chroma.getOrCreateCollection({ name: 'notes' });
    await collection.add({
      ids: [`${Date.now()}`],
      documents: [content],
      metadatas: [{ userId: String(userId), ts: new Date().toISOString() }]
    });
    return true;
  } catch (e) { 
    console.error('保存笔记失败:', e.message);
    return false; 
  }
}

async function searchNotes(query, userId, limit = 5) {
  try {
    const collection = await chroma.getOrCreateCollection({ name: 'notes' });
    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where: { userId: String(userId) }
    });
    return results.documents[0] || [];
  } catch (e) { return []; }
}

async function getNoteCount(userId) {
  try {
    const collection = await chroma.getOrCreateCollection({ name: 'notes' });
    const all = await collection.get({ where: { userId: String(userId) } });
    return all.ids.length;
  } catch (e) { return 0; }
}

// ========================================
// AI 功能
// ========================================
async function chat(userId, message) {
  const config = getConfig(userId);
  const notes = await searchNotes(message, userId);
  const promptText = config.prompts[config.activePrompt] || '你是一个助理。';
  let systemContent = promptText;
  if (notes.length > 0) {
    systemContent += '\n\n参考资料：\n' + notes.join('\n');
  }
  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: message }
      ],
      max_tokens: 1500
    });
    return response.choices[0].message.content;
  } catch (e) {
    return '错误: ' + e.message;
  }
}

async function collectFeedback(content) {
  const collectConfig = getCollectConfig();
  try {
    const response = await openai.chat.completions.create({
      model: collectConfig.model,
      messages: [
        { role: 'system', content: collectConfig.prompt },
        { role: 'user', content: content }
      ],
      max_tokens: 200
    });
    return response.choices[0].message.content;
  } catch (e) {
    console.error('收集反馈错误:', e.message);
    return null;
  }
}

// 用户状态
const userStates = {};

// 主菜单键盘
function getMainKeyboard(userId) {
  const config = getConfig(userId);
  const chatStatus = config.chatEnabled ? '🟢 开' : '🔴 关';
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 提示词管理', callback_data: 'prompt_menu' }],
        [{ text: '🤖 切换模型', callback_data: 'model_menu' }],
        [{ text: '💬 AI对话 ' + chatStatus, callback_data: 'toggle_chat' }],
        [{ text: '🔍 搜索', callback_data: 'do_search' }, { text: '📄 草稿', callback_data: 'do_draft' }],
        [{ text: '📊 统计', callback_data: 'show_stats' }]
      ]
    }
  };
}

// ========================================
// 处理 1号 Bot 消息（收集信息）
// ========================================
async function handleInputBot(update) {
  const msg = update.message;
  if (!msg) return;
  
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  if (text === '/start') {
    await inputBot.sendMessage(chatId, '📥 直接发送内容，静默保存。\n\n发送 /stats 查看统计');
  } else if (text === '/stats') {
    const count = await getNoteCount(chatId);
    await inputBot.sendMessage(chatId, '📊 已收集 ' + count + ' 条笔记');
  } else if (text && !text.startsWith('/')) {
    const saved = await saveNote(text, chatId);
    const collectConfig = getCollectConfig();
    if (saved && collectConfig.enabled) {
      const feedback = await collectFeedback(text);
      if (feedback) {
        await outputBot.sendMessage(chatId, '📝 已收到你的笔记\n\n' + feedback);
      } else {
        await outputBot.sendMessage(chatId, '📝 已收到你的笔记');
      }
    }
  }
}

// ========================================
// 处理 2号 Bot 消息和回调
// ========================================
async function handleOutputBot(update) {
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const data = query.data;
    const config = getConfig(chatId);
    
    console.log('收到回调:', data);
    
    try {
      await outputBot.answerCallbackQuery(query.id);
      
      if (data === 'back_main') {
        const text = '🎛 控制台\n\n' +
          '提示词：' + config.activePrompt + '\n' +
          '模型：' + config.model.split('/')[1] + '\n' +
          'AI对话：' + (config.chatEnabled ? '开启' : '关闭');
        await outputBot.sendMessage(chatId, text, getMainKeyboard(chatId));
      }
      
      else if (data === 'prompt_menu') {
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              ...Object.keys(config.prompts).map(name => {
                const mark = name === config.activePrompt ? '✓ ' : '';
                return [{ text: mark + name, callback_data: 'p_use_' + name }];
              }),
              [{ text: '➕ 新建', callback_data: 'p_new' }],
              [{ text: '✏️ 编辑当前', callback_data: 'p_edit' }],
              [{ text: '🗑 删除当前', callback_data: 'p_del' }],
              [{ text: '« 返回', callback_data: 'back_main' }]
            ]
          }
        };
        await outputBot.sendMessage(chatId, '📝 提示词管理\n\n当前：' + config.activePrompt + '\n\n内容：\n' + config.prompts[config.activePrompt], keyboard);
      }
      
      else if (data.startsWith('p_use_')) {
        const name = data.replace('p_use_', '');
        config.activePrompt = name;
        saveConfigs();
        await outputBot.sendMessage(chatId, '✓ 已切换到：' + name);
      }
      
      else if (data === 'p_new') {
        userStates[chatId] = 'new_name';
        await outputBot.sendMessage(chatId, '请输入新提示词的名称：');
      }
      
      else if (data === 'p_edit') {
        userStates[chatId] = 'edit';
        await outputBot.sendMessage(chatId, '当前内容：\n\n' + config.prompts[config.activePrompt] + '\n\n请输入新内容：');
      }
      
      else if (data === 'p_del') {
        if (Object.keys(config.prompts).length <= 1) {
          await outputBot.sendMessage(chatId, '❌ 至少保留一个提示词');
        } else {
          const name = config.activePrompt;
          delete config.prompts[name];
          config.activePrompt = Object.keys(config.prompts)[0];
          saveConfigs();
          await outputBot.sendMessage(chatId, '✓ 已删除：' + name);
        }
      }
      
      else if (data === 'model_menu') {
        const adminConfig = getAdminConfig();
        const models = adminConfig?.availableModels?.map(m => [m.id, m.name]) || [
          ['anthropic/claude-3-haiku', 'Claude 3 Haiku (快)'],
          ['anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet (强)'],
          ['openai/gpt-4o-mini', 'GPT-4o Mini'],
          ['google/gemini-flash-1.5', 'Gemini 1.5 Flash'],
          ['meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B']
        ];
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              ...models.map(([id, name]) => {
                const mark = id === config.model ? '✓ ' : '';
                return [{ text: mark + name, callback_data: 'm_' + id }];
              }),
              [{ text: '« 返回', callback_data: 'back_main' }]
            ]
          }
        };
        await outputBot.sendMessage(chatId, '🤖 选择模型\n\n当前：' + config.model, keyboard);
      }
      
      else if (data.startsWith('m_')) {
        const model = data.replace('m_', '');
        config.model = model;
        saveConfigs();
        await outputBot.sendMessage(chatId, '✓ 模型已切换为：' + model.split('/')[1]);
      }
      
      else if (data === 'toggle_chat') {
        config.chatEnabled = !config.chatEnabled;
        saveConfigs();
        await outputBot.sendMessage(chatId, '💬 AI对话已' + (config.chatEnabled ? '开启' : '关闭'));
      }
      
      else if (data === 'do_search') {
        userStates[chatId] = 'search';
        await outputBot.sendMessage(chatId, '🔍 请输入搜索关键词：');
      }
      
      else if (data === 'do_draft') {
        userStates[chatId] = 'draft';
        await outputBot.sendMessage(chatId, '📄 请输入草稿主题：');
      }
      
      else if (data === 'show_stats') {
        const count = await getNoteCount(chatId);
        await outputBot.sendMessage(chatId, '📊 统计\n\n笔记数量：' + count + ' 条');
      }
      
    } catch (err) {
      console.error('回调处理错误:', err);
    }
    return;
  }
  
  const msg = update.message;
  if (!msg || !msg.text) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates[chatId];
  const config = getConfig(chatId);
  
  if (text === '/start' || text === '/menu') {
    const statusText = '🎛 控制台\n\n' +
      '提示词：' + config.activePrompt + '\n' +
      '模型：' + config.model.split('/')[1] + '\n' +
      'AI对话：' + (config.chatEnabled ? '开启' : '关闭');
    await outputBot.sendMessage(chatId, statusText, getMainKeyboard(chatId));
    return;
  }
  
  if (state === 'search') {
    userStates[chatId] = null;
    const notes = await searchNotes(text, chatId, 5);
    if (notes.length === 0) {
      await outputBot.sendMessage(chatId, '未找到相关笔记');
    } else {
      const result = notes.map((n, i) => (i+1) + '. ' + n.substring(0, 100)).join('\n\n');
      await outputBot.sendMessage(chatId, '🔍 结果：\n\n' + result);
    }
    return;
  }
  
  if (state === 'draft') {
    userStates[chatId] = null;
    await outputBot.sendMessage(chatId, '⏳ 生成中...');
    const notes = await searchNotes(text, chatId, 10);
    const draftConfig = getDraftConfig();
    try {
      const response = await openai.chat.completions.create({
        model: draftConfig.model,
        messages: [
          { role: 'system', content: draftConfig.prompt },
          { role: 'user', content: '主题：' + text + '\n素材：' + (notes.join('\n') || '无') }
        ],
        max_tokens: 1000
      });
      await outputBot.sendMessage(chatId, response.choices[0].message.content);
    } catch (e) {
      await outputBot.sendMessage(chatId, '错误: ' + e.message);
    }
    return;
  }
  
  if (state === 'new_name') {
    userStates[chatId] = { step: 'new_content', name: text };
    await outputBot.sendMessage(chatId, '请输入「' + text + '」的提示词内容：');
    return;
  }
  
  if (state && state.step === 'new_content') {
    config.prompts[state.name] = text;
    config.activePrompt = state.name;
    saveConfigs();
    userStates[chatId] = null;
    await outputBot.sendMessage(chatId, '✓ 已创建：' + state.name);
    return;
  }
  
  if (state === 'edit') {
    config.prompts[config.activePrompt] = text;
    saveConfigs();
    userStates[chatId] = null;
    await outputBot.sendMessage(chatId, '✓ 已更新');
    return;
  }
  
  if (config.chatEnabled) {
    const response = await chat(chatId, text);
    await outputBot.sendMessage(chatId, response);
  }
}

// ========================================
// Webhook 路由
// ========================================
app.post('/webhook/input', (req, res) => {
  console.log('收到 Input Bot 更新');
  handleInputBot(req.body);
  res.sendStatus(200);
});

app.post('/webhook/output', (req, res) => {
  console.log('收到 Output Bot 更新');
  handleOutputBot(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  mode: 'webhook',
  service: 'Telegram AI Assistant Bot'
}));

// ========================================
// 设置 Webhook
// ========================================
async function setupWebhooks() {
  if (!WEBHOOK_URL) {
    console.warn('⚠️  WEBHOOK_URL 未配置，请设置后重启');
    console.log('提示：使用 localtunnel 或 ngrok 获取 HTTPS URL');
    return;
  }
  
  try {
    await inputBot.setWebHook(WEBHOOK_URL + '/webhook/input', {
      allowed_updates: ['message']
    });
    console.log('✅ Input Bot Webhook 已设置');
    
    await outputBot.setWebHook(WEBHOOK_URL + '/webhook/output', {
      allowed_updates: ['message', 'callback_query']
    });
    console.log('✅ Output Bot Webhook 已设置');
    
  } catch (err) {
    console.error('❌ 设置 Webhook 失败:', err.message);
  }
}

// 启动服务器
app.listen(BOT_PORT, async () => {
  console.log('');
  console.log('🍵 Telegram AI Assistant Bot');
  console.log('================================');
  console.log('🚀 服务运行在端口 ' + BOT_PORT);
  console.log('📊 管理后台配置: ' + ADMIN_CONFIG_FILE);
  console.log('🗄️  ChromaDB: ' + CHROMA_URL);
  console.log('');
  await setupWebhooks();
  console.log('================================');
  console.log('');
});
