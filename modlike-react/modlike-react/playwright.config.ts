import { defineConfig, devices } from '@playwright/test';

const url = process.env.WEB_URL || 'http://localhost:5173'; // default Vite dev server URL

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // ✅ HTML report สำหรับดูผลการทดสอบย้อนหลัง
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: url,
    trace: 'on-first-retry',          // เก็บ trace เฉพาะตอนรันพลาด
    screenshot: 'only-on-failure',    // ถ้าล้มถึงจะจับภาพ
    video: 'retain-on-failure',       // บันทึกวิดีโอเมื่อเทสต์ล้ม
  },

  // ✅ ให้ Playwright เปิด dev server ของ Vite ให้อัตโนมัติ
  webServer: {
    command: 'npm run dev',
    url,
    reuseExistingServer: true,  // ถ้า server รันอยู่แล้วจะไม่เปิดใหม่
    timeout: 120_000,           // เผื่อเวลาสำหรับ build
  },

  // ✅ กำหนด browser ที่จะใช้
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    // เพิ่ม Firefox หรือ Safari ได้ถ้าต้องการ
    // { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
  ],
});
