const https = require('https');
const API_KEY = process.env.DASHSCOPE_API_KEY;

async function test(host, body) {
  const b = JSON.stringify(body);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: host, port: 443,
      path: '/api/v1/services/aigc/text2image/image-generation',
      method: 'POST',
      headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable', 'Content-Length': Buffer.byteLength(b)}
    }, (response) => {
      let d = ''; response.on('data', c => d += c); response.on('end', () => resolve({s: response.statusCode, b: d.slice(0,100)}));
    });
    req.on('error', e => resolve({s: 'ERR', b: e.message}));
    req.write(b); req.end();
  });
}

(async () => {
  const tests = [
    {host:'dashscope.aliyuncs.com', body:{model:'wanx2.0-t2i-turbo',input:{prompt:'test'},parameters:{n:1,size:'1024*1024'}}},
    {host:'dashscope-intl.aliyuncs.com', body:{model:'wanx2.0-t2i-turbo',input:{prompt:'test'},parameters:{n:1,size:'1024*1024'}}},
    {host:'dashscope.aliyuncs.com', body:{model:'wan2.5-t2i-preview',input:{prompt:'test'},parameters:{n:1,size:'1024*1024'}}},
    {host:'dashscope-intl.aliyuncs.com', body:{model:'wan2.5-t2i-preview',input:{prompt:'test'},parameters:{n:1,size:'1024*1024'}}},
  ];
  for (const t of tests) {
    const r = await test(t.host, t.body);
    console.log(r.s, t.host, t.body.model, '->', r.b);
    await new Promise(r2 => setTimeout(r2, 500));
  }
})();
