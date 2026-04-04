/**
 * task.js - /task 命令处理器
 * 
 * 创建新任务（通过 coordinator spawn）
 */

const path = require('path');
const { execSync } = require('child_process');

function main() {
  const args = process.argv.slice(2);
  
  let taskDescription = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--args') {
      taskDescription = args[++i];
    }
  }
  
  if (!taskDescription) {
    console.log(JSON.stringify({
      success: false,
      error: '缺少任务描述',
      usage: '/task <任务描述>',
      example: '/task 分析 src/auth 目录的安全漏洞'
    }, null, 2));
    process.exit(1);
  }
  
  // 生成任务 ID
  const taskId = `task-${Date.now().toString(36)}`;
  
  // 调用 coordinator spawn
  const coordinatorPath = path.join(__dirname, '..', '..', 'coordinator', 'coordinator.js');
  
  try {
    const output = execSync(
      `node "${coordinatorPath}" --action spawn --name "${taskId}" --description "任务执行" --prompt "${taskDescription}"`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    
    const result = JSON.parse(output);
    
    if (result.success) {
      console.log(JSON.stringify({
        success: true,
        taskId,
        message: `任务已创建: ${taskId}`,
        agent: result.name,
        sessionKey: result.sessionKey,
        note: '任务在后台执行，通过 /status 查看进度'
      }, null, 2));
    } else {
      console.log(JSON.stringify({
        success: false,
        error: result.error
      }, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: err.message
    }, null, 2));
    process.exit(1);
  }
}

main();
