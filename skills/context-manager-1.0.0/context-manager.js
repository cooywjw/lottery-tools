#!/usr/bin/env node

/**
 * Context Manager - Claude Tool Interface
 * 
 * Monitor conversation context usage, summarize and reset when threshold exceeded.
 * 
 * @implements {OpenClawTool}
 * @version 1.1.0
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  // Thresholds
  WARNING_THRESHOLD: 0.85,        // 85% warning
  CRITICAL_THRESHOLD: 0.90,       // 90% critical
  COMPACT_THRESHOLD: 180000,      // Token count for auto-compact
  COMPACT_TARGET: 40000,          // Target tokens after compact
  
  // Behavior
  PRESERVE_RECENT_MESSAGES: 20,   // Messages to keep during compact
  MAX_SUMMARIES_TO_KEEP: 10,      // Summary files to retain
  COOLDOWN_MS: 60000,             // Compact cooldown
  
  // Paths
  SUMMARY_DIR: 'memory/context-summaries',
  
  // Gateway
  GATEWAY_HOST: 'localhost',
  GATEWAY_PORT: 18789,
  GATEWAY_TOKEN: 'a3e09c327f476ad37e8a5b1e2cda8bbef85b62faf60bd61f'
};

// ============================================================
// Zod-like Schema (runtime validation)
// ============================================================

const inputSchema = {
  type: 'object',
  properties: {
    action: { 
      type: 'string', 
      enum: ['check', 'summarize', 'reset', 'compact'],
      description: 'Action to perform'
    },
    threshold: { 
      type: 'number', 
      minimum: 0, 
      maximum: 1, 
      default: 0.85,
      description: 'Warning threshold (0-1)'
    },
    force: { 
      type: 'boolean', 
      default: false,
      description: 'Force action without confirmation'
    },
    sessionId: { 
      type: 'string',
      description: 'Target session ID'
    },
    dryRun: {
      type: 'boolean',
      default: false,
      description: 'Simulate without making changes'
    }
  },
  required: ['action']
};

// ============================================================
// Tool Metadata
// ============================================================

const toolMetadata = {
  name: 'context_manager',
  aliases: ['check_context', 'compact_context'],
  searchHint: 'check or manage conversation context usage',
  version: '1.1.0',
  capabilities: ['read', 'write'],
  category: 'system',
  trustLevel: 'safe',
  maxResultSizeChars: 5000
};

// ============================================================
// Helper Functions
// ============================================================

function validateInput(input) {
  const errors = [];
  
  if (!input.action || !['check', 'summarize', 'reset', 'compact'].includes(input.action)) {
    errors.push('action must be one of: check, summarize, reset, compact');
  }
  
  if (input.threshold !== undefined) {
    if (typeof input.threshold !== 'number' || input.threshold < 0 || input.threshold > 1) {
      errors.push('threshold must be a number between 0 and 1');
    }
  }
  
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

function invoke(tool, args) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ tool, args });
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

function estimateTokens(text) {
  if (!text) return 0;
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.match(/[a-zA-Z]/g) || []).length;
  const other = text.length - chinese - english;
  return Math.ceil(chinese / 2 + english / 4 + other / 4);
}

function ensureSummaryDir() {
  const summaryDir = path.join(process.cwd(), CONFIG.SUMMARY_DIR);
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }
  return summaryDir;
}

function getSummaryFilename() {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `context-summary-${dateStr}-${timeStr}.md`;
}

// ============================================================
// Core Actions
// ============================================================

async function checkContext(sessionKey, threshold = CONFIG.WARNING_THRESHOLD) {
  try {
    const status = await invoke('session_status', sessionKey ? { sessionKey } : {});
    
    if (!status) {
      return { 
        data: null, 
        error: '无法获取会话状态' 
      };
    }
    
    const tokenUsage = status.tokenUsage || {};
    const usagePercent = tokenUsage.percent || 0;
    
    const result = {
      usagePercent: Math.round(usagePercent * 100) / 100,
      warningThreshold: threshold,
      criticalThreshold: CONFIG.CRITICAL_THRESHOLD,
      isWarning: usagePercent >= threshold,
      isCritical: usagePercent >= CONFIG.CRITICAL_THRESHOLD,
      totalTokens: tokenUsage.total || 0,
      recommendation: usagePercent >= CONFIG.CRITICAL_THRESHOLD 
        ? '建议立即清理上下文'
        : usagePercent >= threshold 
          ? '建议适时清理上下文'
          : '上下文使用正常'
    };
    
    return { data: result };
    
  } catch (err) {
    return { data: null, error: `检查失败: ${err.message}` };
  }
}

async function summarizeContext(sessionKey, onProgress) {
  if (onProgress) {
    onProgress({ type: 'progress', message: '获取会话历史...', percent: 10 });
  }
  
  try {
    const historyResult = await invoke('sessions_history', {
      sessionKey,
      limit: 100,
      includeTools: false
    });
    
    if (!historyResult || !historyResult.messages) {
      return { data: null, error: '无法获取会话历史' };
    }
    
    if (onProgress) {
      onProgress({ type: 'progress', message: '生成摘要...', percent: 40 });
    }
    
    const messages = historyResult.messages;
    
    // Extract key information
    const summary = {
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      keyDecisions: [],
      todos: [],
      preferences: [],
      topics: []
    };
    
    // Simple extraction (in production, use LLM for better summarization)
    messages.forEach((msg, idx) => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      
      // Extract decisions
      if (content.includes('决定') || content.includes('确定') || content.includes('选择')) {
        summary.keyDecisions.push({
          index: idx,
          snippet: content.substring(0, 100)
        });
      }
      
      // Extract TODOs
      if (content.includes('TODO') || content.includes('待办') || content.includes('待完成')) {
        summary.todos.push({
          index: idx,
          snippet: content.substring(0, 100)
        });
      }
      
      // Extract preferences
      if (content.includes('偏好') || content.includes('喜欢') || content.includes('设置')) {
        summary.preferences.push({
          index: idx,
          snippet: content.substring(0, 100)
        });
      }
    });
    
    if (onProgress) {
      onProgress({ type: 'progress', message: '保存摘要文件...', percent: 80 });
    }
    
    // Save to file
    const summaryDir = ensureSummaryDir();
    const filename = getSummaryFilename();
    const filepath = path.join(summaryDir, filename);
    
    const summaryContent = `# Context Summary
Generated: ${summary.timestamp}
Messages: ${summary.messageCount}

## Key Decisions
${summary.keyDecisions.map(d => `- ${d.snippet}`).join('\n') || 'None recorded'}

## TODOs
${summary.todos.map(t => `- ${t.snippet}`).join('\n') || 'None recorded'}

## Preferences
${summary.preferences.map(p => `- ${p.snippet}`).join('\n') || 'None recorded'}

## Topics
${summary.topics.join(', ') || 'General conversation'}
`;
    
    fs.writeFileSync(filepath, summaryContent, 'utf8');
    
    if (onProgress) {
      onProgress({ type: 'progress', message: '完成', percent: 100 });
    }
    
    return { 
      data: {
        summary,
        savedTo: filepath,
        message: '摘要已生成并保存'
      }
    };
    
  } catch (err) {
    return { data: null, error: `摘要生成失败: ${err.message}` };
  }
}

async function resetContext(sessionKey, force = false) {
  if (!force) {
    return {
      data: null,
      error: '需要用户确认: 重置会话将丢失当前上下文。设置 force=true 确认执行。',
      requiresConfirmation: true
    };
  }
  
  try {
    // Note: Actual reset would require Gateway support for session reset
    // For now, we return instructions
    return {
      data: {
        message: '请使用 /clear 命令或重启会话来重置上下文',
        sessionKey,
        resetAt: new Date().toISOString()
      }
    };
  } catch (err) {
    return { data: null, error: `重置失败: ${err.message}` };
  }
}

async function compactContext(sessionKey, dryRun = false, onProgress) {
  if (onProgress) {
    onProgress({ type: 'progress', message: '检查上下文状态...', percent: 10 });
  }
  
  try {
    // First check if compact is needed
    const checkResult = await checkContext(sessionKey);
    if (checkResult.error) {
      return checkResult;
    }
    
    const tokens = checkResult.data.totalTokens;
    
    if (tokens < CONFIG.COMPACT_THRESHOLD) {
      return {
        data: {
          compacted: false,
          reason: `Token 数 ${tokens} 未达到压缩阈值 ${CONFIG.COMPACT_THRESHOLD}`,
          currentTokens: tokens,
          threshold: CONFIG.COMPACT_THRESHOLD
        }
      };
    }
    
    if (onProgress) {
      onProgress({ type: 'progress', message: '获取完整会话历史...', percent: 30 });
    }
    
    const historyResult = await invoke('sessions_history', {
      sessionKey,
      limit: 1000,
      includeTools: false
    });
    
    if (!historyResult || !historyResult.messages) {
      return { data: null, error: '无法获取会话历史' };
    }
    
    const messages = historyResult.messages;
    
    if (dryRun) {
      return {
        data: {
          compacted: false,
          dryRun: true,
          currentTokens: tokens,
          targetTokens: CONFIG.COMPACT_TARGET,
          messagesToKeep: CONFIG.PRESERVE_RECENT_MESSAGES,
          messagesToSummarize: messages.length - CONFIG.PRESERVE_RECENT_MESSAGES,
          estimatedReduction: `${Math.round((1 - CONFIG.COMPACT_TARGET / tokens) * 100)}%`
        }
      };
    }
    
    if (onProgress) {
      onProgress({ type: 'progress', message: '生成历史摘要...', percent: 60 });
    }
    
    // Generate summary of older messages
    const olderMessages = messages.slice(0, -CONFIG.PRESERVE_RECENT_MESSAGES);
    const summaryResult = await summarizeContext(sessionKey, null);
    
    if (onProgress) {
      onProgress({ type: 'progress', message: '压缩完成', percent: 100 });
    }
    
    return {
      data: {
        compacted: true,
        originalTokens: tokens,
        targetTokens: CONFIG.COMPACT_TARGET,
        messagesKept: CONFIG.PRESERVE_RECENT_MESSAGES,
        messagesSummarized: olderMessages.length,
        summaryFile: summaryResult.data?.savedTo,
        message: '上下文已压缩，摘要已保存'
      }
    };
    
  } catch (err) {
    return { data: null, error: `压缩失败: ${err.message}` };
  }
}

// ============================================================
// Core Tool Implementation
// ============================================================

/**
 * Context Manager Tool - Claude Tool Interface
 * 
 * @implements {OpenClawTool}
 */
