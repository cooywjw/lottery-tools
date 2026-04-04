/**
 * slash-commands.js - 斜杠命令系统主入口
 * 
 * 用法:
 *   node slash-commands.js --command <命令> [--args <参数>]
 */

const path = require('path');
const { execSync } = require('child_process');

// 命令注册表
const COMMANDS = {
  help: {
    description: '显示帮助信息',
    usage: '/help [命令名]',
    script: 'help.js'
  },
  status: {
    description: '查看系统状态',
    usage: '/status',
    script: 'status.js'
  },
  context: {
    description: '查看上下文使用率',
    usage: '/context',
    script: 'context.js'
  },
  compact: {
    description: '手动触发上下文压缩',
    usage: '/compact [--dry-run]',
    script: 'compact.js'
  },
  clear: {
    description: '清除当前会话（需确认）',
    usage: '/clear',
    destructive: true,
    script: 'clear.js'
  },
  task: {
    description: '创建新任务',
    usage: '/task <任务描述>',
    script: 'task.js'
  },
  model: {
    description: '切换 AI 模型',
    usage: '/model <模型名>',
    script: 'model.js'
  },
  memory: {
    description: '搜索记忆',
    usage: '/memory <关键词>',
    script: 'memory.js'
  }
};

/**
 * 解析命令字符串
 */
function parseCommand(input) {
  const trimmed = input.trim();
  
  // 去掉开头的 /（如果有）
  const commandStr = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const parts = commandStr.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  return { command, args, raw: trimmed };
}

/**
 * 查找命令处理器
 */
function findHandler(command) {
  const cmd = COMMANDS[command];
  if (!cmd) {
    return { error: `未知命令: /${command}`, available: Object.keys(COMMANDS) };
  }
  return { handler: cmd };
}

/**
 * 执行命令
 */
function executeCommand(command, args, options = {}) {
  const parsed = parseCommand(command);
  
  if (parsed.error) {
    return { success: false, error: parsed.error };
  }
  
  const found = findHandler(parsed.command);
  if (found.error) {
    return { success: false, error: found.error, available: found.available };
  }
  
  const cmd = found.handler;
  const scriptPath = path.join(__dirname, 'commands', cmd.script);
  
  // 检查脚本是否存在
  try {
    require('fs').accessSync(scriptPath);
  } catch {
    return { success: false, error: `命令处理器不存在: ${cmd.script}` };
  }
  
  // 构建命令
  const fullArgs = parsed.args || args || '';
  const execCmd = `node "${scriptPath}" ${fullArgs ? `--args "${fullArgs}"` : ''}`;
  
  try {
    const output = execSync(execCmd, { encoding: 'utf-8', timeout: 30000 });
    return {
      success: true,
      command: parsed.command,
      output: output.trim(),
      destructive: cmd.destructive || false
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      stderr: err.stderr?.toString()
    };
  }
}

/**
 * 列出所有可用命令
 */
function listCommands() {
  return Object.entries(COMMANDS).map(([name, cmd]) => ({
    command: `/${name}`,
    description: cmd.description,
    usage: cmd.usage,
    destructive: cmd.destructive || false
  }));
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(JSON.stringify({
      system: 'slash-commands',
      version: '1.0.0',
      commands: listCommands(),
      usage: 'node slash-commands.js --command <命令> [--args <参数>]',
      examples: [
        'node slash-commands.js --command help',
        'node slash-commands.js --command status',
        'node slash-commands.js --command context',
        'node slash-commands.js --command task --args "分析代码"',
        'node slash-commands.js --command memory --args "用户偏好"'
      ]
    }, null, 2));
    process.exit(0);
  }
  
  let command = null;
  let cmdArgs = null;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--command':
        command = args[++i];
        break;
      case '--args':
        cmdArgs = args[++i];
        break;
    }
  }
  
  if (!command) {
    console.log(JSON.stringify({ error: 'Missing required: --command' }, null, 2));
    process.exit(1);
  }
  
  const result = executeCommand(command, cmdArgs);
  
  console.log(JSON.stringify(result, null, 2));
  
  if (!result.success) {
    process.exit(1);
  }
}

main();
