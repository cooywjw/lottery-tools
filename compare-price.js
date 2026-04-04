const { chromium } = require('playwright');

(async () => {
  // 连接已打开的浏览器（需要知道调试端口，这里重新打开）
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  
  const context = await browser.newContext();
  
  // ===== 京东 =====
  console.log('正在查询京东...');
  const jdPage = await context.newPage();
  await jdPage.goto('https://search.jd.com/Search?keyword=8GB%20U盘&enc=utf-8&suggest=1.def.0.base');
  await jdPage.waitForTimeout(3000);
  
  const jdItems = await jdPage.evaluate(() => {
    const items = [];
    const products = document.querySelectorAll('.gl-item');
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const p = products[i];
      const nameEl = p.querySelector('.p-name a');
      const priceEl = p.querySelector('.p-price .J_price');
      const shopEl = p.querySelector('.p-shop a');
      
      if (nameEl && priceEl) {
        items.push({
          name: nameEl.textContent.trim().substring(0, 50),
          price: priceEl.textContent.trim(),
          shop: shopEl?.textContent?.trim() || '京东自营'
        });
      }
    }
    return items;
  });
  
  // ===== 淘宝 =====
  console.log('正在查询淘宝...');
  const tbPage = await context.newPage();
  await tbPage.goto('https://s.taobao.com/search?q=8GB%20U盘');
  await tbPage.waitForTimeout(3000);
  
  const tbItems = await tbPage.evaluate(() => {
    const items = [];
    // 淘宝的页面结构
    const products = document.querySelectorAll('[data-category="auctions"] .item, .Card--doubleCardWrapper--L2XFE73');
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const p = products[i];
      const nameEl = p.querySelector('.title a, .Text--title--jOqRVdF');
      const priceEl = p.querySelector('.price .num, .Price--priceInt--ZlsSi_M');
      const shopEl = p.querySelector('.shop a, .Text--shopNameText--yQdXzP7');
      
      if (nameEl && priceEl) {
        items.push({
          name: nameEl.textContent.trim().substring(0, 50),
          price: priceEl.textContent.trim(),
          shop: shopEl?.textContent?.trim() || '淘宝店铺'
        });
      }
    }
    return items;
  });
  
  // 输出结果
  console.log('\n========== 8GB U盘 价格对比 ==========\n');
  
  console.log('【京东】');
  if (jdItems.length > 0) {
    jdItems.forEach((item, i) => {
      console.log(`${i + 1}. ¥${item.price} | ${item.name} | ${item.shop}`);
    });
  } else {
    console.log('未抓取到数据，可能需要调整选择器');
  }
  
  console.log('\n【淘宝】');
  if (tbItems.length > 0) {
    tbItems.forEach((item, i) => {
      console.log(`${i + 1}. ¥${item.price} | ${item.name} | ${item.shop}`);
    });
  } else {
    console.log('未抓取到数据，可能需要调整选择器');
  }
  
  console.log('\n=====================================');
  
  await jdPage.waitForTimeout(5000);
  await browser.close();
})();