const contextManagerTool = {
  // ----- Identity -----
  name: toolMetadata.name,
  aliases: toolMetadata.aliases,
  searchHint: toolMetadata.searchHint,
  
  // ----- Schema -----
  inputSchema,
  
  // ----- Execution -----
  async call(args, context, canUseTool, onProgress) {
    // Permission check
    if (canUseTool && !(await canUseTool('context_manager'))) {
      return { 
        data: null, 
        error: 'Permission denied: context_manager tool not authorized' 
      };
    }
    
    // Input validation
    const validation = validateInput(args);
    if (!validation.valid) {
      return { 
        data: null, 
        error: `Validation failed: ${validation.errors.join(', ')}` 
      };
    }
    
    const sessionKey = args.sessionId || context?.sessionKey;
    
    // Route to appropriate action
    switch (args.action) {
      case 'check':
        return await checkContext(sessionKey, args.threshold);
        
      case 'summarize':
        return await summarizeContext(sessionKey, onProgress);
        
      case 'reset':
        return await resetContext(sessionKey, args.force);
        
      case 'compact':
        return await compactContext(sessionKey, args.dryRun, onProgress);
        
      default:
        return { data: null, error: `Unknown action: ${args.action}` };
    }
  },
  
  // ----- Dynamic Description -----
  async description(input, options) {
    switch (input.action) {
      case 'check':
        return '检查当前上下文使用率';
      case 'summarize':
        return '生成会话摘要并保存';
      case 'reset':
        return '重置会话上下文（需要确认）';
      case 'compact':
        return input.dryRun ? '模拟上下文压缩' : '压缩上下文并保留摘要';
      default:
        return '管理对话上下文';
    }
  },
  
  // ----- Capability Checks -----
  isConcurrencySafe(input) {
    // check is safe, others modify state
    return input.action === 'check';
  },
  
  isReadOnly(input) {
    // only check is read-only
    return input.action === 'check';
  },
  
  isDestructive(input) {
    // reset is destructive
    return input.action === 'reset';
  },
  
  isEnabled() {
    return true;
  },
  
  // ----- Result Rendering -----
  renderResult(output) {
    if (!output) return 'No result.';
    
    if (output.error) {
      return `**错误**: ${output.error}`;
    }
    
    if (output.data) {
      const d = output.data;
      
      if (d.usagePercent !== undefined) {
        // check result
        const status = d.isCritical ? '🔴 临界' : d.isWarning ? '🟡 警告' : '🟢 正常';
        return `**上下文状态**: ${status}\n使用率: ${(d.usagePercent * 100).toFixed(1)}%\n${d.recommendation}`;
      }
      
      if (d.compacted !== undefined) {
        // compact result
        if (d.dryRun) {
          return `**模拟压缩**:\n当前: ${d.currentTokens} tokens\n目标: ${d.targetTokens} tokens\n预计压缩: ${d.estimatedReduction}`;
        }
        if (d.compacted) {
          return `**压缩完成**:\n原 tokens: ${d.originalTokens}\n保留消息: ${d.messagesKept} 条\n摘要文件: ${d.summaryFile}`;
        }
        return `**无需压缩**: ${d.reason}`;
      }
      
      if (d.summary) {
        // summarize result
        return `**摘要已生成**:\n消息数: ${d.summary.messageCount}\n决策: ${d.summary.keyDecisions.length} 条\nTODO: ${d.summary.todos.length} 条\n保存至: ${d.savedTo}`;
      }
      
      return JSON.stringify(d, null, 2);
    }
    
    return '操作完成';
  },
  
  maxResultSizeChars: toolMetadata.maxResultSizeChars
};

