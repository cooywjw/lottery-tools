/**
 * 记忆保存辅助脚本
 * 用法: node save_memory.js --type daily|longterm --content "内容"
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw/workspace/memory');
const MEMORY_FILE = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw/workspace/MEMORY.md');

function getTodayFile() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(MEMORY_DIR, `${today}.md`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveDaily(content) {
  ensureDir(MEMORY_DIR);
  const file = getTodayFile();
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const entry = `\n### ${timestamp}\n${content}\n`;
  
  if (!fs.existsSync(file)) {
    const header = `# ${new Date().toISOString().split('T')[0]}\n\n## 对话记录\n`;
    fs.writeFileSync(file, header + entry);
  } else {
    fs.appendFileSync(file, entry);
  }
  console.log(`✓ 已保存到每日笔记: ${file}`);
}

function saveLongterm(content) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const entry = `\n## ${timestamp}\n${content}\n`;
  
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, `# 长期记忆\n${entry}`);
  } else {
    fs.appendFileSync(MEMORY_FILE, entry);
  }
  console.log(`✓ 已保存到长期记忆: ${MEMORY_FILE}`);
}

// 解析参数
const args = process.argv.slice(2);
let type = null;
let content = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type' && args[i + 1]) {
    type = args[i + 1];
    i++;
  } else if (args[i] === '--content' && args[i + 1]) {
    content = args[i + 1];
    i++;
  }
}

if (!type || !content) {
  console.log('用法: node save_memory.js --type daily|longterm --content "内容"');
  process.exit(1);
}

if (type === 'daily') {
  saveDaily(content);
} else if (type === 'longterm') {
  saveLongterm(content);
} else {
  console.log('错误: type 必须是 daily 或 longterm');
  process.exit(1);
}
