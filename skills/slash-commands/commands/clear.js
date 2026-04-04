/**
 * clear.js - /clear 命令处理器
 * 
 * 清除当前会话（需要确认）
 */

function main() {
  console.log(JSON.stringify({
    success: false,
    action: 'require_confirmation',
    command: 'clear',
    destructive: true,
    warning: '⚠️ 这将清除当前会话的所有上下文',
    message: '此操作不可恢复',
    confirmationRequired: true,
    confirmCommand: '/clear confirm',
    cancelCommand: '/clear cancel',
    autoCancelSeconds: 10
  }, null, 2));
  
  // 注意：实际的确认逻辑需要在 AI 侧处理
  // 这里只是提示用户需要确认
}

main();
