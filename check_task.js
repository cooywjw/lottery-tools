const https = require('https');
const API_KEY = process.env.DASHSCOPE_API_KEY;
const API_BASE = 'https://dashscope.aliyuncs.com/api/v1';
const taskId = '99684c38-fead-4950-a072-625339f65756';

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
    console.log('任务状态:', JSON.stringify(result, null, 2));
    
    // 提取关键信息
    const status = result.output?.task_status || result.task_status;
    console.log(`\n状态: ${status}`);
    
    if (status === 'SUCCEEDED') {
      const videoUrl = result.output?.video_url || result.results?.[0]?.url;
      console.log(`视频URL: ${videoUrl}`);
    } else if (status === 'FAILED') {
      console.log('失败原因:', result.output?.message || result.message);
    } else {
      console.log('任务仍在处理中...');
    }
  } catch (err) {
    console.error('错误:', err.message);
  }
}

main();