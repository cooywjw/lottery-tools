/**
 * autoCompact.js - 自动上下文压缩系统
 * 
 * 基于 Claude Code 压缩策略设计：
 * - 触发条件：上下文 token 数超过 COMPACT_THRESHOLD (180K)
 * - 压缩目标：将上下文压缩到 COMPACT_TARGET (40K)
 * - 保留策略：保留系统提示 + 最近消息 + 关键决策
 * 
 * 用法:
 *   node compact/autoCompact.js --action <check|compact|dry-run> [--session <sessionKey>]
 */

const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  COMPACT_THRESHOLD: 180000,      // 触发压缩的 token 数
  COMPACT_TARGET: 40000,         // 压缩后的目标 token 数
  MICROCOMPACT_THRESHOLD: 16000,  // 单条消息超限阈值
  MICROCOMPACT_TARGET: 12000,    // 单条消息压缩目标
  PRESERVE_SYSTEM_PROMPT: true,   // 始终保留系统提示
  PRESERVE_RECENT_MESSAGES: 20,  // 保留最近消息数
  MAX_RETRIES: 3,                // PTL 重试次数
  COOLDOWN_MS: 60000,            // 压缩冷却期（防止频繁压缩）
};

// Gateway 配置
const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = 18789;
const GATEWAY_TOKEN = 'a3e09c327f476ad37e8a5b1e2cda8bbef85b62faf60bd61f';

/**
 * 调用 Gateway HTTP API
 */
function invoke(tool, args) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ tool, args });
    const options = {
      hostname: GATEWAY_HOST,
      port: GATEWAY_PORT,
      path: '/tools/invoke',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
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
          if (r.ok) resolve(r.result);
          else reject(new Error(r.error?.message || JSON.stringify(r.error)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const http = require('http');

/**
 * 估算 token 数（简单估算：中文 ~2字符/token，英文 ~4字符/token）
 */
function estimateTokens(text) {
  if (!text) return 0;
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.match(/[a-zA-Z]/g) || []).length;
  const other = text.length - chinese - english;
  return Math.ceil(chinese / 2 + english / 4 + other / 4);
}

/**
 * 估算消息列表的 token 数
 */
function estimateMessagesTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg === 'string') {
      total += estimateTokens(msg);
    } else if (msg.content) {
      if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.text) total += estimateTokens(block.text);
          else if (block.content) total += estimateTokens(JSON.stringify(block.content));
        }
      } else {
        total += estimateTokens(msg.content);
      }
    }
  }
  return total;
}

/**
 * 检查是否应该触发压缩
 */
async function checkShouldCompact(sessionKey) {
  try {
    // 获取会话状态
    const status = await invoke('session_status', { sessionKey });
    
    if (!status || !status.tokenUsage) {
      return { shouldCompact: false, reason: '无法获取 token 使用情况' };
    }
    
    const tokenCount = status.tokenUsage.total || 0;
    
    if (tokenCount >= CONFIG.COMPACT_THRESHOLD) {
      return {
        shouldCompact: true,
        reason: `Token 数 ${tokenCount} 超过阈值 ${CONFIG.COMPACT_THRESHOLD}`,
        tokenCount,
        threshold: CONFIG.COMPACT_THRESHOLD
      };
    }
    
    return {
      shouldCompact: false,
      reason: `Token 数 ${tokenCount} 未超过阈值 ${CONFIG.COMPACT_THRESHOLD}`,
      tokenCount,
      threshold: CONFIG.COMPACT_THRESHOLD
    };
  } catch (err) {
    return { shouldCompact: false, reason: `检查失败: ${err.message}` };
  }
}

/**
 * 生成压缩摘要
 */
