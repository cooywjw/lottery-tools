#!/usr/bin/env node
/**
 * Coordinator Roles - 角色加载器
 * 
 * 用法：
 *   node role-loader.js list
 *   node role-loader.js <角色名>
 *   node role-loader.js build <角色名> <任务描述>
 */

const fs = require('fs');
const path = require('path');

const ROLES_DIR = path.join(__dirname);

const ROLE_MAP = {
  'frontend-developer': 'engineering/frontend-developer.md',
  'backend-architect': 'engineering/backend-architect.md',
  'growth-hacker': 'marketing/growth-hacker.md',
  'project-manager-senior': 'project-management/project-manager-senior.md',
  'testing-reality-checker': 'testing/testing-reality-checker.md',
};

function listRoles() {
  console.log('\n可用角色：\n');
  for (const [name, relativePath] of Object.entries(ROLE_MAP)) {
    const fullPath = path.join(ROLES_DIR, relativePath);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '[OK]' : '[MISSING]';
    console.log('  ' + status + ' ' + name);
    console.log('       ' + relativePath);
    if (!exists) {
      console.log('       -> need install');
    }
    console.log('');
  }
}

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

function buildWorkerPrompt(roleName, task) {
  const roleContent = loadRole(roleName);
  
  // 提取交付物模板
  let delivery = '';
  const deliveryMatch = roleContent.match(/##\s+📋\s+交付物模板\n([\s\S]+?)(?=##\s+📊|\n---)/);
  if (deliveryMatch) {
    delivery = deliveryMatch[1].trim();
  }
  
  const workerPrompt = roleContent + '\n\n---\n\n## 当前任务\n\n' + task + '\n\n---\n\n按照上述角色设定和交付物模板，执行任务并返回结果。';
  
  return workerPrompt;
}

// 如果是直接运行（node role-loader.js），执行 CLI
// 如果是被 require()，导出函数
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
