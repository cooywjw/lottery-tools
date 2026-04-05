/**
 * workflow-engine.js - 工作流引擎
 *
 * 串联散落的工具，变成自动流水线。
 *
 * 用户说一句话，引擎解析意图 → 匹配工作流 → 按步执行 → 产出结果。
 *
 * @version 0.1.0
 */

// ============================
// 内置工具引用（直接 require）
// ============================
const https = require('https');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ============================
// 配置
// ============================
const CONFIG = {
  // Gateway
  GATEWAY_HOST: 'localhost',
  GATEWAY_PORT: 18789,
  GATEWAY_TOKEN: 'a3e09c327f476ad37e8a5b1e2cda8bbef85b62faf60bd61f',

  // DeepSeek (摘要生成)
  DEEPSEEK_KEY: 'sk-11936f8a91394f5a8c549e6e4ccacf4f',

  // 工具路径
  TAVIY_SEARCH: path.join(__dirname, '..', 'tavily-search', 'tavily-search.js'),
  TianshuwanImg: path.join(__dirname, '..', 'tianshu-wan-video', 'scripts', 'generate_image.js'),
  WatermarkPy: path.join(__dirname, '..', 'tianshu-wan-video', 'scripts', 'add_watermark.py'),
  WechatPubPy: path.join(__dirname, '..', 'wechat-publisher', 'scripts', 'publisher.py'),
  AutoCompact: path.join(__dirname, '..', 'context-manager-1.0.0', 'compact', 'autoCompact.js'),
};

