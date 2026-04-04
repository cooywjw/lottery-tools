const https = require('https');
const querystring = require('querystring');

// ✅ 最小可行通义万相 2.6 调用脚本（2026.4 修复版）
// 用法：node fixed_generate.js t2v "一只橘猫在窗台上晒太阳" [duration=3] [resolution=720P]
//      node fixed_generate.js i2v "镜头缓慢推进" "https://example.com/image.jpg" [duration=4]

if (process.argv.length < 4) {
  console.error('用法: node fixed_generate.js <t2v|i2v> <prompt> [image-url] [duration=3|4|5] [resolution=480P|720P|1080P]');
  process.exit(1);
}

const mode = process.argv[2];
const prompt = process.argv[3];
const imageUrl = mode === 'i2v' ? process.argv[4] : null;

let duration = 3;
let resolution = '720P';

for (let i = 4; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('duration=')) duration = parseInt(arg.split('=')[1]) || 3;
  if (arg.startsWith('resolution=')) resolution = arg.split('=')[1] || '720P';
}

// 模型选择
const model = mode === 't2v' 
  ? 'wan2.6-t2v' 
  : 'wan2.6-i2v';

// 构造 input
const input = { prompt };
if (imageUrl) input.img_url = imageUrl;

// 构造 parameters
const parameters = { duration, resolution };

// 请求体
const body = JSON.stringify({ model, input, parameters });

// API 配置
const options = {
  hostname: 'dashscope.aliyuncs.com',
  port: 443,
  path: '/api/v1/services/aigc/video-generation/video-synthesis',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    'Content-Type': 'application/json',
    'X-DashScope-Async': 'enable',
    'Content-Length': body.length
  }
};

console.log(`🚀 正在调用通义万相 2.6 (${mode})...`);
console.log(`   Model: ${model}`);
console.log(`   Prompt: "${prompt}"`);
if (imageUrl) console.log(`   Image: ${imageUrl}`);
console.log(`   Duration: ${duration}s, Resolution: ${resolution}`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.task_id) {
        console.log(`\n✅ 任务已提交！Task ID: ${json.task_id}`);
        console.log(`💡 使用以下命令查询结果：node scripts/check_task.js ${json.task_id}`);
      } else {
        console.error(`❌ API 返回异常：`, json);
      }
    } catch (e) {
      console.error(`❌ 解析响应失败：`, data);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ 请求失败：`, error.message);
});

req.write(body);
req.end();