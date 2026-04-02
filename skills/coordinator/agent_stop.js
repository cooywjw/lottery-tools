/**
 * agent_stop - 停止运行中的 Agent
 * 
 * 用法:
 *   node agent_stop.js --task_id <agent名称或ID>
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
  
  let taskId;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task_id') taskId = args[++i];
  }
  
  if (!taskId) {
    console.log(JSON.stringify({
      error: 'Missing required argument: --task_id',
      usage: 'node agent_stop.js --task_id <agent名称或ID>'
    }, null, 2));
    process.exit(1);
  }
  
  const teamState = require('./team-state');
  
  // 先尝试按名称查找
  let agent = teamState.get(taskId);
  
  // 如果没找到，尝试按 sessionKey 查找
  if (!agent) {
    agent = teamState.getBySessionKey(taskId);
  }
  
  // 如果还没找到，返回错误
  if (!agent) {
    console.log(JSON.stringify({
      success: false,
      error: `Agent "${taskId}" 不存在或已超时`,
      hint: '使用 agent_list.js 查看活跃的 Agent'
    }, null, 2));
    process.exit(1);
  }
  
  const name = Object.values(teamState.list()).find(a => a.sessionKey === agent.sessionKey)?.name || taskId;
  
  if (agent.status !== 'running') {
    console.log(JSON.stringify({
      success: false,
      error: `Agent "${name}" 状态为 ${agent.status}，无法停止`
    }, null, 2));
    process.exit(1);
  }
  
  const apiConfig = getApiConfig();
  const gatewayUrl = apiConfig?.gatewayUrl || 'http://localhost:18789';
  const gatewayToken = apiConfig?.token || process.env.OPENCLAW_TOKEN || '';
  
  try {
    // 尝试通过发送 STOP 消息来停止
    // 注意：OpenClaw 可能没有直接的 kill 接口，这里尝试发送中断信号
    const response = await fetch(`${gatewayUrl}/api/sessions/${agent.sessionKey}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${gatewayToken}`
      }
    }).catch(() => null);
    
    // 无论 API 是否成功，都更新本地状态
    teamState.updateStatus(name, 'stopped');
    teamState.remove(name);
    
    console.log(JSON.stringify({
      success: true,
      name,
      sessionKey: agent.sessionKey,
      message: `Agent "${name}" 已标记为停止`,
      note: response?.ok ? '已通过 Gateway 停止' : '已从团队状态中移除（Gateway 可能不支持直接停止）'
    }, null, 2));
    
  } catch (err) {
    // 即便 API 失败，也更新本地状态
    teamState.updateStatus(name, 'stopped');
    teamState.remove(name);
    
    console.log(JSON.stringify({
      success: true,
      name,
      message: `Agent "${name}" 已从团队状态中移除（本地清理完成）`,
      warning: `Gateway 操作失败: ${err.message}`
    }, null, 2));
  }
}

main();