// ============================
// Gateway API
// ============================
function gatewayInvoke(tool, args) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ tool, action: 'json', args });
    const opts = {
      hostname: CONFIG.GATEWAY_HOST, port: CONFIG.GATEWAY_PORT,
      path: '/tools/invoke', method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.GATEWAY_TOKEN}`,
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(opts, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => {
        try { const r = JSON.parse(b); resolve(r.result || r); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

// ============================
// HTTP GET 工具（通用）
// ============================
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname, port: 443, path: parsed.pathname + parsed.search,
      method: 'GET', headers
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    });
    req.on('error', reject);
    req.end();
  });
}

// ============================
// DeepSeek LLM
// ============================
function callLLM(prompt, model = 'deepseek-chat', maxTokens = 800) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model, messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens, temperature: 0.3
    });
    const req = https.request({
      hostname: 'api.deepseek.com', port: 443, path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.DEEPSEEK_KEY}`,
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(b);
          resolve(r.choices?.[0]?.message?.content?.trim() || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

// ============================
// Node child_process（异步）
// ============================
const { exec: nodeExec } = require('child_process');
function execAsync(cmd, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${cmd.substring(0, 50)}`)), timeoutMs);
    nodeExec(cmd, { timeout: timeoutMs, shell: true }, (err, stdout, stderr) => {
      clearTimeout(timer);
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

// ============================
// 步骤执行器
// ============================

/**
 * 执行单个步骤，返回 { success, data, error }
 */
async function executeStep(step, context) {
  const { tool, params } = step;
  const p = typeof params === 'function' ? params(context) : params;

  try {
    switch (tool) {
      // ---- 搜索 ----
      case 'tavily_search': {
        const result = await gatewayInvoke('web_search', {
          query: p.query,
          depth: p.depth || 'basic',
          max_results: p.max_results || 5
        });
        // 解析嵌套结果
        const output = result?.data || result;
        return { success: true, data: output };
      }

      // ---- 上下文检查 ----
      case 'context_check': {
        const r = await gatewayInvoke('session_status', {});
        const text = r?.content?.[0]?.text || r?.content?.[0]?.content || '';
        const m = text.match(/Context:\s*([\d.]+)[kK]\/([\d.]+)[kK]\s*\((\d+)%\)/);
        if (!m) return { success: true, data: { level: 'unknown' } };
        const tokenCount = Math.round(parseFloat(m[1]) * 1000);
        const contextLimit = Math.round(parseFloat(m[2]) * 1000);
        const usage = parseInt(m[3]);
        return {
          success: true,
          data: { tokenCount, contextLimit, usage, level: usage >= 90 ? 'critical' : usage >= 85 ? 'warning' : 'normal' }
        };
      }

      // ---- 自动压缩摘要 ----
      case 'context_compact': {
        const r = await gatewayInvoke('session_status', {});
        const text = r?.content?.[0]?.text || r?.content?.[0]?.content || '';
        const m = text.match(/Context:\s*([\d.]+)[kK]\/([\d.]+)[kK]\s*\((\d+)%\)/);
        if (!m) return { success: false, error: '无法获取上下文状态' };
        const tokenCount = Math.round(parseFloat(m[1]) * 1000);
        if (tokenCount < 100000) {
          return { success: true, data: { skipped: true, reason: `仅 ${tokenCount} tokens，无需压缩` } };
        }
        const r2 = await execAsync(`node "${CONFIG.AutoCompact}" --action summary`);
        const parsed = JSON.parse(r2);
        return { success: parsed.success, data: parsed };
      }

      // ---- 生图（通义万相） ----
      case 'tianshuwan_image': {
        const outputPath = p.output || `D:\\work\\media\\wechat\\${Date.now()}_cover.png`;
        const size = p.size || '960*1696';
        const cmd = `node "${CONFIG.TianshuwanImg}" --prompt ${JSON.stringify(p.prompt)} --model wan2.6-t2i --output "${outputPath}" --size ${size}`;
        const r = await execAsync(cmd, 60000);
        const saved = r.match(/savedTo["\s:]+([^\n]+)/)?.[1]?.trim() || outputPath;
        return { success: true, data: { path: saved.replace(/"/g, ''), prompt: p.prompt } };
      }

      // ---- 添加水印 ----
      case 'add_watermark': {
        const outputPath = p.output || p.image.replace('.png', '_wm.png');
        const r = await execAsync(`py -3.12 "${CONFIG.WatermarkPy}" "${p.image}" --output "${outputPath}"`, 30000);
        return { success: true, data: { original: p.image, watermarked: outputPath } };
      }

      // ---- 生成文章摘要（LLM） ----
      case 'llm_summary': {
        const summary = await callLLM(
          `请把以下足球资讯整理成一段简洁的中文文章摘要，100字以内，适合作为公众号文章开头：\n\n${p.content}`,
          'deepseek-chat', 300
        );
        return { success: true, data: { summary } };
      }

      // ---- 发布公众号 ----
      case 'wechat_publish': {
        // 动态加载 publisher
        const pubScript = `
import sys
sys.path.insert(0, ${JSON.stringify(path.dirname(CONFIG.WechatPubPy))})
import importlib.util
spec = importlib.util.spec_from_file_location("publisher", ${JSON.stringify(CONFIG.WechatPubPy)})
pub = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pub)
WeChatPublisher = pub.WeChatPublisher

with open(${JSON.stringify(p.html_path)}, 'r', encoding='utf-8') as f:
    content = f.read()

p2 = WeChatPublisher()
thumb_id = ""
if ${JSON.stringify(p.cover_path)}:
    r2 = p2.upload_image(${JSON.stringify(p.cover_path)})
    thumb_id = r2 if isinstance(r2, str) else r2.get('media_id', '')
result = p2.create_draft(
    title=${JSON.stringify(p.title)},
    content=content,
    author="绿茵有运",
    thumb_media_id=thumb_id,
    digest=${JSON.stringify(p.digest || '')},
    content_base_dir=${JSON.stringify(path.dirname(p.html_path))}
)
print(result.get('media_id', ''))
        `;
        const mediaId = await execAsync(`py -3.12 -c "${pubScript.replace(/"/g, '\\"')}"`, 60000);
        const mid = mediaId.trim();
        return { success: !!mid, data: { media_id: mid } };
      }

      // ---- 保存到记忆文件 ----
      case 'save_memory': {
        const today = new Date().toISOString().split('T')[0];
        const memDir = path.join(process.env.USERPROFILE || '', '.openclaw/workspace/memory');
        const memFile = path.join(memDir, `${today}.md`);
        if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
        const entry = `\n### ${new Date().toLocaleString('zh-CN')} [workflow]\n${p.content}\n`;
        if (!fs.existsSync(memFile)) {
          fs.writeFileSync(memFile, `# ${today}\n\n## 对话记录\n${entry}`);
        } else {
          fs.appendFileSync(memFile, entry);
        }
        return { success: true, data: { file: memFile } };
      }

      default:
        return { success: false, error: `未知工具: ${tool}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================
// 工作流定义
// ============================
const WORKFLOWS = {
  // 场景1：搜足球新闻 → 发公众号
  'search_and_publish': {
    name: '搜足球资讯并发布公众号',
    description: '搜索足球相关新闻，整理成文章，排版后发布到公众号草稿箱',
    triggers: ['搜', '新闻', '资讯', '发布', '发公众号', '发到公众号'],
    steps: [
      {
        tool: 'tavily_search',
        params: (ctx) => ({ query: ctx.userInput.match(/搜[看查]*(.+)/)?.[1] || ctx.userInput, depth: 'basic', max_results: 5 }),
        capture: 'searchResults'
      },
      {
        tool: 'llm_summary',
        params: (ctx) => ({
          content: (ctx.searchResults?.results || []).map(r => `【${r.title}】${r.content}`).join('\n\n')
        }),
        capture: 'articleSummary'
      },
      {
        tool: 'tianshuwan_image',
        params: { prompt: '专业体育媒体封面，深蓝色背景，足球在画面中心，上方金色装饰线，现代简洁风格，无实际文字', size: '960*1696', output: 'D:\\work\\media\\wechat\\workflow_cover.png' },
        capture: 'coverImage'
      },
      {
        tool: 'add_watermark',
        params: (ctx) => ({ image: ctx.coverImage?.path, output: ctx.coverImage?.path.replace('.png', '_wm.png') }),
        capture: 'watermarkedCover'
      },
    ]
  },

  // 场景2：检查上下文，超阈值就压缩
  'context_monitor': {
    name: '上下文监控与压缩',
    description: '检查当前上下文使用率，如果过高则自动生成摘要保存',
    triggers: ['检查上下文', '上下文', '压缩', 'context'],
    steps: [
      { tool: 'context_check', params: {}, capture: 'ctxStatus' },
      { tool: 'context_compact', params: {}, capture: 'compactResult' },
    ]
  },

  // 场景3：生图（通用）
  'generate_image': {
    name: '生图',
    description: '根据描述生成图片',
    triggers: ['生成图片', '生图', '封面图'],
    steps: [
      {
        tool: 'tianshuwan_image',
        params: (ctx) => {
          const prompt = ctx.userInput.replace(/生成图片|生图|封面图/gi, '').trim();
          return { prompt: prompt || '专业图片', size: '960*1696', output: `D:\\work\\media\\wechat\\${Date.now()}.png` };
        },
        capture: 'image'
      }
    ]
  },
};

// ============================
// 意图路由：匹配用户输入 → 工作流
// ============================
function matchWorkflow(userInput) {
  const lower = userInput.toLowerCase();
  for (const [id, wf] of Object.entries(WORKFLOWS)) {
    if (wf.triggers.some(t => lower.includes(t))) return id;
  }
  return null;
}

// ============================
// 工作流执行器
// ============================
async function runWorkflow(workflowId, userInput, onProgress) {
  const wf = WORKFLOWS[workflowId];
  if (!wf) return { success: false, error: `未知工作流: ${workflowId}` };

  const context = { userInput, steps: [] };

  if (onProgress) onProgress({ type: 'start', message: `启动工作流: ${wf.name}`, workflow: workflowId });

  for (let i = 0; i < wf.steps.length; i++) {
    const step = wf.steps[i];
    if (onProgress) onProgress({ type: 'step', step: i + 1, total: wf.steps.length, tool: step.tool, message: `执行步骤 ${i + 1}/${wf.steps.length}: ${step.tool}` });

    const result = await executeStep(step, context);
    context.steps.push({ tool: step.tool, ...result });

    if (step.capture) context[step.capture] = result.data;

    if (!result.success) {
      return { success: false, error: result.error, step: i + 1, tool: step.tool };
    }

    if (onProgress) onProgress({ type: 'step_done', step: i + 1, tool: step.tool, result: result.data });
  }

  return { success: true, workflow: workflowId, name: wf.name, context };
}

// ============================
// CLI / 入口
// ============================
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--workflow') {
    const workflowId = args[1];
    const userInput = args.slice(2).join(' ') || '搜今天足球新闻发公众号';

    runWorkflow(workflowId, userInput, p => {
      if (p.type === 'start') console.log(`\n[${p.message}]`);
      else if (p.type === 'step') process.stdout.write(`\n  步骤 ${p.step}/${p.total}: ${p.tool}... `);
      else if (p.type === 'step_done') console.log('✓');
      else if (p.type === 'error') console.error(`\n  错误: ${p.error}`);
    }).then(r => {
      console.log('\n' + JSON.stringify(r, null, 2));
      process.exit(r.success ? 0 : 1);
    }).catch(e => { console.error(e.message); process.exit(1); });

  } else if (args[0] === '--list') {
    console.log('\n可用工作流:');
    for (const [id, wf] of Object.entries(WORKFLOWS)) {
      console.log(`  ${id}: ${wf.name}`);
      console.log(`    触发词: ${wf.triggers.join(', ')}`);
      console.log(`    步骤: ${wf.steps.map(s => s.tool).join(' → ')}`);
    }
    process.exit(0);

  } else if (args[0] === '--route') {
    const matched = matchWorkflow(args.slice(1).join(' '));
    console.log(matched ? `匹配工作流: ${matched}` : '未匹配到工作流');

  } else {
    console.log('用法:');
    console.log('  --list                      列出所有工作流');
    console.log('  --route <text>              测试意图路由');
    console.log('  --workflow <id> <text>      执行指定工作流');
    process.exit(0);
  }
}

module.exports = { runWorkflow, matchWorkflow, WORKFLOWS, executeStep };
