/**
 * coordinator.js - 多Agent编排系统统一入口
 * 
 * OpenClaw Skill Tool Interface - 主入口
 * 
 * 用法:
 *   node coordinator.js --action <spawn|send|list|stop|status> [其他参数]
 * 
 * 或通过 stdin 接收 JSON:
 *   echo '{"action":"list"}' | node coordinator.js
 */

const http = require('http');
const path = require('path');

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

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      // 下一个参数如果不是 --xxx 则为值
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        result[key] = args[++i];
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

/**
 * 处理 spawn action
 */
async function handleSpawn(params) {
  const { name, description, prompt, team, run_in_background, tools, role } = params;
  
  if (!name || !description || !prompt) {
    return { success: false, error: 'Missing required: name, description, prompt' };
  }
  
  const teamState = require('./team-state');
  
  // 检查并发限制
  const stats = teamState.getStats();
  if (!stats.canSpawn) {
    return { success: false, error: `已达最大并发数 (${stats.maxAgents})`, activeCount: stats.activeCount };
  }
  
  // 构建任务 Prompt
  let taskPrompt = '';
  
  // 如果指定了 role，加载角色内容
  if (role) {
    const roleLoaderPath = path.join(__dirname, 'roles', 'role-loader.js');
    const { loadRole } = require(roleLoaderPath);
    try {
      const roleContent = loadRole(role);
      taskPrompt = roleContent + '\n\n---\n\n## 当前任务\n\n' + prompt + '\n\n---\n\n执行上述任务，完成后返回结果。';
    } catch (err) {
      return { success: false, error: `加载角色失败: ${err.message}`, hint: '使用 node roles/role-loader.js list 查看可用角色' };
    }
  } else {
    taskPrompt = `[Agent: ${name}] [Team: ${team || 'default'}]\n\n任务：${prompt}\n\n请执行任务，完成后返回结果。`;
  }
  
  // 构建 spawn 参数
  const spawnParams = {
    task: taskPrompt,
    model: 'minimax/MiniMax-M2.7',
    thinking: 'low',
    timeoutSeconds: run_in_background ? 0 : (params.timeoutSeconds || 600)
  };
  
  // 如果指定了工具，传递给子 Agent
  if (tools && Array.isArray(tools) && tools.length > 0) {
    spawnParams.tools = tools;
  }
  
  try {
    const result = await invoke('sessions_spawn', spawnParams);
    
    const sessionKey = result.childSessionKey;
    const taskId = result.runId || sessionKey;
    
    // 注册到 team-state
    const registered = teamState.register(name, sessionKey, taskId, role ? `${role} | ${description}` : description, team || 'default');
    
    if (!registered.success) {
      return { success: false, error: registered.error };
    }
    
    return {
      success: true,
      name,
      role: role || null,
      sessionKey,
      taskId,
      teamName: team || 'default',
      description: role ? `${role} | ${description}` : description,
      message: run_in_background
        ? `Agent "${name}" (${role || 'general'}) 已启动（后台模式）`
        : `Agent "${name}" (${role || 'general'}) 已启动，执行中...`
    };
  } catch (err) {
    return { success: false, error: `Spawn 失败: ${err.message}` };
  }
}

/**
 * 处理 send action
 */
async function handleSend(params) {
  const { to, message } = params;
  
  if (!to || !message) {
    return { success: false, error: 'Missing required: to, message' };
  }
  
  const teamState = require('./team-state');
  const agent = teamState.get(to);
  
  if (!agent) {
    return { success: false, error: `Agent "${to}" 不存在或已超时`, hint: '使用 coordinator action=list 查看活跃的 Agent' };
  }
  
  if (agent.status !== 'running') {
    return { success: false, error: `Agent "${to}" 当前状态是 ${agent.status}，无法发送消息` };
  }
  
  try {
    const result = await invoke('sessions_send', {
      sessionKey: agent.sessionKey,
      message: message
    });
    
    return {
      success: true,
      to,
      sessionKey: agent.sessionKey,
      message: `消息已发送给 "${to}"`
    };
  } catch (err) {
    return { success: false, error: `发送失败: ${err.message}` };
  }
}

