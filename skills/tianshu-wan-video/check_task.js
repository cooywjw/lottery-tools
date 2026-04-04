const https = require('https');

// 查询通义万相任务状态
// 用法: node check_task.js <task_id>

const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: node check_task.js <task_id>');
  process.exit(1);
}

const options = {
  hostname: 'dashscope.aliyuncs.com',
  port: 443,
  path: `/api/v1/tasks/${taskId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
  }
};

console.log(`🔍 查询任务: ${taskId}`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const status = json.output?.task_status || json.task_status;
      
      console.log(`\n状态: ${status}`);
      
      if (status === 'SUCCEEDED') {
        const videoUrl = json.output?.video_url || json.results?.[0]?.url;
        console.log(`✅ 视频生成成功!`);
        console.log(`📹 VIDEO_URL: ${videoUrl}`);
      } else if (status === 'FAILED') {
        console.error(`❌ 生成失败:`, json.output?.message || json.message);
      } else {
        console.log(`⏳ 任务进行中，请稍后查询...`);
      }
    } catch (e) {
      console.error(`❌ 解析响应失败:`, data);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ 请求失败:`, error.message);
});

req.end();
