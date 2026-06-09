const { chromium } = require('./frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const API  = 'https://jobai-production-aa26.up.railway.app/api/v1';
const SHOTS = 'C:/github/jobai/verify_shots';
fs.mkdirSync(SHOTS, { recursive: true });

let shotIdx = 0;
async function shot(page, name) {
  const file = path.join(SHOTS, `${String(++shotIdx).padStart(2,'0')}_${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
  return file;
}

// ── helpers ──────────────────────────────────────────────────────────────────
async function apiPost(endpoint, body, cookies = '') {
  const r = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}) },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  return { status: r.status, body: JSON.parse(txt) };
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const TS   = Date.now();
  const USER_EMAIL  = `testuser_${TS}@verify.local`;
  const USER_PASS   = 'Test@12345!';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASS  = process.env.ADMIN_PASS;

  console.log('\n=== JobAI Support Ticket — Verification ===\n');

  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ||
      'C:/Users/Majid/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });

  const results = [];
  function log(icon, step, detail) {
    const line = `${icon} ${step}${detail ? ' → ' + detail : ''}`;
    console.log(' ', line);
    results.push(line);
  }

  // ── Step 1: Register a new user ──────────────────────────────────────────
  console.log('--- Step 1: Register test user ---');
  const reg = await apiPost('/auth/register', {
    email: USER_EMAIL, password: USER_PASS, full_name: 'Test Verifier'
  });
  if (reg.status === 200 || reg.status === 201) {
    log('✅', 'POST /auth/register', `${reg.status} user created`);
  } else {
    log('❌', 'POST /auth/register', `${reg.status} ${JSON.stringify(reg.body)}`);
    await browser.close(); process.exit(1);
  }

  // ── Step 2: Login to get auth cookie ────────────────────────────────────
  console.log('--- Step 2: Login ---');
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await shot(page, 'login_page');

  await page.fill('input[type="email"]', USER_EMAIL);
  await page.fill('input[type="password"]', USER_PASS);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  const afterLogin = page.url();
  await shot(page, 'after_login');

  if (afterLogin.includes('/dashboard') || afterLogin.includes('/verify')) {
    log('✅', 'Login redirect', afterLogin);
  } else {
    log('❌', 'Login redirect', `unexpected: ${afterLogin}`);
  }

  // ── Step 3: Navigate to support page ────────────────────────────────────
  console.log('--- Step 3: Support page ---');
  await page.goto(`${BASE}/dashboard/support`);
  await page.waitForLoadState('networkidle');
  await shot(page, 'support_list_empty');

  const pageTitle = await page.textContent('h1') ?? await page.textContent('[class*="font-bold"]');
  log('✅', 'Support page loaded', pageTitle?.trim() ?? 'OK');

  // Check for "New Ticket" button
  const newBtn = page.locator('button', { hasText: /new ticket|تذكرة جديدة/i });
  const btnVisible = await newBtn.isVisible();
  log(btnVisible ? '✅' : '❌', 'New Ticket button visible', String(btnVisible));

  // ── Step 4: Create a ticket ──────────────────────────────────────────────
  console.log('--- Step 4: Create ticket ---');
  if (btnVisible) {
    await newBtn.click();
    await page.waitForTimeout(400);
    await shot(page, 'create_ticket_modal');

    const modal = page.locator('[class*="rounded-2xl"]').filter({ hasText: /ticket|تذكرة/i }).first();
    const modalVisible = await modal.isVisible();
    log(modalVisible ? '✅' : '❌', 'Create ticket modal opened', String(modalVisible));

    // Fill the form
    const subjectInput = page.locator('input[type="text"]').first();
    await subjectInput.fill('Test ticket from automated verification');

    const textarea = page.locator('textarea').first();
    await textarea.fill('This is an automated verification of the support ticket system. Please ignore.');

    await shot(page, 'create_ticket_filled');

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await shot(page, 'after_ticket_create');

    // Check modal closed and ticket appeared
    const modalGone = await modal.isHidden();
    log(modalGone ? '✅' : '⚠️', 'Modal closed after submit', String(modalGone));
  }

  // ── Step 5: Verify ticket in list ────────────────────────────────────────
  console.log('--- Step 5: Verify ticket list ---');
  await page.goto(`${BASE}/dashboard/support`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, 'support_list_with_ticket');

  const ticketLink = page.locator('a', { hasText: /automated verification/i }).first();
  const ticketVisible = await ticketLink.isVisible();
  log(ticketVisible ? '✅' : '❌', 'Created ticket appears in list', String(ticketVisible));

  // ── Step 6: Open ticket detail / chat ────────────────────────────────────
  console.log('--- Step 6: Ticket detail page ---');
  if (ticketVisible) {
    await ticketLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await shot(page, 'ticket_detail');

    const chatArea = page.locator('textarea').first();
    const chatVisible = await chatArea.isVisible();
    log(chatVisible ? '✅' : '❌', 'Chat input visible on ticket detail', String(chatVisible));

    // Send a reply from user
    if (chatVisible) {
      await chatArea.fill('This is a follow-up message from the user.');
      const sendBtn = page.locator('button[type="submit"]').first();
      await sendBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'after_user_reply');
      log('✅', 'User sent a reply message');
    }
  }

  // ── Step 7: Admin flow (if credentials provided) ─────────────────────────
  if (ADMIN_EMAIL && ADMIN_PASS) {
    console.log('--- Step 7: Admin view ---');
    const adminCtx = await browser.newContext({ baseURL: BASE });
    const adminPage = await adminCtx.newPage();

    await adminPage.goto(`${BASE}/login`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
    await adminPage.fill('input[type="password"]', ADMIN_PASS);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1000);

    await adminPage.goto(`${BASE}/admin/support`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);
    await shot(adminPage, 'admin_support_list');

    const adminTicket = adminPage.locator('td', { hasText: /automated verification/i }).first();
    const adminTicketVisible = await adminTicket.isVisible();
    log(adminTicketVisible ? '✅' : '❌', 'Ticket visible in admin support list', String(adminTicketVisible));

    if (adminTicketVisible) {
      const ticketRow = adminPage.locator('tr').filter({ has: adminPage.locator('td', { hasText: /automated verification/i }) });
      await ticketRow.locator('a').first().click();
      await adminPage.waitForLoadState('networkidle');
      await adminPage.waitForTimeout(500);
      await shot(adminPage, 'admin_ticket_detail');

      const adminChat = adminPage.locator('textarea').first();
      if (await adminChat.isVisible()) {
        await adminChat.fill('This is the admin reply. Your ticket has been reviewed.');
        const adminSend = adminPage.locator('button[type="submit"]').first();
        await adminSend.click();
        await adminPage.waitForTimeout(1500);
        await shot(adminPage, 'after_admin_reply');
        log('✅', 'Admin sent reply');
      }

      // Change status
      const statusBtn = adminPage.locator('button', { hasText: /resolved|محلولة/i }).first();
      if (await statusBtn.isVisible()) {
        await statusBtn.click();
        await adminPage.waitForTimeout(800);
        await shot(adminPage, 'after_status_change');
        log('✅', 'Admin changed ticket status to resolved');
      }
    }

    await adminCtx.close();
  } else {
    log('⚠️', 'Admin flow skipped', 'set ADMIN_EMAIL and ADMIN_PASS env vars to test admin flow');
  }

  // ── Step 8: Probe — unread badge API ────────────────────────────────────
  console.log('--- Step 8: API probes ---');
  const unreadResp = await fetch(`${API}/support/unread-count`, { credentials: 'include' });
  log(unreadResp.status === 401 ? '✅' : '⚠️', 'GET /support/unread-count without auth', `${unreadResp.status}`);

  const ticketsResp = await fetch(`${API}/support/tickets`, { credentials: 'include' });
  log(ticketsResp.status === 401 ? '✅' : '⚠️', 'GET /support/tickets without auth', `${ticketsResp.status}`);

  const adminResp = await fetch(`${API}/admin/support/tickets`, { credentials: 'include' });
  log(adminResp.status === 401 ? '✅' : '⚠️', 'GET /admin/support/tickets without auth', `${adminResp.status}`);

  // ── Final report ──────────────────────────────────────────────────────────
  await ctx.close();
  await browser.close();

  const passed  = results.filter(r => r.startsWith('  ✅')).length;
  const failed  = results.filter(r => r.startsWith('  ❌')).length;
  const warned  = results.filter(r => r.startsWith('  ⚠️')).length;

  console.log('\n=== Summary ===');
  results.forEach(r => console.log(r));
  console.log(`\n✅ ${passed} passed  ❌ ${failed} failed  ⚠️ ${warned} warnings`);
  console.log(`Screenshots: ${SHOTS}`);

  if (failed > 0) process.exit(1);
})();
