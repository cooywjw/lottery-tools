/**
 * memory.js - /memory 命令处理器
 * 
 * 搜索记忆文件
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'memory');

function searchInFile(filePath, keyword) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        // 提取上下文（前后各2行）
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length - 1, i + 2);
        matches.push({
          line: i + 1,
          content: lines.slice(start, end + 1).join('\n').substring(0, 300)
        });
      }
    }
    
    return { file: path.basename(filePath), matches };
  } catch (err) {
    return { file: path.basename(filePath), error: err.message, matches: [] };
  }
}

function main() {
  const args = process.argv.slice(2);
  
  let keyword = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--args') {
      keyword = args[++i];
    }
  }
  
  if (!keyword) {
    console.log(JSON.stringify({
      success: false,
      error: '缺少搜索关键词',
      usage: '/memory <关键词>',
      example: '/memory 用户偏好'
    }, null, 2));
    process.exit(1);
  }
  
  // 搜索 MEMORY.md 和 memory/ 目录
  const results = [];
  
  // 搜索 MEMORY.md
  const memoryPath = path.join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'MEMORY.md');
  if (fs.existsSync(memoryPath)) {
    const result = searchInFile(memoryPath, keyword);
    if (result.matches.length > 0) {
      results.push({ ...result, type: 'long-term' });
    }
  }
  
  // 搜索 memory/ 目录
  if (fs.existsSync(MEMORY_DIR)) {
    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const result = searchInFile(path.join(MEMORY_DIR, file), keyword);
      if (result.matches.length > 0) {
        results.push({ ...result, type: 'daily' });
      }
    }
  }
  
  if (results.length === 0) {
    console.log(JSON.stringify({
      success: true,
      keyword,
      found: false,
      message: `没有找到包含 "${keyword}" 的记忆`
    }, null, 2));
  } else {
    const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
    console.log(JSON.stringify({
      success: true,
      keyword,
      found: true,
      totalMatches,
      files: results.length,
      results
    }, null, 2));
  }
}

main();
