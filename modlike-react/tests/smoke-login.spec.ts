// modlike-react/tests/smoke-login.spec.ts
import { test, expect } from '@playwright/test';

// @smoke: ยืนยันว่าแอปรันและหน้า Login แสดงครบ
test.describe('Smoke (@smoke)', () => {
  test('Login page renders and has Google button', async ({ page }) => {
    // 👇 ใส่ตรงนี้เลย
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });

    // มีหัวข้อหลักตามดีไซน์
    await expect(page.getByRole('heading', { name: /MOD LIKE/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Let's make your plan!/i })).toBeVisible();

    // ปุ่ม Login with Google (ปุ่มแท้จริงเป็น <button class="loggoo">)
    await expect(page.getByRole('button', { name: /Login with Google/i })).toBeVisible();

    // สกรีนช็อตเก็บเป็นหลักฐาน
    await page.screenshot({ path: 'screenshots/smoke-login.png', fullPage: true });
  });
});
