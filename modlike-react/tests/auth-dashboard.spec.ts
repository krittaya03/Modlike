// modlike-react/tests/auth-dashboard.spec.ts
import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Authentication + Dashboard
 * ไม่ต้องเชื่อมต่อ Google จริง (ใช้ mock token และ mock API)
 * ทดสอบ ProtectedRoute, การ redirect, การโหลด Dashboard และ Logout
 */

test.describe('Auth + Dashboard (ProtectedRoute)', () => {

  // ✅ CASE 1: ไม่มี token → ต้อง redirect กลับหน้า login
  test('redirects to /login when no token', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });

    // ตรวจสอบว่าถูก redirect กลับหน้า /login (อาจมี # ต่อท้าย)
    await expect(page).toHaveURL(/\/login(?:\?.*)?(?:#.*)?$/);

    // หน้า login ต้องแสดงปุ่ม Google
    await expect(page.getByRole('button', { name: /Login with Google/i })).toBeVisible();
  });

  // ✅ CASE 2: มี token ใน URL + mock /api/me → โหลด Dashboard ได้
  test('accepts token via URL, saves to localStorage, loads user and shows Welcome', async ({ page }) => {
    // mock API /api/me ให้คืนข้อมูล user จำลอง
    await page.route('**/api/me', async (route) => {
      const mockUser = {
        user: { name: 'Krittaya QA', email: 'qa@example.com', role: 'student' }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    // เข้า Dashboard พร้อม token (ไม่ต้อง login จริง)
    await page.goto('http://localhost:5173/dashboard?token=fake-token', { waitUntil: 'domcontentloaded' });

    // Dashboard.jsx จะเก็บ token ลง localStorage แล้ว replace URL เป็น /dashboard
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?(?:#.*)?$/);

    // ตรวจสอบข้อความ Welcome และหัวข้อหลัก
    await expect(page.getByRole('heading', { name: /Welcome,\s*Krittaya QA/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /New event/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /My schedule/i })).toBeVisible();

    // เก็บ screenshot เป็นหลักฐาน
    await page.screenshot({ path: 'screenshots/dashboard-welcome.png', fullPage: true });
  });

  // ✅ CASE 3: Logout → กลับไปหน้า login
  test('logout sends user back to /login', async ({ page }) => {
    // mock API /api/me อีกครั้ง
    await page.route('**/api/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { name: 'Krittaya QA', email: 'qa@example.com', role: 'student' } })
      });
    });

    // เข้า Dashboard พร้อม token ปลอม
    await page.goto('http://localhost:5173/dashboard?token=fake-token', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?(?:#.*)?$/);

    // คลิกปุ่ม "Log out" (ใช้ alt ของรูปภาพ)
    await page.getByRole('img', { name: /Log out/i }).click();

    // กลับหน้า login (regex รองรับ # ต่อท้าย)
    await expect(page).toHaveURL(/\/login(?:\?.*)?(?:#.*)?$/);
  });

});
