const https = require('https');
const API_KEY = process.env.DASHSCOPE_API_KEY;

async function testPath(path, model) {
  const body = JSON.stringify({model, input:{prompt:'test'}, parameters:{n:1,size:'1024*1024'}});
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'dashscope.aliyuncs.com', port: 443, path, method: 'POST',
      headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable', 'Content-Length': Buffer.byteLength(body)}
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({s: res.statusCode, b: d.slice(0,120)}));
    });
    req.on('error', e => resolve({s: 'ERR', b: e.message}));
    req.write(body); req.end();
  });
}

(async () => {
  const models = ['wanx2.0-t2i-turbo', 'wan2.5-t2i-preview'];
  const paths = [
    '/api/v1/services/aigc/text2image/image-generation',
    '/api/v1/services/wanx/t2i/turbo',
    '/api/v1/services/aigc/wanx/t2i/turbo'
  ];
  for (const m of models) {
    for (const p of paths) {
      const r = await testPath(p, m);
      console.log(r.s, m, p, '->', r.b);
      await new Promise(r2 => setTimeout(r2, 300));
    }
  }
})();
