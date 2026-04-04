#!/usr/bin/env node

/**
 * 通义万相 2.6 视频生成脚本
 * 支持文生视频 (t2v) 和图生视频 (i2v)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.DASHSCOPE_API_KEY;
const API_BASE = 'https://dashscope.aliyuncs.com/api/v1';

// 模型预设配置
const MODEL_PRESETS = {
  // 文生视频模型
  'wanx2.1-t2v-plus': {
    type: 't2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 3,
    supportedResolutions: ['480P', '720P', '1080P']
  },
  'wan2.2-t2v-plus': {
    type: 't2v',
    supportedDurations: [5],  // 测试发现不支持自定义时长
    defaultDuration: 5,
    supportedResolutions: ['480P', '720P', '1080P']
  },
  'wan2.6-t2v': {
    type: 't2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 5,
    supportedResolutions: ['480P', '720P', '1080P']
  },

  // 图生视频模型
  'wanx2.1-i2v-plus': {
    type: 'i2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 3,
    supportedResolutions: ['480P', '720P', '1080P']
  },
  'wan2.2-i2v-plus': {
    type: 'i2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 5,
    supportedResolutions: ['480P', '720P', '1080P']
  },
  'wan2.2-i2v-flash': {
    type: 'i2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 3,
    supportedResolutions: ['480P', '720P', '1080P']
  },

  // 首尾帧视频模型
  'wanx2.1-kf2v-plus': {
    type: 'kf2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 3,
    supportedResolutions: ['480P', '720P', '1080P']
  },
  'wan2.2-kf2v-flash': {
    type: 'kf2v',
    supportedDurations: [3, 4, 5],
    defaultDuration: 3,
    supportedResolutions: ['480P', '720P', '1080P']
  }
};

function usage() {
  console.log(`
用法:
  node generate_video.js t2v --prompt "描述文字" [--model wan2.2-t2v-plus] [--duration 3-5] [--resolution 720P] [--negative-prompt "负面描述"]
  node generate_video.js i2v --prompt "描述文字" --image-url "图片URL" [--model wan2.2-i2v-plus] [--duration 3-5] [--resolution 720P]

参数:
  --prompt           视频描述/提示词 (必填)
  --model            模型名称 (默认: t2v=wan2.2-t2v-plus, i2v=wan2.2-i2v-plus)
  --duration         视频时长秒数 (3, 4, 5) (默认: 5)
  --resolution       分辨率: 480P, 720P, 1080P (默认: 720P)
  --image-url        图片URL (图生视频必填)
  --negative-prompt  负面提示词,避免出现的内容
  --prompt-extend    是否扩展提示词 (true/false) (默认: true)

可用模型:
  * 文生视频 (t2v): wan2.2-t2v-plus, wan2.6-t2v, wanx2.1-t2v-plus
  * 图生视频 (i2v): wan2.2-i2v-plus, wan2.2-i2v-flash, wan2.6-i2v, wanx2.1-i2v-plus
  * 首尾帧视频: wan2.2-kf2v-flash, wanx2.1-kf2v-plus
`);
  process.exit(1);
}

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function submitTask(model, input, parameters = {}) {
  const url = `${API_BASE}/services/aigc/video-generation/generation`; 

  // 默认参数
  const defaultParams = {
    duration: 5,
    resolution: '720P',
    prompt_extend: true
  };

  // 合并参数
  const finalParams = { ...defaultParams, ...parameters };

  // 模型预设检查与参数调整
  if (MODEL_PRESETS[model]) {
    const preset = MODEL_PRESETS[model];

    // 检查duration是否在模型支持范围内
    const requestedDuration = finalParams.duration;
    if (preset.supportedDurations && !preset.supportedDurations.includes(requestedDuration)) {
      console.warn(`警告: ${model} 不支持 duration=${requestedDuration}秒,支持的时长: ${preset.supportedDurations.join(',')}秒`);
      console.warn(`已调整为模型默认时长: ${preset.defaultDuration}秒`);
      finalParams.duration = preset.defaultDuration;
    }

    // 检查resolution是否在模型支持范围内
    const requestedResolution = finalParams.resolution;
    if (preset.supportedResolutions && !preset.supportedResolutions.includes(requestedResolution)) {
      console.warn(`警告: ${model} 不支持 resolution=${requestedResolution},支持的分辨率: ${preset.supportedResolutions.join(',')}`);
      console.warn(`已调整为: 720P`);
      finalParams.resolution = '720P';
    }

    // 特殊模型提示
    if (preset.type === 'kf2v') {
      if (!input.first_frame_url || !input.last_frame_url) {
        console.error('错误: kf2v模型需要首尾帧图像参数 (first_frame_url, last_frame_url)');
        process.exit(1);
      }
    }
  } else {
    // 未知模型,使用通用验证
    if (![3, 4, 5].includes(finalParams.duration)) {
      console.warn(`警告: duration=${finalParams.duration} 不是推荐值 (3,4,5),已调整为5`);
      finalParams.duration = 5;
    }
  }

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    }
  }, {
    model,
    input,
    parameters: finalParams
  });
  return response;
}

async function checkTask(taskId) {
  const url = `${API_BASE}/tasks/${taskId}`;
  const response = await makeRequest(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  return response;
}

async function waitForCompletion(taskId) {
  console.log(`任务提交成功,ID: ${taskId}`);
  console.log('等待生成完成...');

  while (true) {
    await new Promise(r => setTimeout(r, 5000));
    const result = await checkTask(taskId);
    const status = result.output?.task_status || result.task_status;

    if (status === 'SUCCEEDED') {
      const videoUrl = result.output?.video_url || result.results?.[0]?.url;
      console.log(`\n✅ 视频生成成功!`);
      console.log(`VIDEO_URL: ${videoUrl}`);
      return videoUrl;
    } else if (status === 'FAILED') {
      console.error('\n❌ 生成失败:', result.output?.message || result.message);
      process.exit(1);
    } else {
      process.stdout.write('.');
    }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('错误: 请设置 DASHSCOPE_API_KEY 环境变量');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const mode = args[0];

  if (!mode || ['t2v', 'i2v'].indexOf(mode) === -1) {
    usage();
  }

  const params = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    params[key] = args[i + 1];
  }

  if (!params.prompt) {
    console.error('错误: --prompt 参数必填');
    usage();
  }

  if (mode === 'i2v' && !params['image-url']) {
    console.error('错误: 图生视频需要 --image-url 参数');
    usage();
  }

  const input = {
    prompt: params.prompt
  };

  // 基础参数
  const duration = parseInt(params.duration) || 5;
  const resolution = params.resolution || '720P';

  // 图生视频参数
  if (mode === 'i2v') {
    if (!params['image-url']) {
      console.error('错误: 图生视频需要 --image-url 参数');
      usage();
    }
    input.image_url = params['image-url'];
  }

  // 负面提示词
  if (params['negative-prompt']) {
    input.negative_prompt = params['negative-prompt'];
  }

  // 模型选择:用户指定或默认
  let model;
  if (params.model) {
    model = params.model;
    console.log(`使用指定模型: ${model}`);
  } else {
    model = mode === 't2v'
      ? 'wan2.2-t2v-plus'
      : 'wan2.2-i2v-plus';
    console.log(`使用默认模型: ${model}`);
  }

  // 构建参数
  const parameters = {
    duration: duration,
    resolution: resolution,
    prompt_extend: params['prompt-extend'] !== 'false'  // 默认true
  };

  // 特殊模型参数处理
  if (model.includes('kf2v')) {
    console.warn('注意: kf2v模型需要首尾帧图像,请确保input包含first_frame_url和last_frame_url');
  }

  try {
    const submitResult = await submitTask(model, input, parameters);
    const taskId = submitResult.output?.task_id || submitResult.task_id;

    if (!taskId) {
      console.error('提交失败:', submitResult);
      process.exit(1);
    }

    await waitForCompletion(taskId);
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  }
}

main();
