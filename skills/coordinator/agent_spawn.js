/**
 * agent_spawn - 创建子 Agent 执行任务
 * 
 * 用法:
 *   node agent_spawn.js --name <名称> --description <描述> --prompt <任务> [--team <团队>] [--background]
 *   node agent_spawn.js --name researcher --description "代码审计" --prompt "分析 src/auth/..." --team my-team
 */

const path = require('path');
const { spawn } = require('child_process');

// 读取 API 配置
function getApiConfig() {
  const configPath = path.join(__dirname, '..', '..', 'openclaw-config', 'api-config.json');
  try {
    return require(configPath);
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  let name, description, prompt, teamName = 'default', background = false;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name': name = args[++i]; break;
      case '--description': description = args[++i]; break;
      case '--prompt': prompt = args[++i]; break;
      case '--team': teamName = args[++i]; break;
      case '--background': background = true; break;
    }
  }
  
  if (!name || !description || !prompt) {
    console.log(JSON.stringify({
      error: 'Missing required arguments: --name, --description, --prompt are required',
      usage: 'node agent_spawn.js --name <名称> --description <描述> --prompt <任务> [--team <团队>] [--background]'
    }, null, 2));
    process.exit(1);
  }
  
  // 加载 team-state
  const teamState = require('./team-state');
  
  // 检查是否可 spawn
  const stats = teamState.getStats();
  if (!stats.canSpawn) {
    console.log(JSON.stringify({
      success: false,
      error: `已达最大并发数 (${stats.maxAgents})，无法 spawn 新 Agent`,
      activeAgents: stats.activeCount,
      suggestion: '等待现有 Agent 完成后重试'
    }, null, 2));
    process.exit(1);
  }
  
  // 检查名称是否冲突
  const existing = teamState.get(name);
  if (existing && existing.status === 'running') {
    console.log(JSON.stringify({
      success: false,
      error: `Agent "${name}" 已在运行中`,
      existingAgent: existing
    }, null, 2));
    process.exit(1);
  }
  
  // 构建 task prompt（自包含）
  const taskPrompt = `[Agent: ${name}] [Team: ${teamName}]\n\n任务：${prompt}\n\n请执行任务，完成后返回结果。如果遇到问题，请汇报错误信息。`;
  
  // 调用 OpenClaw HTTP API spawn agent
  const apiConfig = getApiConfig();
  const gatewayUrl = apiConfig?.gatewayUrl || 'http://localhost:18789';
  const gatewayToken = apiConfig?.token || process.env.OPENCLAW_TOKEN || '';
  
  const requestBody = {
    task: taskPrompt,
    model: 'minimax/MiniMax-M2.7', // 默认模型
    thinking: 'low',
    timeoutSeconds: background ? 0 : 180 // background=true 则无超时限制
  };
  
  // 添加 label 作为 name 标识
  if (background) {
    requestBody.label = `coordinator-${name}`;
  }
  
  try {
    const response = await fetch(`${gatewayUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const sessionData = await response.json();
    const sessionKey = sessionData.sessionKey || sessionData.id;
    const taskId = sessionData.taskId || sessionKey;
    
    // 注册到 team-state
    const registered = teamState.register(name, sessionKey, taskId, description, teamName);
    
    if (!registered.success) {
      console.log(JSON.stringify({
        success: false,
        error: registered.error,
        activeCount: registered.activeCount
      }, null, 2));
      process.exit(1);
    }
    
    console.log(JSON.stringify({
      success: true,
      name,
      sessionKey,
      taskId,
      teamName,
      description,
      runInBackground: background,
      message: background
        ? `Agent "${name}" 已启动（后台模式）`
        : `Agent "${name}" 已启动，正在执行任务...`
    }, null, 2));
    
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: `Spawn 失败: ${err.message}`,
      hint: '检查 OpenClaw Gateway 是否运行中 (http://localhost:18789)'
    }, null, 2));
    process.exit(1);
  }
}

main();
