const https = require('https');
const API_KEY = process.env.DASHSCOPE_API_KEY;
const API_BASE = 'https://dashscope.aliyuncs.com/api/v1';
const taskId = '0bec395e-3ff9-4990-a4e1-1527c46ec863';

function checkTask(taskId) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/tasks/${taskId}`;
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('查询任务状态...');
    const result = await checkTask(taskId);
    
    // 提取关键信息
    const status = result.output?.task_status || result.task_status;
    console.log(`任务ID: ${taskId}`);
    console.log(`状态: ${status}`);
    
    if (status === 'SUCCEEDED') {
      const videoUrl = result.output?.video_url || result.results?.[0]?.url;
      console.log(`✅ 视频生成成功!`);
      console.log(`视频URL: ${videoUrl}`);
      console.log(`时长: ${result.output?.duration || result.parameters?.duration || '未知'}秒`);
      console.log(`分辨率: ${result.output?.resolution || result.parameters?.resolution || '未知'}`);
    } else if (status === 'FAILED') {
      console.log('❌ 生成失败:', result.output?.message || result.message);
    } else {
      console.log('⏳ 任务仍在处理中...');
      console.log('提交时间:', result.output?.submit_time || result.submit_time);
      console.log('建议等待后再查询。');
    }
  } catch (err) {
    console.error('错误:', err.message);
  }
}

main();