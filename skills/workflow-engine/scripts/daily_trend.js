/**
 * 每日爆款视频推送脚本
 * 
 * 每天自动搜索各平台热门视频，整理标题发给你
 * 让你一早就能看到今天什么最火，选题直接跟拍
 * 
 * 用法: node daily_trend.js
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

const TAVILY_KEY = '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';

function tavilySearch(query, depth = 'basic', maxResults = 8) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: depth,
      max_results: maxResults,
      include_answer: true
    });
    const req = https.request({
      hostname: 'api.tavily.com', port: 443, path: '/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  console.log(`\n📊 每日爆款视频推送 - ${today}\n`);
  console.log('🔍 搜索中...\n');

  try {
    // 搜抖音、B站、快手热门（用更具体的查询词）
    const [douyin, bilibili, kuaishou] = await Promise.all([
      tavilySearch('抖音点赞最高的视频 2026年4月 爆款', 'advanced', 8),
      tavilySearch('B站播放量最高的视频 2026年4月 新热门', 'advanced', 8),
      tavilySearch('快手点赞最高的视频 2026 热门', 'advanced', 8)
    ]);

    let output = `# 📊 每日爆款视频推送 - ${today}\n\n`;

    // 抖音
    output += `## 🎵 抖音热门\n`;
    if (douyin.results && douyin.results.length > 0) {
      douyin.results.slice(0, 5).forEach((r, i) => {
        const title = r.title.replace(/^【.+?】/, '').trim();
        output += `${i + 1}. ${title}\n   ${r.url}\n`;
      });
    } else {
      output += '（暂无数据）\n';
    }
    output += '\n';

    // B站
    output += `## 📺 B站热门\n`;
    if (bilibili.results && bilibili.results.length > 0) {
      bilibili.results.slice(0, 5).forEach((r, i) => {
        const title = r.title.replace(/^【.+?】/, '').replace(/\.$/, '').trim();
        output += `${i + 1}. ${title}\n   ${r.url}\n`;
      });
    } else {
      output += '（暂无数据）\n';
    }
    output += '\n';

    // 快手
    output += `## 📱 快手热门\n`;
    if (kuaishou.results && kuaishou.results.length > 0) {
      kuaishou.results.slice(0, 5).forEach((r, i) => {
        const title = r.title.replace(/^【.+?】/, '').trim();
        output += `${i + 1}. ${title}\n   ${r.url}\n`;
      });
    } else {
      output += '（暂无数据）\n';
    }
    output += '\n---\n';
    output += `> 由 AI 自动搜索整理，选题前请二次核实内容质量\n`;

    // 保存到文件
    const trendFile = path.join(process.env.USERPROFILE || '', '.openclaw/workspace/memory/daily-trends.md');
    fs.writeFileSync(trendFile, output);
    console.log(output);
    console.log(`\n✅ 已保存到: ${trendFile}`);

  } catch (err) {
    console.error('搜索失败:', err.message);
    process.exit(1);
  }
}

main();
