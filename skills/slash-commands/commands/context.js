/**
 * context.js - /context 命令处理器
 */

const http = require('http');

const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = 18789;
const GATEWAY_TOKEN = 'a3e09c327f476ad37e8a5b1e2cda8bbef85b62faf60bd61f';

// 阈值配置
const THRESHOLDS = {
  warning: 0.85,   // 85% 警告
  critical: 0.90   // 90% 临界
};

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

async function getContextUsage() {
  try {
    const sessionStatus = await invoke('session_status', {});
    
    const usage = sessionStatus.tokenUsage || {};
    const percent = usage.percent || 0;
    const percentDisplay = (percent * 100).toFixed(1);
    
    // 计算状态
    let status = 'normal';
    let statusEmoji = '✅';
    let recommendation = '上下文使用正常';
    
    if (percent >= THRESHOLDS.critical) {
      status = 'critical';
      statusEmoji = '🚨';
      recommendation = '上下文使用率临界，建议立即清理，说"开始上下文整理"';
    } else if (percent >= THRESHOLDS.warning) {
      status = 'warning';
      statusEmoji = '⚠️';
      recommendation = '上下文使用率较高，建议适时清理';
    }
    
    // 生成可视化条
    const barLength = 20;
    const filledLength = Math.round(barLength * percent);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    return {
      success: true,
      percent: parseFloat(percentDisplay),
      percentDisplay: `${percentDisplay}%`,
      bar,
      status,
      statusEmoji,
      recommendation,
      details: {
        used: usage.used || 0,
        limit: usage.limit || 0,
        promptTokens: usage.prompt || 0,
        completionTokens: usage.completion || 0
      },
      thresholds: THRESHOLDS,
      compactAvailable: percent >= THRESHOLDS.warning
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  const result = await getContextUsage();
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.log(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
