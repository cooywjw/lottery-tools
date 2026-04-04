const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  
  // 京东
  const jdPage = await browser.newPage();
  await jdPage.goto('https://search.jd.com/Search?keyword=8GB%20U盘&enc=utf-8');
  await jdPage.waitForTimeout(3000);
  await jdPage.screenshot({ path: 'C:/Users/Administrator/.openclaw/workspace/jd-result.png', fullPage: true });
  console.log('京东截图已保存');
  
  // 获取页面HTML结构片段
  const jdHtml = await jdPage.evaluate(() => {
    const items = document.querySelectorAll('.gl-item');
    return items.length + '个商品，第一个商品HTML: ' + (items[0]?.outerHTML?.substring(0, 500) || '无');
  });
  console.log('京东:', jdHtml);
  
  // 淘宝
  const tbPage = await browser.newPage();
  await tbPage.goto('https://s.taobao.com/search?q=8GB%20U盘');
  await tbPage.waitForTimeout(3000);
  await tbPage.screenshot({ path: 'C:/Users/Administrator/.openclaw/workspace/tb-result.png', fullPage: true });
  console.log('淘宝截图已保存');
  
  const tbHtml = await tbPage.evaluate(() => {
    // 尝试多种选择器
    const selectors = ['.item', '[data-category]', '.Card--doubleCardWrapper', '.MainContent--item'];
    for (const sel of selectors) {
      const items = document.querySelectorAll(sel);
      if (items.length > 0) {
        return items.length + '个商品用选择器 ' + sel + '，第一个HTML: ' + items[0]?.outerHTML?.substring(0, 500);
      }
    }
    return '未找到商品元素';
  });
  console.log('淘宝:', tbHtml);
  
  await browser.close();
})();
