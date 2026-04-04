const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.baidu.com');
  console.log('浏览器已打开，访问了百度');
  await page.waitForTimeout(5000);
  await browser.close();
})();
