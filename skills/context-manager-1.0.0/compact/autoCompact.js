/**
 * autoCompact.js - 自动上下文压缩系统
 *
 * 功能：
 * 1. 检查当前会话上下文使用率
 * 2. 生成压缩摘要（调用 DeepSeek LLM）
 * 3. 将摘要写入 memory/ 目录（配合 OpenClaw 内置 memory flush）
 *
 * OpenClaw 压缩机制（内置）：
 * - Pi 运行时在 contextTokens > contextWindow - reserveTokens 时自动触发
 * - memory flush 在软阈值时自动写入记忆
 * - 本脚本作为主动监控层，可在 cron/heartbeat 中调用
 *
 * 用法:
 *   node compact/autoCompact.js --action <check|compact|dry-run|summary> [--session <sessionKey>]
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// ============================
// 配置
// ============================
const CONFIG = {
  COMPACT_THRESHOLD: 180000,       // 触发压缩检查的 token 数
  WARNING_THRESHOLD: 0.85,        // 85% 上下文使用率警告
  CRITICAL_THRESHOLD: 0.90,       // 90% 上下文使用率临界
  COMPACT_TARGET: 40000,          // 压缩后目标 token 数
  PRESERVE_RECENT: 20,           // 保留最近消息数
  COOLDOWN_MS: 60000,             // 冷却期（防止频繁检查）

  // Gateway
  GATEWAY_HOST: 'localhost',
  GATEWAY_PORT: 18789,
  GATEWAY_TOKEN: 'a3e09c327f476ad37e8a5b1e2cda8bbef85b62faf60bd61f',

  // LLM (DeepSeek via litellm compatible API)
  LLM_API_KEY: 'sk-11936f8a91394f5a8c549e6e4ccacf4f',
  LLM_BASE_URL: 'https://api.deepseek.com/v1',
  LLM_MODEL: 'deepseek-chat',

  // 摘要生成提示词
  SUMMARY_PROMPT: `你是一个对话摘要助手。请简洁地总结以下对话的要点。

【要求】
1. 主要讨论话题和结论（2-3句话）
2. 用户的重要偏好和指示
3. 做出的关键决策
4. 未完成的任务或下一步行动
5. 任何需要长期记住的上下文细节

【格式】
- 使用中文
- 总字数控制在 300 字以内
- 分点列出关键信息

【对话内容】
{conversation}

请生成摘要：`
};

// ============================
// Gateway API 调用
// ============================
function gatewayInvoke(tool, args = {}, sessionKey = null) {
  return new Promise((resolve, reject) => {
    const payload = {
      tool,
      action: 'json',
      args: sessionKey ? { ...args, sessionKey } : args
    };
    const data = JSON.stringify(payload);
    const options = {
      hostname: CONFIG.GATEWAY_HOST,
      port: CONFIG.GATEWAY_PORT,
      path: '/tools/invoke',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(body);
          if (r.ok || r.result) resolve(r.result || r);
          else reject(new Error(r.error?.message || JSON.stringify(r.error)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============================
// DeepSeek LLM API 调用
// ============================
function callLLM(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: CONFIG.LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 800,
      temperature: options.temperature || 0.3
    });
    const url = new URL(`${CONFIG.LLM_BASE_URL}/chat/completions`);
    const opts = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LLM_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          if (r.error) reject(new Error(r.error.message));
          else resolve(r.choices?.[0]?.message?.content?.trim() || '[无内容]');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const https = require('https');

// ============================
// Token 估算
// ============================
function estimateTokens(text) {
  if (!text) return 0;
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.match(/[a-zA-Z]/g) || []).length;
  const other = text.length - chinese - english;
  return Math.ceil(chinese / 2 + english / 4 + other / 4);
}

function estimateMessagesTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    if (!msg) continue;
    let content = '';
    if (typeof msg === 'string') content = msg;
    else if (typeof msg.content === 'string') content = msg.content;
    else if (Array.isArray(msg.content)) {
      content = msg.content.map(c => typeof c === 'string' ? c : c.text || '').join(' ');
    }
    total += estimateTokens(content);
  }
  return total;
}

// ============================
// 获取会话状态（解析文本格式）
// ============================
async function getSessionStatus(sessionKey) {
  try {
    const status = await gatewayInvoke('session_status', {}, sessionKey);
    // session_status 返回 result.content[0].text 为文本格式
    let text = '';
    if (status?.content && status.content[0]) {
      const item = status.content[0];
      const raw = item.text || item.content;
      text = typeof raw === 'string' ? raw : (typeof raw === 'object' ? JSON.stringify(raw) : '');
    }

    // 解析 Context: 139k/205k (68%)
    let tokenCount = 0, contextLimit = 200000;
    const ctxMatch = text.match(/Context:\s*([\d.]+)[kK]\/([\d.]+)[kK]\s*\((\d+)%\)/);
    if (ctxMatch) {
      tokenCount = Math.round(parseFloat(ctxMatch[1]) * 1000);
      contextLimit = Math.round(parseFloat(ctxMatch[2]) * 1000);
    }

    // 解析 Compactions: N
    let compactionCount = 0;
    const compMatch = text.match(/Compactions:\s*(\d+)/);
    if (compMatch) compactionCount = parseInt(compMatch[1]);

    return { tokenCount, contextLimit, compactionCount };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================
// 获取会话历史
// ============================
async function getSessionHistory(sessionKey, limit = 500) {
  try {
    const history = await gatewayInvoke('sessions_history', { sessionKey, limit, includeTools: false });
    // 响应结构: result.content[0].text 是 JSON 字符串
    let messages = [];
    if (history?.content && history.content[0]) {
      try {
        const raw = history.content[0].text || history.content[0].content;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        messages = parsed?.messages || [];
      } catch (e) {
        // 解析失败，返回空
      }
    }
    // 过滤并只保留有 role 的消息
    return messages.filter(m => m && m.role);
  } catch (err) {
    return [];
  }
}

// ============================
// 生成压缩摘要
// ============================
async function generateSummary(messages) {
  // 取前 N 条和后 M 条，避免都取最近的
  const toSummarize = messages.slice(0, Math.max(0, messages.length - CONFIG.PRESERVE_RECENT));
  if (toSummarize.length === 0) return null;

  const conversation = toSummarize.map((m, i) => {
    let content = '';
    if (typeof m.content === 'string') content = m.content;
    else if (Array.isArray(m.content)) content = m.content.map(c => c.text || c.content || '').join(' ');
    return `[${i}] ${m.role}: ${content.substring(0, 500)}`;
  }).join('\n\n');

  const prompt = CONFIG.SUMMARY_PROMPT.replace('{conversation}', conversation);

  try {
    const summary = await callLLM(prompt, { maxTokens: 600, temperature: 0.3 });
    return summary;
  } catch (err) {
    return `[摘要生成失败: ${err.message}]`;
  }
}

// ============================
// 保存摘要到记忆文件
// ============================
function saveSummaryToMemory(summary, sessionKey) {
  const today = new Date().toISOString().split('T')[0];
  const memoryDir = path.join(process.env.USERPROFILE || '', '.openclaw/workspace/memory');
  const memFile = path.join(memoryDir, `${today}.md`);

  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  const timestamp = new Date().toLocaleString('zh-CN');
  const sessionNote = sessionKey ? ` (会话: ${sessionKey})` : '';
  const entry = `\n### ${timestamp}${sessionNote} [autoCompact]\n${summary}\n`;

  let header = '';
  if (!fs.existsSync(memFile)) {
    header = `# ${today}\n\n## 对话记录\n`;
  }
  fs.appendFileSync(memFile, header + entry);
  return memFile;
}

// ============================
// Action: check
// ============================
async function actionCheck(sessionKey) {
  const status = await getSessionStatus(sessionKey);
  if (status.error) {
    return { success: false, error: status.error, action: 'check' };
  }

  const { tokenCount, contextLimit } = status;
  const usageRatio = contextLimit > 0 ? tokenCount / contextLimit : 0;
  const shouldCompact = tokenCount >= CONFIG.COMPACT_THRESHOLD;

  let level = 'normal';
  if (usageRatio >= CONFIG.CRITICAL_THRESHOLD) level = 'critical';
  else if (usageRatio >= CONFIG.WARNING_THRESHOLD) level = 'warning';

  return {
    success: true,
    action: 'check',
    level,
    tokenCount,
    contextLimit,
    usagePercent: `${Math.round(usageRatio * 100)}%`,
    shouldCompact,
    threshold: CONFIG.COMPACT_THRESHOLD,
    message: shouldCompact
      ? `Token ${tokenCount} 超过阈值 ${CONFIG.COMPACT_THRESHOLD}，建议执行压缩`
      : `上下文使用率 ${Math.round(usageRatio * 100)}%，状态正常`
  };
}

// ============================
// Action: summary（生成摘要并保存）
// ============================
async function actionSummary(sessionKey) {
  const messages = await getSessionHistory(sessionKey, 500);
  if (messages.length === 0) {
    return { success: false, error: '无会话历史', action: 'summary' };
  }

  const tokens = estimateMessagesTokens(messages);
  const summary = await generateSummary(messages);

  if (!summary) {
    return { success: false, error: '无足够内容需要摘要', action: 'summary' };
  }

  const memFile = saveSummaryToMemory(summary, sessionKey);

  return {
    success: true,
    action: 'summary',
    originalMessages: messages.length,
    originalTokens: tokens,
    summaryLength: estimateTokens(summary),
    summary,
    savedTo: memFile
  };
}

// ============================
// Action: dry-run
// ============================
async function actionDryRun(sessionKey) {
  const messages = await getSessionHistory(sessionKey, 500);
  if (messages.length === 0) {
    return { success: false, error: '无会话历史', action: 'dry-run' };
  }

  const tokens = estimateMessagesTokens(messages);
  const toCompact = messages.slice(0, Math.max(0, messages.length - CONFIG.PRESERVE_RECENT));
  const toKeep = messages.slice(-CONFIG.PRESERVE_RECENT);
  const keepTokens = estimateMessagesTokens(toKeep);

  return {
    success: true,
    action: 'dry-run',
    currentMessages: messages.length,
    currentTokens: tokens,
    tokensToCompact: estimateMessagesTokens(toCompact),
    tokensToKeep: keepTokens,
    preserveRecent: CONFIG.PRESERVE_RECENT,
    compactable: toCompact.length > 0,
    targetTokens: CONFIG.COMPACT_TARGET,
    note: '实际压缩由 OpenClaw Pi 运行时自动执行，此处仅生成摘要报告'
  };
}

// ============================
// Action: compact（触发一次主动摘要保存）
// ============================
async function actionCompact(sessionKey) {
  const result = await actionSummary(sessionKey);
  if (result.success) {
    result.message = `压缩摘要已保存至: ${path.basename(result.savedTo)}`;
    result.openClawNote = 'OpenClaw 会在上下文达到阈值时自动执行正式压缩，此处提前保存摘要';
  }
  return result;
}

// ============================
// 主入口
// ============================
async function main() {
  const args = process.argv.slice(2);
  let action = null;
  let sessionKey = 'agent:main:main';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--action') action = args[++i];
    else if (args[i] === '--session') sessionKey = args[++i];
  }

  if (!action) {
    console.log(JSON.stringify({
      error: 'Missing required: --action <check|compact|dry-run|summary>',
      usage: 'node compact/autoCompact.js --action <check|compact|dry-run|summary> [--session <sessionKey>]',
      config: {
        COMPACT_THRESHOLD: CONFIG.COMPACT_THRESHOLD,
        WARNING_THRESHOLD: `${Math.round(CONFIG.WARNING_THRESHOLD * 100)}%`,
        CRITICAL_THRESHOLD: `${Math.round(CONFIG.CRITICAL_THRESHOLD * 100)}%`,
        PRESERVE_RECENT: CONFIG.PRESERVE_RECENT
      }
    }, null, 2));
    process.exit(1);
  }

  let result;
  try {
    switch (action) {
      case 'check':    result = await actionCheck(sessionKey); break;
      case 'summary':   result = await actionSummary(sessionKey); break;
      case 'dry-run':   result = await actionDryRun(sessionKey); break;
      case 'compact':   result = await actionCompact(sessionKey); break;
      default:          result = { success: false, error: `Unknown action: ${action}` };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  console.log(JSON.stringify(result, null, 2));

  if (!result.success && !result.level) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
