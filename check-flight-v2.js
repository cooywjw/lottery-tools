const { chromium } = require('playwright');

(async () => {
  // 方法1+2: 模拟真人 + 伪装
  const browser = await chromium.launch({ 
    headless: false,  // 有界面模式更像真人
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: [
      '--disable-blink-features=AutomationControlled',  // 禁用自动化标志
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },  // 正常分辨率
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',  // 伪装User-Agent
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });
  
  const page = await context.newPage();
  
  // 方法3: 模拟真人行为 - 先访问首页
  console.log('模拟真人访问...');
  await page.goto('https://www.qunar.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000 + Math.random() * 2000);  // 随机延迟
  
  // 模拟鼠标移动
  await page.mouse.move(100, 100);
  await page.waitForTimeout(500);
  await page.mouse.move(300, 200);
  await page.waitForTimeout(500);
  
  // 点击机票入口
  const flightLink = await page.$('a[href*="flight"]');
  if (flightLink) {
    await flightLink.click();
    await page.waitForTimeout(2000);
  }
  
  // 方法4: 直接访问搜索结果页
  console.log('正在查询明天上海飞厦门的机票...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '-');
  
  const searchUrl = `https://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport=上海&searchArrivalAirport=厦门&searchDepartureTime=${dateStr}&startSearch=true`;
  
  await page.goto(searchUrl, { waitUntil: 'networkidle' });
  
  // 等待加载，模拟真人看页面
  console.log('等待页面加载...');
  await page.waitForTimeout(5000 + Math.random() * 3000);
  
  // 滚动页面模拟浏览
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy(0, 300));
  
  // 截图
  await page.screenshot({ path: 'C:/Users/Administrator/.openclaw/workspace/flight-v2.png', fullPage: true });
  console.log('页面已截图');
  
  // 尝试多种选择器抓取
  const flights = await page.evaluate(() => {
    const results = [];
    
    // 尝试多种可能的选择器
    const selectors = [
      '.flight-item',
      '.b-airfly',
      '[data-spm*="flight"]',
      '.flight-list .item',
      '.result-item'
    ];
    
    for (const selector of selectors) {
      const items = document.querySelectorAll(selector);
      console.log('选择器', selector, '找到', items.length, '个');
      
      if (items.length > 0) {
        for (let i = 0; i < Math.min(3, items.length); i++) {
          const item = items[i];
          const text = item.textContent || '';
          results.push({
            selector,
            index: i,
            text: text.substring(0, 200)
          });
        }
        break;
      }
    }
    
    // 如果都没找到，返回页面上的所有文本信息
    if (results.length === 0) {
      const priceElements = document.querySelectorAll('*');
      for (const el of priceElements) {
        if (el.textContent && el.textContent.includes('¥') && el.textContent.match(/\d{3,4}/)) {
          results.push({ priceText: el.textContent.trim().substring(0, 100) });
          if (results.length >= 5) break;
        }
      }
    }
    
    return results;
  });
  
  console.log('\n========== 查询结果 ==========\n');
  if (flights.length > 0) {
    flights.forEach((f, i) => {
      console.log(`${i + 1}.`, f.text || f.priceText || JSON.stringify(f));
    });
  } else {
    console.log('未抓取到航班数据');
    console.log('页面标题:', await page.title());
  }
  console.log('\n==============================');
  
  // 保持页面打开供查看
  console.log('页面保持打开，请手动查看');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
