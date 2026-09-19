const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to local server...');
    // Mock authentication so the app thinks we are logged in
    await page.goto('http://localhost:4200');
    await page.evaluate(() => {
        const fakeUser = {
            id: 1,
            email: 'admin@nexthrms.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'Admin',
            permissions: ['module18_view'] // Leave permission
        };
        localStorage.setItem('hrms_auth_token', 'fake-jwt-token');
        localStorage.setItem('hrms_user_data', JSON.stringify(fakeUser));
    });

    // Navigate to Request Center
    console.log('Navigating to Request Center...');
    await page.goto('http://localhost:4200/self-service/requests/leave', { waitUntil: 'networkidle0' });

    // Give it a second to render fully
    await new Promise(r => setTimeout(r, 2000));

    // Capture Screenshot
    const screenshotPath = 'C:\\Users\\Nikhil\\.gemini\\antigravity\\brain\\d58aa302-9d65-4490-8af0-8d708a7424f4\\artifacts\\request_center_screenshot.png';
    console.log(`Saving screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check if Apply Button exists
    const hasApplyButton = await page.evaluate(() => {
        return document.body.innerText.includes('Apply Leave') || document.body.innerText.includes('Apply');
    });
    
    console.log('Does Apply Button exist?:', hasApplyButton);

    await browser.close();
    console.log('Done!');
})();
