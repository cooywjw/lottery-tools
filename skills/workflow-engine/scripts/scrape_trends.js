/**
 * 各平台热门视频抓取 - 最终版
 *
 * B站: Playwright直接访问热榜页面（实测可行）
 * 抖音: Tavily搜索（搜到过KKBOX等真实音乐榜单）
 * 快手: Tavily搜索
 */

const { chromium } = require('playwright');
const https = require('https');

const TAVILY_KEY = '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';

function tavilySearch(query, maxResults = 8) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: 'advanced',
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

async function scrapeBilibili(browser) {
  const page = await browser.newPage();
  try {
    console.log('[B站] 正在打开...');
    await page.goto('https://www.bilibili.com/v/popular/rank/all', {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(2000);

    const titles = await page.$$eval(
      '.rank-list-wrap .rank-item .title, .video-card .video-title',
      els => els.map(e => e.textContent.trim()).filter(t => t.length > 2 && t.length < 80)
    );

    await page.close();
    return { name: 'B站', titles: [...new Set(titles)].slice(0, 10) };
  } catch (err) {
    await page.close();
    return { name: 'B站', titles: [], error: err.message };
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('浏览器启动成功\n');

  const [bilibili, douyinSearch, kuaishouSearch] = await Promise.all([
    scrapeBilibili(browser),
    tavilySearch('抖音热门视频排行 2026年4月 爆款'),
    tavilySearch('快手热门视频排行 2026 点赞最高')
  ]);

  await browser.close();

  // 处理抖音搜索结果
  let douyinTitles = [];
  if (douyinSearch.results) {
    douyinTitles = douyinSearch.results
      .map(r => r.title.replace(/^【.*?】/, '').trim())
      .filter(t => t.length > 3 && !t.includes('抖音下载') && !t.includes('douyin.com'))
      .slice(0, 8);
  }

  // 处理快手搜索结果
  let kuaishouTitles = [];
  if (kuaishouSearch.results) {
    kuaishouTitles = kuaishouSearch.results
      .map(r => r.title.replace(/^【.*?】/, '').trim())
      .filter(t => t.length > 3 && !t.includes('快手下载') && !t.includes('kuaishou'))
      .slice(0, 8);
  }

  const results = [
    { name: 'B站', titles: [...new Set(bilibili.titles || [])].slice(0, 10), error: bilibili.error },
    { name: '抖音', titles: douyinTitles },
    { name: '快手', titles: kuaishouTitles }
  ];

  // 打印结果
  console.log('\n========== 各平台热门视频 ==========\n');

  for (const r of results) {
    console.log(`\n【${r.name}】`);
    if (r.error) {
      console.log(`  ❌ 抓取失败: ${r.error}`);
    } else if (r.titles.length === 0) {
      console.log('  ⚠️ 暂无数据');
    } else {
      r.titles.forEach((t, i) => {
        const clean = t.replace(/\s+/g, ' ').trim().substring(0, 55);
        if (clean) console.log(`  ${i + 1}. ${clean}`);
      });
    }
  }

  console.log('\n====================================\n');
  console.log('💡 选好视频后告诉我，我帮你生成拍摄脚本！\n');
}

main().catch(err => {
  console.error('失败:', err.message);
  process.exit(1);
});
