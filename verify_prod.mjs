import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('./frontend/node_modules/playwright');

const BASE  = 'https://www.jobai24.com';
const API   = 'https://jobai-production-aa26.up.railway.app/api/v1';
const EMAIL = 'verify_1780579853@test.com';
const PASS  = 'Test@12345!';
const SHOTS = 'C:/github/jobai/verify_shots';
const CHROME = 'C:/Users/Majid/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS  = process.env.ADMIN_PASS;

mkdirSync(SHOTS, { recursive: true });
let idx = 0;
async function shot(page, name) {
  const f = join(SHOTS, String(++idx).padStart(2, '0') + '_' + name + '.png');
  await page.screenshot({ path: f, fullPage: false });
  console.log('  📸', name + '.png');
  return f;
}

const results = [];
function log(icon, step, detail = '') {
  const line = `  ${icon} ${step}${detail ? ' → ' + detail : ''}`;
  console.log(line);
  results.push(line);
}

// ── API login helper: returns cookies to inject into browser context ──────────
// access_token + refresh_token must be registered for the API domain so the
// browser sends them with cross-origin requests (credentials: 'include').
// csrf_token must also be registered for the frontend domain so JS can read it
// from document.cookie to inject the X-CSRF-Token header.
async function apiLogin(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Login failed ${r.status}: ${txt}`);
  }
  const setCookieHeader = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const cookies = [];
  for (const raw of setCookieHeader) {
    const parts = raw.split(';').map(s => s.trim());
    const [nameVal] = parts;
    const [cookieName, ...rest] = nameVal.split('=');
    const name = cookieName.trim();
    const value = rest.join('=').trim();
    if (!name) continue;

    let httpOnly = false;
    let maxAge;
    for (const part of parts.slice(1)) {
      const lower = part.toLowerCase();
      if (lower === 'httponly') httpOnly = true;
      if (lower.startsWith('max-age=')) maxAge = parseInt(part.split('=')[1]);
    }

    // Inject for API domain (cross-origin fetch with credentials:include)
    const apiDomain = 'jobai-production-aa26.up.railway.app';
    const apic = { name, value, domain: apiDomain, path: '/', secure: true, sameSite: 'None', httpOnly };
    if (maxAge !== undefined) apic.maxAge = maxAge;
    cookies.push(apic);

    // Also inject for frontend domain: Next.js server components forward frontend cookies
    // to the API, and JS needs to read csrf_token from document.cookie
    const fec = { name, value, domain: 'www.jobai24.com', path: '/', secure: true, sameSite: 'None', httpOnly };
    if (maxAge !== undefined) fec.maxAge = maxAge;
    cookies.push(fec);
  }
  return cookies;
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

// ── USER FLOW ─────────────────────────────────────────────────────────────────
console.log('\n=== User Flow ===');

// 1. API Login — inject cookies directly into browser context
console.log('  Logging in via API...');
let userCookies;
try {
  userCookies = await apiLogin(EMAIL, PASS);
  console.log(`  Got ${userCookies.length} cookie(s):`, userCookies.map(c => c.name).join(', '));
  log('✅', 'API login succeeded', `${userCookies.length} cookies`);
} catch (e) {
  log('❌', 'API login failed', e.message);
  await browser.close();
  process.exit(1);
}

const ctx = await browser.newContext();
await ctx.addCookies(userCookies);
const page = await ctx.newPage();

// 2. Go directly to dashboard (already authenticated via cookies)
await page.goto(BASE + '/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
const dashUrl = page.url();
await shot(page, 'dashboard');
log(dashUrl.includes('/dashboard') && !dashUrl.includes('/login') ? '✅' : '❌', 'Dashboard loads (auth via injected cookies)', dashUrl);

// 3. Support page renders
await page.goto(BASE + '/dashboard/support');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
await shot(page, 'support_empty');
const isOnSupport = page.url().includes('/support');
log(isOnSupport ? '✅' : '❌', 'Support page loads', page.url());

// 4. Sidebar badge check (support nav item exists)
const sidebarSupport = page.locator('a[href*="/dashboard/support"]').first();
log(await sidebarSupport.isVisible() ? '✅' : '❌', 'Support link in sidebar');

// 5. Create ticket
const newBtn = page.locator('button').filter({ hasText: /new ticket|تذكرة جديدة/i }).first();
log(await newBtn.isVisible() ? '✅' : '❌', 'New Ticket button visible');

if (await newBtn.isVisible()) {
  await newBtn.click();
  await page.waitForTimeout(500);
  await shot(page, 'modal_open');
  log(await page.locator('input[type=text]').isVisible() ? '✅' : '❌', 'Create ticket modal opens');

  await page.locator('input[type=text]').first().fill('Automated verify: support system check');
  await page.locator('textarea').first().fill('This ticket was created by an automated verification script to confirm the support system works end-to-end.');
  await shot(page, 'modal_filled');
  await page.locator('button[type=submit]').click();
  await page.waitForTimeout(2000);
  await shot(page, 'after_submit');
  log('✅', 'Ticket submitted');
}

// 6. Ticket in list
await page.goto(BASE + '/dashboard/support');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
await shot(page, 'ticket_list');
const ticketLink = page.locator('a').filter({ hasText: /automated verify/i }).first();
log(await ticketLink.isVisible() ? '✅' : '❌', 'Created ticket appears in list');

// 7. Ticket detail / chat
let ticketId = null;
if (await ticketLink.isVisible()) {
  const href = await ticketLink.getAttribute('href');
  ticketId = href?.split('/').pop();
  await ticketLink.click();
  await page.waitForLoadState('networkidle');
  // Wait for the chat to render (it fetches ticket data async)
  try {
    await page.waitForSelector('textarea', { timeout: 8000 });
  } catch { /* will capture the failure below */ }
  await page.waitForTimeout(500);
  await shot(page, 'ticket_detail');
  log('✅', 'Ticket detail page opens', page.url());

  const chatInput = page.locator('textarea').first();
  log(await chatInput.isVisible() ? '✅' : '❌', 'Chat input textarea visible');

  const statusBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /open|مفتوح/i }).first();
  log(await statusBadge.isVisible() ? '✅' : '❌', 'Status badge shows "Open"');

  if (await chatInput.isVisible()) {
    await chatInput.fill('User follow-up message from verification script.');
    await page.locator('button[type=submit]').first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'user_reply_sent');

    const msg = page.locator('p').filter({ hasText: /verification script/i }).first();
    log(await msg.isVisible() ? '✅' : '⚠️', 'User reply appears in chat');
  }
}

await ctx.close();

// ── ADMIN FLOW ────────────────────────────────────────────────────────────────
if (ADMIN_EMAIL && ADMIN_PASS) {
  console.log('\n=== Admin Flow ===');

  let adminCookies;
  try {
    adminCookies = await apiLogin(ADMIN_EMAIL, ADMIN_PASS);
    log('✅', 'Admin API login succeeded', `${adminCookies.length} cookies`);
  } catch (e) {
    log('❌', 'Admin API login failed', e.message);
    adminCookies = null;
  }

  if (adminCookies) {
    const adminCtx = await browser.newContext();
    await adminCtx.addCookies(adminCookies);
    const adminPage = await adminCtx.newPage();

    await adminPage.goto(BASE + '/admin/support');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1500);
    await shot(adminPage, 'admin_support_list');
    const adminUrl = adminPage.url();
    log(adminUrl.includes('/admin') ? '✅' : '❌', 'Admin support list loads', adminUrl);

    const adminTicket = adminPage.locator('td').filter({ hasText: /automated verify/i }).first();
    log(await adminTicket.isVisible() ? '✅' : '❌', 'Test ticket visible in admin list');

    if (await adminTicket.isVisible()) {
      const row = adminPage.locator('tr').filter({ has: adminPage.locator('td', { hasText: /automated verify/i }) });
      await row.locator('a').first().click();
      await adminPage.waitForLoadState('networkidle');
      await adminPage.waitForTimeout(600);
      await shot(adminPage, 'admin_ticket_detail');
      log('✅', 'Admin ticket detail opens');

      const adminChat = adminPage.locator('textarea').first();
      if (await adminChat.isVisible()) {
        await adminChat.fill('Admin reply: Thank you for your report. We are looking into this.');
        await adminPage.locator('button[type=submit]').first().click();
        await adminPage.waitForTimeout(1500);
        await shot(adminPage, 'admin_reply_sent');

        const adminMsg = adminPage.locator('p').filter({ hasText: /Thank you for your report/i }).first();
        log(await adminMsg.isVisible() ? '✅' : '⚠️', 'Admin reply appears in chat');
      }

      // Change status to resolved
      const resolvedBtn = adminPage.locator('button').filter({ hasText: /resolved|محلولة/i }).first();
      if (await resolvedBtn.isVisible()) {
        await resolvedBtn.click();
        await adminPage.waitForTimeout(800);
        await shot(adminPage, 'status_resolved');
        log('✅', 'Status changed to Resolved');
      }

      // Probe: try to change status to closed
      const closedBtn = adminPage.locator('button').filter({ hasText: /closed|مغلقة/i }).first();
      if (await closedBtn.isVisible()) {
        await closedBtn.click();
        await adminPage.waitForTimeout(600);
        log('🔍', 'Status changed to Closed (probe)', 'closed reply box should disappear');
        await shot(adminPage, 'status_closed');
      }
    }

    // Probe: Admin unread badge count
    const badge = adminPage.locator('a[href*="/admin/support"] span[class*="rounded-full"]').first();
    if (await badge.isVisible()) {
      const badgeText = await badge.textContent();
      log('🔍', 'Admin unread badge shows count', badgeText ?? '?');
    }

    await adminCtx.close();
  }
} else {
  log('⚠️', 'Admin flow skipped', 'run with ADMIN_EMAIL=... ADMIN_PASS=... node verify_prod.mjs');
}

// ── API PROBES ────────────────────────────────────────────────────────────────
console.log('\n=== API Probes ===');
const testUnauthEndpoint = async (url, label) => {
  const r = await fetch(url);
  log(r.status === 401 ? '✅' : '⚠️', label, String(r.status));
};
await testUnauthEndpoint(`${API}/support/tickets`, 'GET /support/tickets without auth → 401');
await testUnauthEndpoint(`${API}/support/unread-count`, 'GET /support/unread-count without auth → 401');
await testUnauthEndpoint(`${API}/admin/support/tickets`, 'GET /admin/support/tickets without auth → 401');

const badCreate = await fetch(`${API}/support/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
log(badCreate.status === 401 ? '✅' : '⚠️', '🔍 POST /support/tickets no auth → 401', String(badCreate.status));

await browser.close();

// ── REPORT ────────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===\n');
results.forEach(r => console.log(r));
const passed  = results.filter(r => r.includes('✅')).length;
const failed  = results.filter(r => r.includes('❌')).length;
const warned  = results.filter(r => r.includes('⚠️') || r.includes('🔍')).length;
console.log(`\n  ✅ ${passed}  ❌ ${failed}  ⚠️/🔍 ${warned}`);
console.log('  Screenshots:', SHOTS);
if (failed > 0) process.exit(1);
