const axios = require('axios');

(async () => {
  try {
    const res = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/generation',
      {
        model: 'wan2.6-t2v',
        prompt: 'test',
        size: '720P',
        duration: 2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Key valid & service reachable');
    console.log('→ Response ID:', res.data.output?.task_id || '(no task_id)');
  } catch (e) {
    const status = e.response?.status;
    const msg = e.response?.data?.message || e.message;
    console.error(`❌ API error [${status}]:`, msg);
    if (status === 401) console.error('💡 Hint: Check if DASHSCOPE_API_KEY is correct and has Wanxiang access.');
    if (status === 403) console.error('💡 Hint: Enable "Tongyi Wanxiang" in DashScope console: https://dashscope.console.aliyun.com/');
    if (status === 429) console.error('💡 Hint: Quota exhausted — check usage at https://dashscope.console.aliyun.com/account/billing');
  }
})();