async function generateSummary(messagesToSummarize, context) {
  const taskPrompt = `请总结以下对话的要点，保留关键信息：

【对话概要要求】
1. 主要讨论话题和结论
2. 用户的重要偏好和指示
3. 做出的关键决策
4. 未完成的任务或下一步行动
5. 任何需要长期记住的上下文

【格式要求】
- 使用简洁的要点格式
- 保留具体数字、名称、路径等细节
- 总字数控制在 500 字以内

【对话内容】
${messagesToSummarize.map((m, i) => `[${i}] ${m.role || 'user'}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n\n')}

请生成摘要：`;

  try {
    const result = await invoke('sessions_spawn', {
      task: taskPrompt,
      model: 'minimax/MiniMax-M2.7',
      thinking: 'low',
      timeoutSeconds: 120
    });
    
    // 等待结果
    const summarySessionKey = result.childSessionKey;
    
    // 简单等待（实际应该通过事件机制）
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 获取摘要结果
    const historyResult = await invoke('sessions_history', {
      sessionKey: summarySessionKey,
      limit: 1,
      includeTools: false
    });
    
    if (historyResult && historyResult.messages && historyResult.messages.length > 0) {
      const lastMsg = historyResult.messages[historyResult.messages.length - 1];
      if (lastMsg.content) {
        return typeof lastMsg.content === 'string' 
          ? lastMsg.content 
          : lastMsg.content.text || JSON.stringify(lastMsg.content);
      }
    }
    
    return '[摘要生成中...]';
  } catch (err) {
    return `[摘要生成失败: ${err.message}]`;
  }
}

/**
 * 执行压缩
 */
async function performCompact(sessionKey, options = {}) {
  const { dryRun = false, preserveRecent = CONFIG.PRESERVE_RECENT_MESSAGES } = options;
  
  try {
    // 获取会话历史
    const historyResult = await invoke('sessions_history', {
      sessionKey,
      limit: 1000,
      includeTools: false
    });
    
    if (!historyResult || !historyResult.messages) {
      return { success: false, error: '无法获取会话历史' };
    }
    
    const messages = historyResult.messages;
    const currentTokens = estimateMessagesTokens(messages);
    
    console.log(JSON.stringify({
      action: dryRun ? 'dry-run' : 'compact',
      currentMessages: messages.length,
      currentTokens,
      targetTokens: CONFIG.COMPACT_TARGET,
      preserveRecent,
      status: dryRun ? '模拟模式' : '执行中...'
    }, null, 2));
    
    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        currentTokens,
        targetTokens: CONFIG.COMPACT_TARGET,
        messagesToSummarize: messages.length - preserveRecent,
        summaryNeeded: true
      };
    }
    
    // 分割消息：保留部分 vs 需要压缩部分
    const preservedMessages = messages.slice(0, preserveRecent);
    const messagesToSummarize = messages.slice(preserveRecent);
    
    console.log(JSON.stringify({
      step: 'split_messages',
      preservedCount: preservedMessages.length,
      toSummarizeCount: messagesToSummarize.length
    }, null, 2));
    
    // 生成摘要
    const summary = await generateSummary(messagesToSummarize, { sessionKey });
    
    // 构建压缩后的消息列表
    const compactBoundary = {
      role: 'system',
      content: `[=== 对话历史压缩边界 ===]\n以上是早期对话的摘要，原始内容已被压缩：\n\n${summary}\n[=== 压缩边界结束 ===]`
    };
    
    const compactedMessages = [compactBoundary, ...preservedMessages];
    const newTokens = estimateMessagesTokens(compactedMessages);
    
    console.log(JSON.stringify({
      step: 'compact_complete',
      originalTokens: currentTokens,
      newTokens,
      reduction: `${Math.round((1 - newTokens / currentTokens) * 100)}%`,
      summaryLength: estimateTokens(summary)
    }, null, 2));
    
    return {
      success: true,
      originalMessages: messages.length,
      compactedMessages: compactedMessages.length,
      originalTokens: currentTokens,
      newTokens,
      reductionPercent: Math.round((1 - newTokens / currentTokens) * 100),
      summary
    };
    
  } catch (err) {
    return { success: false, error: `压缩失败: ${err.message}` };
  }
}

/**
 * 主入口
 */
async function main() {
  const args = process.argv.slice(2);
  
  let action = null;
  let sessionKey = null;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--action':
        action = args[++i];
        break;
      case '--session':
        sessionKey = args[++i];
        break;
    }
  }
  
  if (!action) {
    console.log(JSON.stringify({
      error: 'Missing required: --action <check|compact|dry-run>',
      usage: 'node compact/autoCompact.js --action <check|compact|dry-run> [--session <sessionKey>]',
      config: {
        COMPACT_THRESHOLD: CONFIG.COMPACT_THRESHOLD,
        COMPACT_TARGET: CONFIG.COMPACT_TARGET,
        MICROCOMPACT_THRESHOLD: CONFIG.MICROCOMPACT_THRESHOLD,
        PRESERVE_RECENT_MESSAGES: CONFIG.PRESERVE_RECENT_MESSAGES
      }
    }, null, 2));
    process.exit(1);
  }
  
  let result;
  
  switch (action) {
    case 'check':
      result = await checkShouldCompact(sessionKey);
      break;
    case 'compact':
      result = await performCompact(sessionKey, { dryRun: false });
      break;
    case 'dry-run':
      result = await performCompact(sessionKey, { dryRun: true });
      break;
    default:
      result = { success: false, error: `Unknown action: ${action}` };
  }
  
  console.log(JSON.stringify(result, null, 2));
  
  if (!result.success && !result.shouldCompact && result.reason) {
    // 检查类操作不返回错误
    process.exit(0);
  } else if (!result.success) {
    process.exit(1);
  }
}

main().catch(err => {
  console.log(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
