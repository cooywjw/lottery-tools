/**
 * Memory Manager - Claude Tool Interface
 *
 * 管理和持久化对话记忆、用户偏好、重要信息。
 *
 * @implements {OpenClawTool}
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '.openclaw/workspace/memory';
const MEMORY_FILE = '.openclaw/workspace/MEMORY.md';

// ----- Tool Metadata -----
const toolMetadata = {
  name: 'memory_save',
  aliases: ['save_memory', 'remember'],
  searchHint: 'save information to memory or search memories',
  version: '1.0.0',
  capabilities: ['write'],
  category: 'memory',
  trustLevel: 'safe',
  maxContentChars: 50000
};

// ----- Input Schema -----
const inputSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['save', 'append_daily', 'update_longterm', 'search'],
      description: "操作类型: save(通用保存) | append_daily(追加每日笔记) | update_longterm(更新长期记忆) | search(搜索记忆)"
    },
    content: {
      type: 'string',
      minLength: 1,
      maxLength: 50000,
      description: '要保存的内容'
    },
    category: {
      type: 'string',
      description: '可选，分类标签如 "决策", "偏好", "项目"'
    },
    target: {
      type: 'string',
      enum: ['daily', 'longterm'],
      description: "保存目标: daily(每日笔记 memory/YYYY-MM-DD.md) | longterm(长期记忆 MEMORY.md)"
    },
    filename: {
      type: 'string',
      description: "仅 search 时使用，指定要搜索的日记文件名如 '2026-04-05'"
    }
  },
  required: ['action', 'content']
};

// ----- Helper Functions -----
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDailyFile(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const iso = date.toISOString().split('T')[0];
  return path.join(MEMORY_DIR, `${iso}.md`);
}

function formatTimestamp() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildDailyEntry(content, category) {
  const time = formatTimestamp();
  const cat = category ? ` [${category}]` : '';
  return `\n### ${time}${cat}\n${content}\n`;
}

function buildLongtermEntry(content, category) {
  const time = formatTimestamp();
  const cat = category ? `## ${category}\n` : '';
  return `\n${cat}**${time}**\n${content}\n`;
}

function saveDaily(content, category) {
  ensureDir(MEMORY_DIR);
  const file = getDailyFile();
  const entry = buildDailyEntry(content, category);

  if (!fs.existsSync(file)) {
    const date = new Date().toISOString().split('T')[0];
    const header = `# ${date}\n\n## 对话记录\n`;
    fs.writeFileSync(file, header + entry);
  } else {
    fs.appendFileSync(file, entry);
  }
  return { file, entry };
}

function saveLongterm(content, category) {
  const entry = buildLongtermEntry(content, category);

  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, `# 长期记忆\n${entry}`);
  } else {
    fs.appendFileSync(MEMORY_FILE, entry);
  }
  return { file: MEMORY_FILE, entry };
}

function searchInFile(filePath, keywords) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results = [];
  let inSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matched = keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (matched) {
      inSection = true;
      results.push(line.trim());
    } else if (inSection && line.startsWith('## ')) {
      inSection = false;
    }
  }
  return results;
}

function searchMemories(keywords, specificFile) {
  ensureDir(MEMORY_DIR);
  const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
  const allResults = [];

  if (specificFile) {
    const file = path.join(MEMORY_DIR, specificFile);
    const hits = searchInFile(file, keywords);
    if (hits.length > 0) {
      allResults.push({ file: specificFile, matches: hits });
    }
  } else {
    for (const file of files.slice(-30)) {
      const hits = searchInFile(path.join(MEMORY_DIR, file), keywords);
      if (hits.length > 0) {
        allResults.push({ file, matches: hits });
      }
    }
    // Also search longterm memory
    const ltHits = searchInFile(MEMORY_FILE, keywords);
    if (ltHits.length > 0) {
      allResults.push({ file: 'MEMORY.md', matches: ltHits });
    }
  }
  return allResults;
}

// ----- Tool Implementation -----
const memoryTool = {
  // ----- Identity -----
  name: toolMetadata.name,
  aliases: toolMetadata.aliases,
  searchHint: toolMetadata.searchHint,

  // ----- Schema -----
  inputSchema,

  // ----- Execution -----
  async call(args, context, canUseTool, onProgress) {
    if (canUseTool && !(await canUseTool('memory_save'))) {
      return { data: null, error: 'Permission denied: memory_save not authorized' };
    }

    const { action, content, category, target, filename } = args;

    if (!content || content.length > 50000) {
      return { data: null, error: 'content must be 1-50000 characters' };
    }

    if (onProgress) {
      onProgress({ type: 'progress', message: `Memory ${action}...`, percent: 20 });
    }

    try {
      let result;

      switch (action) {
        case 'save':
        case 'append_daily': {
          result = saveDaily(content, category);
          if (onProgress) onProgress({ type: 'progress', message: 'Saved to daily note', percent: 80 });
          return {
            data: {
              action,
              target: 'daily',
              file: result.file,
              message: `已保存到每日笔记: ${path.basename(result.file)}`
            }
          };
        }

        case 'update_longterm': {
          result = saveLongterm(content, category);
          if (onProgress) onProgress({ type: 'progress', message: 'Saved to longterm memory', percent: 80 });
          return {
            data: {
              action,
              target: 'longterm',
              file: result.file,
              message: `已保存到长期记忆: MEMORY.md`
            }
          };
        }

        case 'search': {
          if (onProgress) onProgress({ type: 'progress', message: 'Searching memories...', percent: 30 });
          const keywords = content.split(/[,\s]+/).filter(Boolean);
          const results = searchMemories(keywords, filename ? `${filename}.md` : null);
          if (onProgress) onProgress({ type: 'progress', message: 'Search complete', percent: 100 });
          return {
            data: {
              action: 'search',
              query: content,
              matches: results,
              totalFiles: results.length,
              message: `找到 ${results.reduce((s, r) => s + r.matches.length, 0)} 条相关记录，分布在 ${results.length} 个文件中`
            }
          };
        }

        default:
          return { data: null, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { data: null, error: `Memory operation failed: ${error.message}` };
    }
  },

  // ----- Dynamic Description -----
  async description(input) {
    switch (input.action) {
      case 'save':
      case 'append_daily':
        return `保存内容到每日笔记: "${input.content.substring(0, 50)}..."`;
      case 'update_longterm':
        return `保存内容到长期记忆: "${input.content.substring(0, 50)}..."`;
      case 'search':
        return `搜索记忆文件: "${input.content}"`;
      default:
        return `记忆管理操作: ${input.action}`;
    }
  },

  // ----- Capability Checks -----
  isConcurrencySafe() { return false; },
  isReadOnly() { return false; },
  isDestructive() { return false; },
  isEnabled() { return true; },

  // ----- Result Rendering -----
  renderResult(output) {
    if (!output) return 'No result';
    const { action, message } = output;
    if (action === 'search') {
      let text = `**搜索结果**: ${message}\n\n`;
      for (const r of (output.matches || [])) {
        text += `📄 ${r.file}:\n`;
        r.matches.slice(0, 5).forEach(m => { text += `  > ${m}\n`; });
        text += '\n';
      }
      return text;
    }
    return `✅ ${message}`;
  },

  maxResultSizeChars: toolMetadata.maxContentChars
};

// ============================================================
// CLI Usage
// ============================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'save';
  const content = args.slice(1).join(' ') || '';

  if (!content && action !== 'search') {
    console.log('Usage: node memory-manager.js <action> <content>');
    console.log('Actions: save, append_daily, update_longterm, search');
    process.exit(1);
  }

  memoryTool.call(
    { action, content },
    {},
    null,
    (p) => { if (p.type === 'progress') process.stderr.write(`\r[${p.percent}%] ${p.message}`); }
  ).then(result => {
    if (result.error) {
      console.error('\nError:', result.error);
      process.exit(1);
    }
    console.log('\n' + result.data.message);
  }).catch(err => {
    console.error('\nError:', err.message);
    process.exit(1);
  });
}

module.exports = { tool: memoryTool, metadata: toolMetadata };
