const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  
  const page = await browser.newPage();
  
  // 去哪儿网查机票
  console.log('正在查询上海飞厦门的机票...');
  await page.goto('https://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport=%E4%B8%8A%E6%B5%B7&searchArrivalAirport=%E5%8E%A6%E9%97%A8&searchDepartureTime=2025-03-25&searchArrivalTime=&nextNDays=0&startSearch=true&fromCode=SHA&toCode=XMN&from=qunarindex&lowestPrice=null');
  
  await page.waitForTimeout(5000);
  
  // 截图看看页面
  await page.screenshot({ path: 'C:/Users/Administrator/.openclaw/workspace/flight-result.png', fullPage: true });
  console.log('机票查询页面已截图');
  
  // 尝试抓取航班信息
  const flights = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.flight-item, .b-airfly, .flight');
    
    for (let i = 0; i < Math.min(5, items.length); i++) {
      const item = items[i];
      const airline = item.querySelector('.airline-name, .airline, .company')?.textContent?.trim();
      const depTime = item.querySelector('.dep-time, .departure-time')?.textContent?.trim();
      const arrTime = item.querySelector('.arr-time, .arrival-time')?.textContent?.trim();
      const price = item.querySelector('.price, .lowest-price')?.textContent?.trim();
      
      if (airline || price) {
        results.push({ airline, depTime, arrTime, price });
      }
    }
    return results;
  });
  
  console.log('\n========== 上海 → 厦门 机票 ==========\n');
  if (flights.length > 0) {
    flights.forEach((f, i) => {
      console.log(`${i + 1}. ${f.airline || '未知航司'} | ${f.depTime || '--:--'} - ${f.arrTime || '--:--'} | ¥${f.price || '???'}`);
    });
  } else {
    console.log('未抓取到航班数据，请查看截图');
  }
  console.log('\n=====================================');
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
