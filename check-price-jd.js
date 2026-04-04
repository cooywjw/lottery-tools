const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const page = await browser.newPage();
  
  // 访问京东并搜索
  await page.goto('https://search.jd.com/Search?keyword=8GB%20U盘&enc=utf-8');
  console.log('已打开京东搜索页面，等待加载...');
  
  // 等待更久，确保商品加载
  await page.waitForTimeout(5000);
  
  // 截图看看页面状态
  await page.screenshot({ path: 'C:/Users/Administrator/.openclaw/workspace/jd-search.png', fullPage: true });
  console.log('已截图保存到 jd-search.png');
  
  // 尝试多种选择器抓取价格
  const items = await page.evaluate(() => {
    const results = [];
    // 尝试不同的选择器
    const products = document.querySelectorAll('.gl-item, .s-item, [data-sku]');
    console.log('找到商品数:', products.length);
    
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const p = products[i];
      // 尝试多种价格选择器
      const priceEl = p.querySelector('.p-price i, .p-price strong, .price, .p-price .J_price');
      const nameEl = p.querySelector('.p-name a, .p-name em, .s-title, h3 a');
      
      const price = priceEl?.textContent?.trim() || '';
      const name = nameEl?.textContent?.trim() || '';
      
      if (name || price) {
        results.push({ name: name.substring(0, 60), price });
      }
    }
    return results;
  });
  
  console.log('抓取结果：', items.length, '条');
  items.forEach((item, i) => {
    console.log(`${i + 1}. ${item.price ? '¥' + item.price : '价格未知'} - ${item.name || '名称未知'}`);
  });
  
  await page.waitForTimeout(3000);
  await browser.close();
})();
