const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  
  await page.goto('http://localhost:5179');
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
