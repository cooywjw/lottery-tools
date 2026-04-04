/**
 * compact.js - /compact 命令处理器
 */

const path = require('path');
const { execSync } = require('child_process');

const COMPACT_THRESHOLD = 180000;  // 180K tokens
const TARGET_REDUCTION = 40000;    // 目标压缩到 40K

function main() {
  const args = process.argv.slice(2);
  
  let dryRun = false;
  
  for (const arg of args) {
    if (arg === '--dry-run' || arg === '--args' && args[args.indexOf(arg) + 1] === 'dry-run') {
      dryRun = true;
    }
  }
  
  // 调用 autoCompact
  const autoCompactPath = path.join(__dirname, '..', '..', 'context-manager-1.0.0', 'compact', 'autoCompact.js');
  const action = dryRun ? 'dry-run' : 'compact';
  
  try {
    const output = execSync(`node "${autoCompactPath}" --action ${action}`, {
      encoding: 'utf-8',
      timeout: 120000
    });
    
    // 解析输出
    const result = JSON.parse(output);
    
    if (dryRun) {
      console.log(JSON.stringify({
        action: 'dry-run',
        message: '模拟压缩检查',
        ...result
      }, null, 2));
    } else {
      if (result.success) {
        console.log(JSON.stringify({
          action: 'compact',
          message: '上下文压缩完成',
          originalTokens: result.originalTokens,
          newTokens: result.newTokens,
          reduction: `${result.reductionPercent}%`,
          summaryPreview: result.summary?.substring(0, 200) + '...'
        }, null, 2));
      } else {
        console.log(JSON.stringify({
          action: 'compact',
          success: false,
          error: result.error
        }, null, 2));
      }
    }
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      stderr: err.stderr?.toString()
    }, null, 2));
    process.exit(1);
  }
}

main();
