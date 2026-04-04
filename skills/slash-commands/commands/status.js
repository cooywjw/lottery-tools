/**
 * status.js - /status 命令处理器
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = 18789;
const GATEWAY_TOKEN = 'a3e09c327f476ad37e8a5b1e2cda8bbef85b62faf60bd61f';

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

async function getStatus() {
  try {
    // 获取 session_status
    const sessionStatus = await invoke('session_status', {});
    
    // 读取 team-state
    const teamStatePath = path.join(__dirname, '..', '..', 'coordinator', 'team-state.json');
    let teamStatus = { active: 0, max: 3 };
    try {
      if (fs.existsSync(teamStatePath)) {
        const teamData = JSON.parse(fs.readFileSync(teamStatePath, 'utf-8'));
        const activeAgents = Object.values(teamData.agents || {}).filter(a => a.status === 'running');
        teamStatus = { active: activeAgents.length, max: 3 };
      }
    } catch {}
    
    return {
      success: true,
      session: {
        model: sessionStatus.model || 'unknown',
        thinking: sessionStatus.thinking || 'off',
        runtime: sessionStatus.runtime || 'unknown'
      },
      tokens: {
        used: sessionStatus.tokenUsage?.used || 0,
        limit: sessionStatus.tokenUsage?.limit || 0,
        percent: sessionStatus.tokenUsage?.percent || 0
      },
      team: teamStatus,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  const result = await getStatus();
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.log(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
