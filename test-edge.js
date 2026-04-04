const { chromium } = require('playwright');

(async () => {
  // 使用系统自带的 Edge 浏览器
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const page = await browser.newPage();
  await page.goto('https://www.baidu.com');
  console.log('Edge 浏览器已打开，访问了百度');
  await page.waitForTimeout(5000);
  await browser.close();
})();
