/**
 * agent_spawn - 创建子 Agent 执行任务
 * 
 * 用法:
 *   node agent_spawn.js --name <名称> --description <描述> --prompt <任务> [--team <团队>] [--background]
 */

const http = require('http');

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

async function main() {
  const args = process.argv.slice(2);
  
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
      error: 'Missing required: --name, --description, --prompt',
      usage: 'node agent_spawn.js --name <名称> --description <描述> --prompt <任务>'
    }, null, 2));
    process.exit(1);
  }
  
  const teamState = require('./team-state');
  
  // 检查并发限制
  const stats = teamState.getStats();
  if (!stats.canSpawn) {
    console.log(JSON.stringify({
      success: false,
      error: `已达最大并发数 (${stats.maxAgents})`,
      activeCount: stats.activeCount
    }, null, 2));
    process.exit(1);
  }
  
  // 构建 task prompt
  const taskPrompt = `[Agent: ${name}] [Team: ${teamName}]\n\n任务：${prompt}\n\n请执行任务，完成后返回结果。`;
  
  try {
    // 调用 sessions_spawn
    const result = await invoke('sessions_spawn', {
      task: taskPrompt,
      model: 'minimax/MiniMax-M2.7',
      thinking: 'low',
      timeoutSeconds: background ? 0 : 180
    });
    
    const sessionKey = result.childSessionKey;
    const taskId = result.runId || sessionKey;
    
    // 注册到 team-state
    const registered = teamState.register(name, sessionKey, taskId, description, teamName);
    
    if (!registered.success) {
      console.log(JSON.stringify({ success: false, error: registered.error }, null, 2));
      process.exit(1);
    }
    
    console.log(JSON.stringify({
      success: true,
      name,
      sessionKey,
      taskId,
      teamName,
      description,
      message: background
        ? `Agent "${name}" 已启动（后台模式）`
        : `Agent "${name}" 已启动，执行中...`
    }, null, 2));
    
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: `Spawn 失败: ${err.message}`
    }, null, 2));
    process.exit(1);
  }
}

main();