/**
 * 处理 list action
 */
function handleList(params) {
  const { team } = params;
  const teamState = require('./team-state');
  
  const agents = team ? teamState.list(team) : teamState.list();
  const stats = teamState.getStats();
  
  const formattedAgents = agents.map(a => ({
    name: a.name,
    description: a.description,
    team: a.teamName,
    status: a.status,
    createdAt: a.createdAt,
    age: `${Math.round((Date.now() - new Date(a.createdAt).getTime()) / 1000)}s`
  }));
  
  return {
    success: true,
    teamStatus: {
      active: stats.activeCount,
      max: stats.maxAgents,
      available: stats.maxAgents - stats.activeCount
    },
    agents: formattedAgents
  };
}

/**
 * 处理 stop action
 */
async function handleStop(params) {
  const { task_id } = params;
  
  if (!task_id) {
    return { success: false, error: 'Missing required: task_id' };
  }
  
  const teamState = require('./team-state');
  
  // 先尝试按名称查找
  let agent = teamState.get(task_id);
  
  // 如果没找到，尝试按 sessionKey 查找
  if (!agent) {
    agent = teamState.getBySessionKey(task_id);
  }
  
  if (!agent) {
    return { success: false, error: `Agent "${task_id}" 不存在或已超时` };
  }
  
  const name = Object.values(teamState.list()).find(a => a.sessionKey === agent.sessionKey)?.name || task_id;
  
  if (agent.status !== 'running') {
    return { success: false, error: `Agent "${name}" 状态为 ${agent.status}，无法停止` };
  }
  
  try {
    // 尝试通知 Agent 停止（通过发送 STOP 消息）
    await invoke('sessions_send', {
      sessionKey: agent.sessionKey,
      message: '[SYSTEM] 请立即停止执行，Coordinator 要求终止任务。'
    }).catch(() => null);
    
    // 更新状态
    teamState.updateStatus(name, 'stopped');
    teamState.remove(name);
    
    return {
      success: true,
      name,
      message: `Agent "${name}" 已停止`
    };
  } catch (err) {
    // 即使 API 失败，也清理本地状态
    teamState.updateStatus(name, 'stopped');
    teamState.remove(name);
    
    return {
      success: true,
      name,
      message: `Agent "${name}" 已从团队状态中移除`,
      warning: err.message
    };
  }
}

/**
 * 处理 status action
 */
function handleStatus() {
  const teamState = require('./team-state');
  const status = teamState.getTeamStatus();
  
  return {
    success: true,
    ...status,
    summary: `总计 ${status.total} 个 Agent，当前活跃 ${status.active}/${status.maxAllowed}`
  };
}

/**
 * 主入口
 */
async function main() {
  let input;
  
  // 检查是否有 stdin 数据
  if (!process.stdin.isTTY) {
    const stdinData = await new Promise(resolve => {
      let data = '';
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
      setTimeout(() => resolve(''), 100); // 超时快速失败
    });
    
    if (stdinData.trim()) {
      try {
        input = JSON.parse(stdinData.trim());
      } catch {
        // 忽略解析错误，尝试命令行参数
      }
    }
  }
  
  // 合并命令行参数
  const args = parseArgs(process.argv.slice(2));
  
  // 命令行参数优先级更高
  input = { ...input, ...args };
  
  const { action } = input;
  
  if (!action) {
    console.log(JSON.stringify({
      error: 'Missing required parameter: action',
      usage: 'node coordinator.js --action <spawn|send|list|stop|status> [options]',
      actions: {
        spawn: '--action spawn --name <名称> --description <描述> --prompt <任务> [--team <团队>] [--run_in_background]',
        send: '--action send --to <Agent名称> --message <消息>',
        list: '--action list [--team <团队>]',
        stop: '--action stop --task_id <Agent名称或ID>',
        status: '--action status'
      }
    }, null, 2));
    process.exit(1);
  }
  
  let result;
  
  switch (action) {
    case 'spawn':
      result = await handleSpawn(input);
      break;
    case 'send':
      result = await handleSend(input);
      break;
    case 'list':
      result = handleList(input);
      break;
    case 'stop':
      result = await handleStop(input);
      break;
    case 'status':
      result = handleStatus();
      break;
    default:
      result = { success: false, error: `Unknown action: ${action}` };
  }
  
  console.log(JSON.stringify(result, null, 2));
  
  // 返回非零退出码表示失败
  if (!result.success) {
    process.exit(1);
  }
}

