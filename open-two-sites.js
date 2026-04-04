const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  
  // 打开两个页面
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  
  // 京东
  await page1.goto('https://www.jd.com');
  console.log('✓ 京东已打开');
  
  // 淘宝
  await page2.goto('https://www.taobao.com');
  console.log('✓ 淘宝已打开');
  
  console.log('\n京东和淘宝已打开，请手动登录');
  console.log('登录完成后告诉我，我来搜索 8GB U盘');
  
  // 保持浏览器打开
  await new Promise(() => {});
})();
