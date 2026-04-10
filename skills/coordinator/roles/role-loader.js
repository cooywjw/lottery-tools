#!/usr/bin/env node
/**
 * Coordinator Roles - 角色加载器 (v2.0)
 * 
 * 支持动态加载 agency-sync 注册表
 * 用法：
 *   node role-loader.js list
 *   node role-loader.js <角色名>
 *   node role-loader.js build <角色名> <任务描述>
 */

const fs = require('fs');
const path = require('path');

const ROLES_DIR = path.join(__dirname);

// 旧版兼容 ROLE_MAP（只用于 fallback）
const LEGACY_ROLE_MAP = {
  'frontend-developer': 'engineering/frontend-developer.md',
  'backend-architect': 'engineering/backend-architect.md',
  'growth-hacker': 'marketing/growth-hacker.md',
  'project-manager-senior': 'project-management/project-manager-senior.md',
  'testing-reality-checker': 'testing/testing-reality-checker.md',
};

/**
 * 加载注册表（支持 agency-sync 和 legacy）
 */
function loadRegistry() {
  // 尝试从 agency-sync 加载注册表
  const syncSkillDir = path.join(ROLES_DIR, '../../agency-sync');
  const registryPath = path.join(syncSkillDir, 'registry.json');
  
  if (fs.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      // 转换为 role-loader 格式: key -> relativePath
      const roleMap = {};
      for (const [agentKey, meta] of Object.entries(registry)) {
        roleMap[agentKey] = meta.path;
        // 别名：不带 department 前缀的简短名称（取最后一段）
        const shortName = agentKey.split('/').pop();
        if (!roleMap[shortName]) {
          roleMap[shortName] = meta.path;
        }
      }
      return roleMap;
    } catch (e) {
      console.warn('[role-loader] Failed to load registry:', e.message);
    }
  }
  
  // Fallback 到 legacy
  return LEGACY_ROLE_MAP;
}

const ROLE_MAP = loadRegistry();

/**
 * 列出所有可用角色
 */
function listRoles() {
  console.log('\n可用角色（共 ' + Object.keys(ROLE_MAP).length + ' 个）：\n');
  
  // 按部门分组
  const byDept = {};
  for (const [name, relativePath] of Object.entries(ROLE_MAP)) {
    const dept = relativePath.split('/')[0] || 'unknown';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({ name, relativePath });
  }
  
  for (const [dept, agents] of Object.entries(byDept)) {
    console.log('## ' + dept.toUpperCase() + ' (' + agents.length + ')');
    for (const { name, relativePath } of agents) {
      const fullPath = path.join(ROLES_DIR, relativePath);
      const exists = fs.existsSync(fullPath);
      const status = exists ? '[OK]' : '[MISSING]';
      console.log('  ' + status + ' ' + name);
    }
    console.log('');
  }
}

/**
 * 加载角色内容
 */
function loadRole(roleName) {
  const relativePath = ROLE_MAP[roleName];
  if (!relativePath) {
    console.error('Unknown role: ' + roleName);
    console.log('Available: ' + Object.keys(ROLE_MAP).join(', '));
    process.exit(1);
  }
  const fullPath = path.join(ROLES_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.error('Role file not found: ' + fullPath);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * 构建 Worker Prompt
 */
function buildWorkerPrompt(roleName, task) {
  const roleContent = loadRole(roleName);
  
  // 提取交付物模板（兼容各种格式）
  let delivery = '';
  const deliveryMatch = roleContent.match(/##\s+[📋]\s+交付物模板\n([\s\S]+?)(?=##\s+[📊]|\n---)/);
  if (deliveryMatch) {
    delivery = deliveryMatch[1].trim();
  }
  
  const workerPrompt = roleContent + '\n\n---\n\n## 当前任务\n\n' + task + '\n\n---\n\n按照上述角色设定和交付物模板，执行任务并返回结果。';
  
  return workerPrompt;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'list') {
    listRoles();
  } else if (command === 'build') {
    const roleName = args[1];
    const task = args.slice(2).join(' ');
    if (!roleName || !task) {
      console.error('Usage: node role-loader.js build <role> <task>');
      process.exit(1);
    }
    console.log(buildWorkerPrompt(roleName, task));
  } else {
    console.log(loadRole(command));
  }
} else {
  module.exports = { listRoles, loadRole, buildWorkerPrompt };
}
