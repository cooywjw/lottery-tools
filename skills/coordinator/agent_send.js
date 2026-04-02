/**
 * agent_send - 向运行中的 Agent 发送消息
 * 
 * 用法:
 *   node agent_send.js --to <agent名称> --message <消息>
 */

const path = require('path');

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
  
  let to, message;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--to': to = args[++i]; break;
      case '--message': message = args[++i]; break;
    }
  }
  
  if (!to || !message) {
    console.log(JSON.stringify({
      error: 'Missing required arguments: --to and --message are required',
      usage: 'node agent_send.js --to <agent名称> --message <消息>'
    }, null, 2));
    process.exit(1);
  }
  
  const teamState = require('./team-state');
  
  // 查找 Agent
  const agent = teamState.get(to);
  if (!agent) {
    console.log(JSON.stringify({
      success: false,
      error: `Agent "${to}" 不存在或已超时`,
      hint: '使用 agent_list.js 查看活跃的 Agent'
    }, null, 2));
    process.exit(1);
  }
  
  if (agent.status !== 'running') {
    console.log(JSON.stringify({
      success: false,
      error: `Agent "${to}" 当前状态是 ${agent.status}，无法发送消息`,
      hint: '已完成的 Agent 无法继续，可使用 agent_spawn.js 创建新的'
    }, null, 2));
    process.exit(1);
  }
  
  const apiConfig = getApiConfig();
  const gatewayUrl = apiConfig?.gatewayUrl || 'http://localhost:18789';
  const gatewayToken = apiConfig?.token || process.env.OPENCLAW_TOKEN || '';
  
  try {
    const response = await fetch(`${gatewayUrl}/api/sessions/${agent.sessionKey}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log(JSON.stringify({
      success: true,
      to,
      sessionKey: agent.sessionKey,
      message: `消息已发送给 "${to}"`,
      note: 'Agent 将在下一轮回复中处理此消息'
    }, null, 2));
    
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: `发送失败: ${err.message}`,
      hint: '检查 OpenClaw Gateway 是否运行中'
    }, null, 2));
    process.exit(1);
  }
}

main();