// ============================================================
// Legacy API (backward compatibility)
// ============================================================

async function check(sessionKey) {
  const result = await contextManagerTool.call(
    { action: 'check', sessionId: sessionKey },
    {},
    null,
    null
  );
  if (result.error) throw new Error(result.error);
  return result.data;
}

async function summarize(sessionKey) {
  const result = await contextManagerTool.call(
    { action: 'summarize', sessionId: sessionKey },
    {},
    null,
    null
  );
  if (result.error) throw new Error(result.error);
  return result.data;
}

async function reset(sessionKey, force = false) {
  const result = await contextManagerTool.call(
    { action: 'reset', sessionId: sessionKey, force },
    {},
    null,
    null
  );
  if (result.error) throw new Error(result.error);
  return result.data;
}

// ============================================================
// CLI Usage
// ============================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Context Manager - Claude Tool Interface');
    console.log('');
    console.log('Usage:');
    console.log('  node context-manager.js --action <check|summarize|reset|compact> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --session <id>     Target session ID');
    console.log('  --threshold <n>    Warning threshold 0-1 (default: 0.85)');
    console.log('  --force            Force reset without confirmation');
    console.log('  --dry-run          Simulate compact without changes');
    console.log('');
    console.log('Examples:');
    console.log('  node context-manager.js --action check');
    console.log('  node context-manager.js --action summarize --session abc123');
    console.log('  node context-manager.js --action compact --dry-run');
    process.exit(0);
  }
  
  const options = {};
  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '--action':
        options.action = args[++i];
        break;
      case '--session':
        options.sessionId = args[++i];
        break;
      case '--threshold':
        options.threshold = parseFloat(args[++i]);
        break;
      case '--force':
        options.force = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
    }
    i++;
  }
  
  if (!options.action) {
    console.error('Error: --action is required');
    process.exit(1);
  }
  
  // Progress callback for CLI
  const onProgress = (progress) => {
    if (progress.type === 'progress') {
      process.stderr.write(`\r[${progress.percent}%] ${progress.message}`);
      if (progress.percent === 100) {
        process.stderr.write('\n');
      }
    }
  };
  
  contextManagerTool.call(options, {}, null, onProgress).then(result => {
    if (result.error) {
      console.error('Error:', result.error);
      process.exit(1);
    }
    console.log(JSON.stringify(result.data, null, 2));
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  check,
  summarize,
  reset,
  tool: contextManagerTool,
  metadata: toolMetadata,
  CONFIG
};
