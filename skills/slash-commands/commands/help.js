/**
 * help.js - /help 命令处理器
 */

const COMMANDS = {
  help: { description: '显示帮助信息', usage: '/help [命令名]' },
  status: { description: '查看系统状态', usage: '/status' },
  context: { description: '查看上下文使用率', usage: '/context' },
  compact: { description: '手动触发上下文压缩', usage: '/compact [--dry-run]' },
  clear: { description: '清除当前会话（需确认）', usage: '/clear', destructive: true },
  task: { description: '创建新任务', usage: '/task <任务描述>' },
  model: { description: '切换 AI 模型', usage: '/model <模型名>' },
  memory: { description: '搜索记忆', usage: '/memory <关键词>' }
};

function main() {
  const args = process.argv.slice(2);
  let requestedCommand = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--args') {
      requestedCommand = args[++i]?.toLowerCase();
    }
  }
  
  if (requestedCommand && COMMANDS[requestedCommand]) {
    const cmd = COMMANDS[requestedCommand];
    console.log(JSON.stringify({
      command: `/${requestedCommand}`,
      description: cmd.description,
      usage: cmd.usage,
      destructive: cmd.destructive || false
    }, null, 2));
  } else {
    // 显示所有命令
    const lines = ['**可用斜杠命令：**', ''];
    for (const [name, cmd] of Object.entries(COMMANDS)) {
      const warning = cmd.destructive ? ' ⚠️' : '';
      lines.push(`**/${name}** - ${cmd.description}${warning}`);
      lines.push(`  ${cmd.usage}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('💡 输入 `/命令` 即可执行，如 `/status`');
    
    console.log(JSON.stringify({
      help: true,
      commands: COMMANDS,
      message: lines.join('\n')
    }, null, 2));
  }
}

main();
