#!/usr/bin/env node
/**
 * agency-sync - 同步上游 agency-agents 仓库
 * 
 * 用法：
 *   node sync.js full    # 首次全量同步
 *   node sync.js update  # 增量更新
 *   node sync.js list    # 列出所有 Agent
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const UPSTREAM_REPO = 'https://github.com/msitarzewski/agency-agents.git';
const UPSTREAM_BRANCH = 'main';
const TEMP_CLONE_DIR = path.join(SKILL_DIR, '.upstream_clone');
const ROLES_OUTPUT_DIR = path.join(SKILL_DIR, '../coordinator/roles');
const REGISTRY_OUTPUT = path.join(SKILL_DIR, 'registry.json');

const DEPARTMENT_MAP = {
  'engineering': 'engineering',
  'marketing': 'marketing',
  'project-management': 'project-management',
  'testing': 'testing',
  'design': 'design',
  'product': 'product',
  'support': 'support',
  'specialized': 'specialized',
  'sales': 'sales',
  'academic': 'academic',
  'paid-media': 'paid-media',
  'game-development': 'game-development',
  'spatial-computing': 'spatial-computing',
  'strategy': 'strategy',
  'integrations': 'integrations',
  'examples': 'examples',
};

function log(msg) {
  console.log(`[agency-sync] ${msg}`);
}

function error(msg) {
  console.error(`[agency-sync ERROR] ${msg}`);
}

/**
 * 提取 frontmatter 元数据
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...vals] = line.split(':');
    if (key && vals.length) {
      fm[key.trim()] = vals.join(':').trim();
    }
  });
  return fm;
}

/**
 * 从 Agent 内容提取元数据（用于生成 frontmatter）
 */
function extractAgentMetadata(filePath, content) {
  const filename = path.basename(filePath, '.md');
  
  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  // 提取部门（从文件名，如 engineering-frontend-developer.md）
  const deptMatch = filename.match(/^([a-z]+)-/);
  const dept = deptMatch ? deptMatch[1] : 'unknown';

  // 提取描述（从核心使命第一节）
  const missionMatch = content.match(/##\s+[🎯📋]\s+核心使命\n([\s\S]*?)(?=##)/);
  const description = missionMatch 
    ? missionMatch[1].replace(/[^\S\n]+/g, ' ').replace(/\n+/g, ' ').trim().substring(0, 200)
    : title;

  return {
    name: filename,
    description: description,
    version: '1.0.0',
    department: DEPARTMENT_MAP[dept] || dept,
    color: getColorForDept(dept),
    source: 'agency-agents',
  };
}

function getColorForDept(dept) {
  const colors = {
    'engineering': 'cyan',
    'marketing': 'magenta',
    'testing': 'green',
    'project-management': 'yellow',
    'design': 'pink',
    'product': 'purple',
    'support': 'blue',
    'specialized': 'orange',
    'sales': 'red',
    'legal': 'gray',
    'data': 'teal',
    'operations': 'brown',
  };
  return colors[dept] || 'cyan';
}

/**
 * 转换单个 Agent 文件
 */
function convertAgentFile(upstreamPath, relativePath) {
  const content = fs.readFileSync(upstreamPath, 'utf-8');
  const metadata = extractAgentMetadata(upstreamPath, content);
  
  // 生成 frontmatter
  const frontmatter = `---
name: ${metadata.name}
description: ${metadata.description}
version: ${metadata.version}
department: ${metadata.department}
color: ${metadata.color}
source: ${metadata.source}
---

`;

  // 保留原始内容（可能有 emoji，不需要转换）
  // 移除可能导致问题的部分
  let body = content;
  
  // 移除文件名中的 README 引用
  body = body.replace(/\.README\.md/gi, '');
  
  return frontmatter + body;
}

/**
 * 获取所有 Agent 文件（处理新的目录结构）
 */
function getAgentFiles(repoDir) {
  const files = [];
  const entries = fs.readdirSync(repoDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '.git' || entry.name === 'scripts' || entry.name === 'examples') continue;
    
    const deptDir = path.join(repoDir, entry.name);
    const subEntries = fs.readdirSync(deptDir, { withFileTypes: true });
    
    for (const subEntry of subEntries) {
      if (subEntry.isFile() && subEntry.name.endsWith('.md') && subEntry.name !== 'README.md') {
        files.push(path.join(deptDir, subEntry.name));
      }
    }
  }
  
  return files;
}

/**
 * 同步 Agent 文件到 coordinator/roles/
 */
