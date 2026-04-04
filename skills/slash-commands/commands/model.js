/**
 * model.js - /model 命令处理器
 * 
 * 切换 AI 模型
 */

// 已配置的模型列表
const AVAILABLE_MODELS = {
  'deepseek': 'deepseek/deepseek-chat',
  'deepseek-r1': 'deepseek/deepseek-reasoner',
  'kimi': 'moonshot/kimi-k2.5',
  'glm': 'zai/glm-4.7-flash',
  'qwen': 'dashscope/qwen-max',
  'minimax': 'minimax/MiniMax-M2.7'
};

function main() {
  const args = process.argv.slice(2);
  
  let modelArg = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--args') {
      modelArg = args[++i]?.toLowerCase();
    }
  }
  
  if (!modelArg) {
    // 显示可用模型
    console.log(JSON.stringify({
      success: true,
      action: 'list',
      message: '可用模型：',
      models: AVAILABLE_MODELS,
      usage: '/model <模型名>',
      example: '/model deepseek'
    }, null, 2));
    process.exit(0);
  }
  
  // 查找匹配的模型
  const modelKey = Object.keys(AVAILABLE_MODELS).find(k => k.startsWith(modelArg));
  
  if (!modelKey) {
    console.log(JSON.stringify({
      success: false,
      error: `未知模型: ${modelArg}`,
      available: Object.keys(AVAILABLE_MODELS),
      suggestion: '使用 /model 查看可用模型列表'
    }, null, 2));
    process.exit(1);
  }
  
  const model = AVAILABLE_MODELS[modelKey];
  
  console.log(JSON.stringify({
    success: true,
    action: 'switch',
    requested: modelArg,
    model: {
      key: modelKey,
      full: model
    },
    message: `模型已切换为: ${modelKey} (${model})`,
    note: '切换将在下一次请求时生效'
  }, null, 2));
}

main();
