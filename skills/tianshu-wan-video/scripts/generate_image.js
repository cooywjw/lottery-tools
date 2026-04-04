/**
 * generate_image.js - 通义万相文生图
 * 
 * 支持模型:
 *   wan2.6-t2i        - 万相2.6（推荐，支持HTTP同步）
 *   wan2.5-t2i-preview - 万相2.5 preview（异步，需轮询）
 *   wanx2.0-t2i-turbo - 万相2.0极速版（异步）
 * 
 * 用法:
 *   node generate_image.js --prompt "描述" [--model wan2.6-t2i] [--output path.png] [--size 1280*1280]
 */

const https = require('https');
const fs = require('fs');

const API_KEY = process.env.DASHSCOPE_API_KEY;
const API_HOST = 'dashscope.aliyuncs.com'; // 北京地域

if (!API_KEY) {
  console.error('[错误] DASHSCOPE_API_KEY 未设置');
  process.exit(1);
}

/**
 * 通义万相同步文生图（wan2.6）
 * 文档：https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference
 */
function generateSync(prompt, model, size = '1280*1280', n = 1) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ]
      },
      parameters: {
        prompt_extend: true,
        watermark: false,
        n,
        negative_prompt: '',
        size
      }
    });

    const options = {
      hostname: API_HOST,
      port: 443,
      path: '/api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    console.error(`[API] POST /api/v1/services/aigc/multimodal-generation/generation`);
    console.error(`[API] model=${model} size=${size} n=${n}`);

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const r = JSON.parse(raw);
          if (r.code) {
            reject(new Error(`API错误 [${r.code}]: ${r.message}`));
          } else if (r.output?.choices?.[0]?.message?.content) {
            // wan2.6 同步格式
            const images = r.output.choices[0].message.content
              .filter(c => c.image)
              .map(c => c.image);
            resolve(images);
          } else if (r.output?.results) {
            // 异步完成格式
            const images = r.output.results.map(item => item.image);
            resolve(images);
          } else {
            reject(new Error('未知响应格式: ' + raw.slice(0, 200)));
          }
        } catch (e) {
          reject(new Error('JSON解析失败: ' + raw.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * 通义万相异步文生图（wan2.5及以下）
 * 文档：https://help.aliyun.com/zh/model-studio/text-to-image-v1-api-reference
 */
function generateAsync(prompt, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      input: { prompt },
      parameters: { 
        n: 1, 
        size: '1024*1024',
        prompt_extend: true,
        watermark: false
      }
    });
    
    console.error(`[API] POST /api/v1/services/aigc/text2image/image-synthesis`);
    console.error(`[API] model=${model} body=${body.slice(0, 200)}...`);

    // 异步提交 (旧版文生图 API)
    const postReq = https.request({
      hostname: API_HOST, port: 443,
      path: '/api/v1/services/aigc/text2image/image-synthesis',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        console.error(`[API响应] status=${res.statusCode} raw=${raw.slice(0, 300)}`);
        try {
          const r = JSON.parse(raw);
          if (r.output?.task_id) {
            console.error(`[异步任务] task_id=${r.output.task_id}`);
            resolve(r.output.task_id);
          } else if (r.code) {
            reject(new Error(`API错误 [${r.code}]: ${r.message}`));
          } else {
            reject(new Error('创建任务失败: ' + raw.slice(0, 200)));
          }
        } catch (e) {
          reject(new Error('JSON解析失败: ' + raw.slice(0, 200)));
        }
      });
    });
    postReq.on('error', reject);
    postReq.write(body);
    postReq.end();
  });
}

function pollTask(taskId, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (Date.now() - start > timeoutMs) { reject(new Error('轮询超时')); return; }
      console.error(`[轮询] ${Math.round((Date.now() - start)/1000)}s...`);
      const req = https.request({
        hostname: API_HOST, port: 443,
        path: `/api/v1/tasks/${taskId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString();
            const r = JSON.parse(raw);
            console.error(`[轮询响应] ${raw.slice(0, 300)}`);
            const s = r.output?.task_status;
            if (s === 'SUCCEEDED') {
              const url = r.output?.results?.[0]?.url || r.output?.results?.[0]?.image;
              console.error(`[成功] URL=${url}`);
              resolve(url);
            }
            else if (s === 'FAILED') reject(new Error('任务失败'));
            else setTimeout(check, 8000);
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.end();
    };
    setTimeout(check, 5000);
  });
}

function download(url, outputPath) {
  return new Promise((resolve, reject) => {
    const { execSync } = require('child_process');
    try {
      execSync(`curl.exe -L -o "${outputPath}" "${url}"`, { stdio: 'pipe' });
      resolve(outputPath);
    } catch (e) {
      reject(new Error('下载失败: ' + e.message));
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  let prompt, model = 'wan2.6-t2i', output, size = '1280*1280', n = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt') prompt = args[++i];
    else if (args[i] === '--model') model = args[++i];
    else if (args[i] === '--output') output = args[++i];
    else if (args[i] === '--size') size = args[++i];
    else if (args[i] === '--n') n = parseInt(args[++i]);
  }

  if (!prompt) {
    console.log(JSON.stringify({
      error: '缺少 --prompt 参数',
      usage: 'node generate_image.js --prompt "描述" [--model wan2.6-t2i] [--output path.png] [--size 1280*1280] [--n 1]',
      models: {
        'wan2.6-t2i': '万相2.6（推荐，HTTP同步）',
        'wan2.5-t2i-preview': '万相2.5 preview（异步）',
        'wanx2.0-t2i-turbo': '万相2.0极速（异步）'
      },
      sizes: ['1280*1280', '1024*1024', '960*1696', '1696*960', '768*2700', '2700*768', '1104*1472', '1472*1104']
    }, null, 2));
    process.exit(1);
  }

  console.error(`[生成中] 模型=${model} 尺寸=${size} 数量=${n}`);
  console.error(`[提示词] ${prompt}`);

  try {
    let images;
    if (model === 'wan2.6-t2i') {
      images = await generateSync(prompt, model, size, n);
    } else {
      const taskId = await generateAsync(prompt, model);
      images = [await pollTask(taskId)];
    }

    console.error(`[成功] 生成 ${images.length} 张图片`);

    if (output) {
      // 如果 n>1，生成序号文件
      if (images.length === 1) {
        await download(images[0], output);
        console.log(JSON.stringify({ success: true, url: images[0], savedTo: output }, null, 2));
      } else {
        const ext = path.extname(output) || '.png';
        const base = output.replace(ext, '');
        const paths = [];
        for (let i = 0; i < images.length; i++) {
          const p = `${base}_${String(i+1).padStart(2,'0')}${ext}`;
          await download(images[i], p);
          paths.push(p);
        }
        console.log(JSON.stringify({ success: true, urls: images, savedTo: paths }, null, 2));
      }
    } else {
      console.log(JSON.stringify({ success: true, urls: images }, null, 2));
    }
  } catch (err) {
    console.error(`[失败] ${err.message}`);
    process.exit(1);
  }
}

const path = require('path');
main();