function syncAgents(agentFiles) {
  // 确保输出目录存在
  if (!fs.existsSync(ROLES_OUTPUT_DIR)) {
    fs.mkdirSync(ROLES_OUTPUT_DIR, { recursive: true });
  }

  const registry = {};
  let synced = 0;

  for (const upstreamPath of agentFiles) {
    const filename = path.basename(upstreamPath);
    
    // 从文件名提取部门，如 engineering-frontend-developer.md -> dept=engineering
    const deptMatch = filename.match(/^([a-z]+)-/);
    const dept = deptMatch ? deptMatch[1] : 'unknown';
    
    // 目标目录
    const targetDir = path.join(ROLES_OUTPUT_DIR, DEPARTMENT_MAP[dept] || dept);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, filename);
    
    // 转换内容
    const converted = convertAgentFile(upstreamPath, targetPath);
    
    // 提取元数据用于注册表
    const metadata = extractAgentMetadata(upstreamPath, upstreamPath);
    const agentKey = `${metadata.department}/${metadata.name}`;
    registry[agentKey] = {
      path: `${DEPARTMENT_MAP[dept] || dept}/${filename}`,
      department: metadata.department,
      color: metadata.color,
      description: metadata.description,
    };

    // 写入文件
    fs.writeFileSync(targetPath, converted, 'utf-8');
    synced++;
  }

  // 生成注册表
  fs.writeFileSync(REGISTRY_OUTPUT, JSON.stringify(registry, null, 2), 'utf-8');
  
  log(`Synced ${synced} agents to coordinator/roles/`);
  log(`Registry saved to: ${REGISTRY_OUTPUT}`);
  
  return registry;
}

/**
 * 克隆或更新上游仓库
 */
function cloneOrPull() {
  if (fs.existsSync(TEMP_CLONE_DIR)) {
    log('Updating existing upstream clone...');
    try {
      execSync(`git -C "${TEMP_CLONE_DIR}" pull origin ${UPSTREAM_BRANCH}`, { stdio: 'pipe' });
      log('Pull successful');
    } catch (e) {
      log('Pull failed, doing fresh clone...');
      fs.rmSync(TEMP_CLONE_DIR, { recursive: true });
      execSync(`git clone --depth=1 --branch ${UPSTREAM_BRANCH} "${UPSTREAM_REPO}" "${TEMP_CLONE_DIR}"`, { stdio: 'pipe' });
    }
  } else {
    log('Cloning upstream repository (first time)...');
    execSync(`git clone --depth=1 --branch ${UPSTREAM_BRANCH} "${UPSTREAM_REPO}" "${TEMP_CLONE_DIR}"`, { stdio: 'pipe' });
  }
}

/**
 * 列出所有可用 Agent
 */
function listAgents() {
  const registryPath = REGISTRY_OUTPUT;
  if (!fs.existsSync(registryPath)) {
    console.log('Registry not found. Run "node sync.js full" first.');
    return;
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  
  // 按部门分组
  const byDept = {};
  for (const [key, meta] of Object.entries(registry)) {
    const dept = meta.department || 'unknown';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({ key, ...meta });
  }

  console.log('\n=== Available Agents ===\n');
  for (const [dept, agents] of Object.entries(byDept)) {
    console.log(`\n## ${dept.toUpperCase()} (${agents.length} agents)`);
    for (const a of agents) {
      console.log(`  - ${a.key}`);
    }
  }
  console.log(`\nTotal: ${Object.keys(registry).length} agents\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  if (command === 'list') {
    listAgents();
    return;
  }

  if (command === 'full' || command === 'update') {
    try {
      cloneOrPull();
      const agentFiles = getAgentFiles(TEMP_CLONE_DIR);
      log(`Found ${agentFiles.length} agent files in upstream`);
      const registry = syncAgents(agentFiles);
      log(`Done! ${Object.keys(registry).length} agents available.`);
      
      // 自动更新 role-loader
      updateRoleLoader(registry);
    } catch (e) {
      error(e.message);
      process.exit(1);
    }
    return;
  }

  console.log('Usage: node sync.js [full|update|list]');
}

function updateRoleLoader(registry) {
  const loaderPath = path.join(SKILL_DIR, '../../coordinator/roles/role-loader.js');
  if (!fs.existsSync(loaderPath)) {
    log('role-loader.js not found, skipping auto-update');
    return;
  }

  // 生成新的 ROLE_MAP
  const roleMapLines = [];
  for (const [key, meta] of Object.entries(registry)) {
    roleMapLines.push(`  '${key}': '${meta.path}',`);
  }
  
  const newRoleMap = `const ROLE_MAP = {\n${roleMapLines.join('\n')}\n};`;

  // 读取原文件
  let content = fs.readFileSync(loaderPath, 'utf-8');
  
  // 替换 ROLE_MAP 部分
  content = content.replace(
    /const ROLE_MAP = \{[\s\S]*?\};(\n\nfunction)/,
    newRoleMap + '\n$1'
  );
  
  fs.writeFileSync(loaderPath, content, 'utf-8');
  log('Updated role-loader.js with new ROLE_MAP');
}

main();