main().catch(err => {
  console.log(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});

// ============================================
// Claude Tool Interface Export
// ============================================

/**
 * Claude Tool Interface - Tool Definition
 * This allows the skill to be called via OpenClaw Gateway tool system
 */
const tool = {
  name: 'coordinator',
  description: 'Multi-agent orchestration: spawn workers, coordinate parallel tasks, aggregate results',
  
  // Dynamic description based on action
  descriptionDynamic: (args) => {
    const action = args?.action;
    switch(action) {
      case 'spawn': return 'Spawn a new worker agent to execute a task';
      case 'send': return 'Send a message to a running worker agent';
      case 'list': return 'List all active worker agents in the team';
      case 'stop': return 'Stop a running worker agent (cannot be undone)';
      case 'status': return 'Check coordinator team status';
      default: return 'Multi-agent orchestration: spawn workers, coordinate parallel tasks';
    }
  },
  
  // Capability markers (dynamic based on action)
  capabilityMarkers: {
    isConcurrencySafe: (args) => args?.action === 'list' || args?.action === 'status',
    isReadOnly: (args) => args?.action === 'list' || args?.action === 'status',
    isDestructive: (args) => args?.action === 'stop',
    isEnabled: true
  },
  
  // Input schema for validation
  inputSchema: {
    type: 'object',
    properties: {
      action: { 
        type: 'string', 
        enum: ['spawn', 'send', 'list', 'stop', 'status'],
        description: 'Action to perform'
      },
      name: { 
        type: 'string',
        description: 'Agent name (required for spawn)'
      },
      description: { 
        type: 'string',
        description: 'Short description 3-5 words (required for spawn)'
      },
      prompt: { 
        type: 'string',
        description: 'Task details (required for spawn)'
      },
      to: { 
        type: 'string',
        description: 'Target agent name (required for send)'
      },
      message: { 
        type: 'string',
        description: 'Message to send (required for send)'
      },
      task_id: { 
        type: 'string',
        description: 'Agent name or ID (required for stop)'
      },
      team: { 
        type: 'string',
        description: 'Team name (optional)',
        default: 'default'
      },
      run_in_background: { 
        type: 'boolean',
        description: 'Run agent in background mode',
        default: false
      },
      timeoutSeconds: { 
        type: 'number',
        description: 'Timeout in seconds',
        default: 600
      },
      tools: {
        type: 'array',
        description: 'Tools available to the agent (e.g., ["tavily_search", "web_search"])',
        items: { type: 'string' },
        default: []
      },
      role: {
        type: 'string',
        description: 'Role name from roles/ directory (e.g., "frontend-developer", "growth-hacker")',
        default: null
      }
    },
    required: ['action']
  },
  
  // Main execution function
  async execute(args) {
    const { action } = args;
    
    switch (action) {
      case 'spawn':
        return await handleSpawn(args);
      case 'send':
        return await handleSend(args);
      case 'list':
        return handleList(args);
      case 'stop':
        return await handleStop(args);
      case 'status':
        return handleStatus();
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }
};

// Export for Claude Tool Interface
module.exports = { tool };
