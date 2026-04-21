<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JobAI – منصة التوظيف الذكي</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0c0d0f;
    --ink2: #3a3d45;
    --ink3: #7a7e8a;
    --paper: #f7f6f2;
    --white: #ffffff;
    --accent: #1a3cff;
    --accent-light: #e8ecff;
    --accent-mid: #4d6aff;
    --gold: #d4a853;
    --gold-light: #fdf6e3;
    --success: #0f7d5a;
    --success-light: #e0f5ec;
    --border: rgba(12,13,15,0.08);
    --border-strong: rgba(12,13,15,0.15);
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 22px;
    --radius-xl: 32px;
    --shadow-soft: 0 2px 20px rgba(12,13,15,0.06);
    --shadow-card: 0 4px 40px rgba(12,13,15,0.09);
    --font: 'Cairo', sans-serif;
    --mono: 'IBM Plex Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font);
    background: var(--paper);
    color: var(--ink);
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ─── NAV ─── */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48px;
    height: 68px;
    background: rgba(247,246,242,0.92);
    backdrop-filter: blur(16px);
    border-bottom: 0.5px solid var(--border);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .nav-logo-mark {
    width: 36px;
    height: 36px;
    background: var(--ink);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    color: var(--white);
    letter-spacing: -0.5px;
  }

  .nav-logo-text {
    font-size: 17px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.3px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 32px;
    list-style: none;
  }

  .nav-links a {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink2);
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-links a:hover { color: var(--ink); }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 20px;
    height: 40px;
    border-radius: 100px;
    font-family: var(--font);
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-ghost {
    background: transparent;
    color: var(--ink2);
    border: 1px solid var(--border-strong);
  }

  .btn-ghost:hover {
    background: var(--white);
    color: var(--ink);
  }

  .btn-primary {
    background: var(--ink);
    color: var(--white);
  }

  .btn-primary:hover {
    background: #1c1f2a;
    transform: translateY(-1px);
  }

  .btn-accent {
    background: var(--accent);
    color: var(--white);
  }

  .btn-accent:hover {
    background: var(--accent-mid);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(26,60,255,0.3);
  }

  .btn-lg {
    height: 52px;
    padding: 0 28px;
    font-size: 15px;
    border-radius: 100px;
  }

  /* ─── HERO ─── */
  .hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 64px;
    padding: 120px 80px 80px;
    position: relative;
    overflow: hidden;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: -200px;
    left: -200px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(26,60,255,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero::after {
    content: '';
    position: absolute;
    bottom: -100px;
    right: -100px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--accent-light);
    border: 1px solid rgba(26,60,255,0.15);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.5px;
    margin-bottom: 24px;
  }

  .hero-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .hero-title {
    font-size: clamp(38px, 5vw, 62px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1.5px;
    color: var(--ink);
    margin-bottom: 20px;
  }

  .hero-title em {
    font-style: normal;
    color: var(--accent);
    position: relative;
  }

  .hero-desc {
    font-size: 17px;
    font-weight: 400;
    color: var(--ink2);
    line-height: 1.8;
    max-width: 480px;
    margin-bottom: 36px;
  }

  .hero-cta-row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 48px;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 28px;
    padding-top: 32px;
    border-top: 1px solid var(--border);
  }

  .hero-stat-item { text-align: center; }

  .hero-stat-num {
    font-family: var(--mono);
    font-size: 26px;
    font-weight: 600;
    color: var(--ink);
    display: block;
    letter-spacing: -1px;
  }

  .hero-stat-label {
    font-size: 12px;
    color: var(--ink3);
    font-weight: 600;
    display: block;
    margin-top: 2px;
  }

  .hero-stat-sep {
    width: 1px;
    height: 40px;
    background: var(--border-strong);
  }

  /* ─── HERO VISUAL ─── */
  .hero-visual {
    position: relative;
    z-index: 1;
  }

  .cv-card {
    background: var(--white);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-card);
    padding: 28px;
    position: relative;
    overflow: hidden;
    animation: floatUp 0.8s ease both;
  }

  @keyframes floatUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cv-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
  }

  .cv-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e8ecff, #c4d0ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 900;
    color: var(--accent);
  }

  .cv-user-info { flex: 1; margin-right: 14px; }

  .cv-user-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }

  .cv-user-role {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 2px;
  }

  .ats-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--success-light);
    border: 1px solid rgba(15,125,90,0.15);
    border-radius: var(--radius-md);
    padding: 10px 16px;
  }

  .ats-num {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 600;
    color: var(--success);
    line-height: 1;
  }

  .ats-label {
    font-size: 10px;
    color: var(--success);
    font-weight: 700;
    margin-top: 3px;
    letter-spacing: 0.5px;
  }

  .skills-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }

  .skill-chip {
    padding: 5px 12px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--border-strong);
    color: var(--ink2);
    background: var(--paper);
  }

  .skill-chip.matched {
    background: var(--accent-light);
    border-color: rgba(26,60,255,0.2);
    color: var(--accent);
  }

  .match-bar-wrap {
    margin-bottom: 14px;
  }

  .match-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--ink3);
    font-weight: 600;
    margin-bottom: 6px;
  }

  .match-bar-track {
    height: 6px;
    background: var(--border);
    border-radius: 100px;
    overflow: hidden;
  }

  .match-bar-fill {
    height: 100%;
    border-radius: 100px;
    background: linear-gradient(90deg, var(--accent), var(--accent-mid));
  }

  .floating-card {
    position: absolute;
    background: var(--white);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-card);
    padding: 14px 18px;
    animation: floatUp 1s ease both;
  }

  .floating-card-1 {
    bottom: -20px;
    left: -30px;
    animation-delay: 0.3s;
    min-width: 180px;
  }

  .floating-card-2 {
    top: 40px;
    left: -50px;
    animation-delay: 0.6s;
    min-width: 160px;
  }

  .float-label {
    font-size: 11px;
    color: var(--ink3);
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .float-value {
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
  }

  .float-sub {
    font-size: 11px;
    color: var(--ink3);
    margin-top: 2px;
  }

  /* ─── SECTION LAYOUT ─── */
  .section {
    padding: 96px 80px;
  }

  .section-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .section-title {
    font-size: clamp(30px, 4vw, 48px);
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1.1;
    color: var(--ink);
    margin-bottom: 18px;
  }

  .section-desc {
    font-size: 16px;
    color: var(--ink2);
    line-height: 1.8;
    max-width: 580px;
  }

  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 56px;
    gap: 40px;
  }

  /* ─── SERVICES ─── */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .service-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 36px 32px;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
    text-decoration: none;
    display: block;
    color: inherit;
  }

  .service-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: transparent;
    transition: background 0.25s;
  }

  .service-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card);
    border-color: rgba(26,60,255,0.15);
  }

  .service-card:hover::before {
    background: linear-gradient(90deg, var(--accent), var(--accent-mid));
  }

  .service-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    font-size: 22px;
  }

  .service-icon-1 { background: var(--accent-light); }
  .service-icon-2 { background: var(--gold-light); }
  .service-icon-3 { background: var(--success-light); }

  .service-num {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--ink3);
    letter-spacing: 1px;
    display: block;
    margin-bottom: 10px;
  }

  .service-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 12px;
    letter-spacing: -0.3px;
  }

  .service-desc {
    font-size: 14px;
    color: var(--ink2);
    line-height: 1.75;
    margin-bottom: 24px;
  }

  .service-link {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ─── HOW IT WORKS ─── */
  .how-section {
    background: var(--ink);
    color: var(--white);
    padding: 96px 80px;
  }

  .how-section .section-eyebrow { color: #6b86ff; }
  .how-section .section-title { color: var(--white); }
  .how-section .section-desc { color: rgba(255,255,255,0.55); }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: rgba(255,255,255,0.08);
    border-radius: var(--radius-xl);
    overflow: hidden;
    margin-top: 56px;
  }

  .step-item {
    background: var(--ink);
    padding: 44px 36px;
    position: relative;
    transition: background 0.2s;
  }

  .step-item:hover {
    background: #141720;
  }

  .step-number {
    font-family: var(--mono);
    font-size: 48px;
    font-weight: 600;
    color: rgba(255,255,255,0.06);
    position: absolute;
    top: 28px;
    left: 28px;
    line-height: 1;
    pointer-events: none;
  }

  .step-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    background: rgba(26,60,255,0.15);
    border: 1px solid rgba(26,60,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    font-size: 20px;
  }

  .step-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 12px;
    letter-spacing: -0.3px;
  }

  .step-desc {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    line-height: 1.75;
  }

  /* ─── FEATURES BENTO ─── */
  .bento-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 20px;
  }

  .bento-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 36px;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
  }

  .bento-card:hover {
    box-shadow: var(--shadow-card);
  }

  .bento-card.wide {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 48px;
  }

  .bento-card.accent-bg {
    background: var(--accent);
    border-color: transparent;
    color: var(--white);
  }

  .bento-card.gold-bg {
    background: #1a1200;
    border-color: rgba(212,168,83,0.2);
    color: var(--white);
  }

  .bento-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
  }

  .bento-tag-blue {
    background: var(--accent-light);
    color: var(--accent);
  }

  .bento-tag-white {
    background: rgba(255,255,255,0.15);
    color: white;
  }

  .bento-tag-gold {
    background: rgba(212,168,83,0.15);
    color: var(--gold);
  }

  .bento-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }

  .bento-desc {
    font-size: 14px;
    line-height: 1.75;
    color: var(--ink2);
  }

  .bento-card.accent-bg .bento-desc,
  .bento-card.gold-bg .bento-desc {
    color: rgba(255,255,255,0.6);
  }

  .bento-card.accent-bg .bento-title,
  .bento-card.gold-bg .bento-title {
    color: var(--white);
  }

  /* Mini dashboard preview */
  .mini-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .mini-stat {
    background: var(--paper);
    border-radius: var(--radius-md);
    padding: 14px;
    border: 1px solid var(--border);
  }

  .mini-stat-label {
    font-size: 10px;
    color: var(--ink3);
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: block;
  }

  .mini-stat-val {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 600;
    color: var(--ink);
    display: block;
  }

  /* ─── JOBS ─── */
  .jobs-section { background: var(--paper); }

  .jobs-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .job-row {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 22px 28px;
    display: flex;
    align-items: center;
    gap: 20px;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .job-row:hover {
    border-color: rgba(26,60,255,0.2);
    box-shadow: var(--shadow-soft);
    transform: translateX(-4px);
  }

  .job-company-logo {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    background: var(--paper);
  }

  .job-info { flex: 1; }

  .job-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 4px;
    letter-spacing: -0.2px;
  }

  .job-meta {
    font-size: 13px;
    color: var(--ink3);
  }

  .job-tags {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .job-tag {
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--border-strong);
    color: var(--ink2);
  }

  .job-tag.remote {
    background: var(--success-light);
    border-color: rgba(15,125,90,0.15);
    color: var(--success);
  }

  .job-match {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-light);
    padding: 4px 10px;
    border-radius: 100px;
  }

  .jobs-cta-row {
    text-align: center;
    margin-top: 36px;
  }

  /* ─── TESTIMONIALS / WHY ─── */
  .why-section {
    background: var(--white);
    padding: 96px 80px;
  }

  .why-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-top: 56px;
  }

  .why-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 32px 28px;
    transition: all 0.2s;
  }

  .why-card:hover {
    border-color: rgba(26,60,255,0.15);
    box-shadow: var(--shadow-soft);
  }

  .why-icon {
    font-size: 28px;
    margin-bottom: 18px;
    display: block;
  }

  .why-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 10px;
    letter-spacing: -0.3px;
  }

  .why-desc {
    font-size: 14px;
    color: var(--ink2);
    line-height: 1.75;
  }

  /* ─── CTA BANNER ─── */
  .cta-section {
    padding: 96px 80px;
    background: var(--paper);
  }

  .cta-banner {
    background: var(--ink);
    border-radius: var(--radius-xl);
    padding: 72px 80px;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
    gap: 64px;
    position: relative;
    overflow: hidden;
  }

  .cta-banner::before {
    content: '';
    position: absolute;
    top: -150px; left: -150px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(26,60,255,0.3) 0%, transparent 70%);
    pointer-events: none;
  }

  .cta-banner::after {
    content: '';
    position: absolute;
    bottom: -100px; right: -100px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .cta-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #6b86ff;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .cta-title {
    font-size: 38px;
    font-weight: 900;
    color: var(--white);
    letter-spacing: -1px;
    line-height: 1.15;
    margin-bottom: 16px;
  }

  .cta-desc {
    font-size: 15px;
    color: rgba(255,255,255,0.55);
    line-height: 1.8;
  }

  .cta-actions {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  .btn-cta-primary {
    background: var(--white);
    color: var(--ink);
    height: 54px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    gap: 8px;
    transition: all 0.2s;
  }

  .btn-cta-primary:hover {
    background: var(--paper);
    transform: translateY(-2px);
  }

  .btn-cta-ghost {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.7);
    height: 54px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border: 1px solid rgba(255,255,255,0.1);
    gap: 8px;
    transition: all 0.2s;
  }

  .btn-cta-ghost:hover {
    background: rgba(255,255,255,0.12);
    color: var(--white);
  }

  /* ─── FOOTER ─── */
  footer {
    background: var(--ink);
    padding: 48px 80px 32px;
    color: rgba(255,255,255,0.5);
  }

  .footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .footer-logo-mark {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--white);
  }

  .footer-brand-name {
    font-size: 15px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
  }

  .footer-copy {
    font-size: 13px;
  }

  .footer-links {
    display: flex;
    gap: 24px;
  }

  .footer-links a {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: rgba(255,255,255,0.8);
  }

  /* ─── RECRUITER SECTION ─── */
  .recruiter-section {
    background: var(--paper);
    padding: 96px 80px;
  }

  .recruiter-panel {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    min-height: 400px;
  }

  .recruiter-content {
    padding: 56px 48px;
  }

  .recruiter-visual {
    background: var(--ink);
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: center;
  }

  .candidate-row {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: var(--radius-md);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .candidate-av {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .av-blue { background: rgba(26,60,255,0.2); color: #6b86ff; }
  .av-gold { background: rgba(212,168,83,0.2); color: var(--gold); }
  .av-green { background: rgba(15,125,90,0.2); color: #2dcc9b; }

  .candidate-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
    display: block;
  }

  .candidate-role {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    display: block;
  }

  .candidate-score {
    margin-right: auto;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
  }

  .score-high { color: #2dcc9b; }
  .score-mid { color: var(--gold); }

  .candidate-stage {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 100px;
    letter-spacing: 0.5px;
  }

  .stage-shortlist {
    background: rgba(26,60,255,0.15);
    color: #6b86ff;
  }

  .stage-interview {
    background: rgba(212,168,83,0.15);
    color: var(--gold);
  }

  .stage-new {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
  }

  /* Scroll animations */
  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 900px) {
    nav { padding: 0 24px; }
    .nav-links { display: none; }
    .hero { grid-template-columns: 1fr; padding: 100px 24px 60px; gap: 48px; }
    .floating-card-1, .floating-card-2 { display: none; }
    .section { padding: 64px 24px; }
    .services-grid, .steps-grid, .why-grid { grid-template-columns: 1fr; }
    .bento-grid { grid-template-columns: 1fr; }
    .bento-card.wide { grid-template-columns: 1fr; }
    .how-section { padding: 64px 24px; }
    .cta-section { padding: 64px 24px; }
    .cta-banner { grid-template-columns: 1fr; padding: 48px 32px; gap: 36px; }
    footer { padding: 40px 24px; }
    .footer-inner { flex-direction: column; gap: 24px; text-align: center; }
    .recruiter-section { padding: 64px 24px; }
    .recruiter-panel { grid-template-columns: 1fr; }
    .steps-grid { grid-template-columns: 1fr; }
    .jobs-section.section { padding: 64px 24px; }
    .why-section { padding: 64px 24px; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-logo">
    <div class="nav-logo-mark">JA</div>
    <span class="nav-logo-text">JobAI</span>
  </a>
  <ul class="nav-links">
    <li><a href="#services">خدماتنا</a></li>
    <li><a href="#how">كيف يعمل</a></li>
    <li><a href="#jobs">الوظائف</a></li>
    <li><a href="#recruiters">للمسؤولين</a></li>
  </ul>
  <div class="nav-actions">
    <a href="/login" class="btn btn-ghost">تسجيل دخول</a>
    <a href="/register" class="btn btn-primary">ابدأ مجاناً</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-content" style="position:relative;z-index:1;">
    <div class="hero-badge">
      <div class="hero-badge-dot"></div>
      منصة توظيف ذكية بالعربية
    </div>
    <h1 class="hero-title">
      ابنِ مسارك<br>
      المهني مع<br>
      <em>ذكاء اصطناعي</em>
    </h1>
    <p class="hero-desc">
      JobAI تحلل سيرتك الذاتية، تطابقها مع أفضل الوظائف، وتعدّك للمقابلات — كل ذلك بتجربة عربية أصيلة ومصممة لأكثر المهنيين طموحاً.
    </p>
    <div class="hero-cta-row">
      <a href="/register" class="btn btn-accent btn-lg">ابدأ مجاناً ←</a>
      <a href="#how" class="btn btn-ghost btn-lg">كيف يعمل؟</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat-item">
        <span class="hero-stat-num">+10k</span>
        <span class="hero-stat-label">سيرة ذاتية محللة</span>
      </div>
      <div class="hero-stat-sep"></div>
      <div class="hero-stat-item">
        <span class="hero-stat-num">97%</span>
        <span class="hero-stat-label">رضا المستخدمين</span>
      </div>
      <div class="hero-stat-sep"></div>
      <div class="hero-stat-item">
        <span class="hero-stat-num">3×</span>
        <span class="hero-stat-label">أسرع في التطابق</span>
      </div>
    </div>
  </div>

  <!-- Hero Visual -->
  <div class="hero-visual">
    <div class="cv-card">
      <div class="cv-card-header">
        <div class="cv-avatar">أ</div>
        <div class="cv-user-info">
          <div class="cv-user-name">أحمد الشمري</div>
          <div class="cv-user-role">محلل بيانات ذكاء اصطناعي</div>
        </div>
        <div class="ats-badge">
          <span class="ats-num">87</span>
          <span class="ats-label">ATS</span>
        </div>
      </div>

      <div class="match-bar-wrap">
        <div class="match-bar-label">
          <span>تطابق مهارات Python</span>
          <span>92%</span>
        </div>
        <div class="match-bar-track">
          <div class="match-bar-fill" style="width:92%"></div>
        </div>
      </div>

      <div class="match-bar-wrap">
        <div class="match-bar-label">
          <span>تطابق الخبرة</span>
          <span>78%</span>
        </div>
        <div class="match-bar-track">
          <div class="match-bar-fill" style="width:78%"></div>
        </div>
      </div>

      <div class="skills-row" style="margin-top:20px;">
        <span class="skill-chip matched">Python</span>
        <span class="skill-chip matched">AI/ML</span>
        <span class="skill-chip matched">SQL</span>
        <span class="skill-chip">TensorFlow</span>
        <span class="skill-chip">Docker</span>
      </div>

      <div style="background:var(--accent-light);border-radius:var(--radius-md);padding:14px 16px;margin-top:16px;">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.5px;margin-bottom:6px;">توصية AI</div>
        <div style="font-size:13px;color:var(--ink);line-height:1.6;">أضف خبرة TensorFlow لرفع درجة التطابق بنسبة +9%</div>
      </div>
    </div>

    <!-- Floating cards -->
    <div class="floating-card floating-card-2">
      <div class="float-label">وظيفة مقترحة</div>
      <div class="float-value" style="font-size:14px;font-weight:700;color:var(--ink);">مهندس ذكاء اصطناعي</div>
      <div class="float-sub">Elm Tech · الرياض</div>
    </div>

    <div class="floating-card floating-card-1">
      <div class="float-label">مقابلات جاهزة</div>
      <div class="float-value">12</div>
      <div class="float-sub">سؤال مخصص لملفك</div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section class="section" id="services" style="background:var(--white);">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div>
        <p class="section-eyebrow">خدماتنا</p>
        <h2 class="section-title">أدوات توظيف متكاملة<br>لكل مرحلة</h2>
      </div>
      <p class="section-desc">من تحليل السيرة إلى مطابقة الوظائف وإعداد المقابلات — كل شيء في مكان واحد ومصمم للعربية أولاً.</p>
    </div>
    <div class="services-grid">
      <a href="#" class="service-card fade-in">
        <div class="service-icon service-icon-1">🔍</div>
        <span class="service-num">01</span>
        <div class="service-name">تحليل السيرة الذاتية</div>
        <p class="service-desc">احصل على تقييم ذكي لسيرتك الذاتية مع درجة ATS مفصّلة، نقاط قوة وضعف، وقائمة تحسينات قابلة للتنفيذ.</p>
        <div class="service-link">اكتشف المزيد <span>←</span></div>
      </a>
      <a href="#" class="service-card fade-in">
        <div class="service-icon service-icon-2">🎯</div>
        <span class="service-num">02</span>
        <div class="service-name">مطابقة الوظائف</div>
        <p class="service-desc">تطابق ذكي بين سيرتك والوظائف المتاحة مع شرح تفصيلي لأسباب التطابق والمهارات المطلوبة لتحسينه.</p>
        <div class="service-link">اكتشف المزيد <span>←</span></div>
      </a>
      <a href="#" class="service-card fade-in">
        <div class="service-icon service-icon-3">🎤</div>
        <span class="service-num">03</span>
        <div class="service-name">تحضير المقابلات</div>
        <p class="service-desc">جلسات مقابلة تفاعلية بالذكاء الاصطناعي بأسئلة مخصصة لملفك المهني والوظيفة المستهدفة مع تقييم فوري.</p>
        <div class="service-link">اكتشف المزيد <span>←</span></div>
      </a>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div>
        <p class="section-eyebrow">كيف يعمل</p>
        <h2 class="section-title" style="color:white;">ستة خطوات نحو<br>وظيفتك المثالية</h2>
      </div>
      <p class="section-desc">رحلة موجّهة تأخذك من رفع سيرتك حتى الحصول على الوظيفة.</p>
    </div>
    <div class="steps-grid fade-in">
      <div class="step-item">
        <div class="step-number">01</div>
        <div class="step-icon-wrap">📄</div>
        <div class="step-title">ارفع سيرتك</div>
        <p class="step-desc">ارفع سيرتك الذاتية ويقوم الذكاء الاصطناعي باستخراج وتحليل جميع بياناتك المهنية فورياً.</p>
      </div>
      <div class="step-item">
        <div class="step-number">02</div>
        <div class="step-icon-wrap">📊</div>
        <div class="step-title">احصل على تحليلك</div>
        <p class="step-desc">درجة ATS شاملة، تقييم مفصّل لكل قسم، ونقاط تحسين قابلة للتنفيذ فوراً.</p>
      </div>
      <div class="step-item">
        <div class="step-number">03</div>
        <div class="step-icon-wrap">✏️</div>
        <div class="step-title">طوّر سيرتك</div>
        <p class="step-desc">محرر ذكي يقترح تحسينات لكل قسم ويوفر نسخة محسّنة للتحميل بصيغة DOCX.</p>
      </div>
      <div class="step-item">
        <div class="step-number">04</div>
        <div class="step-icon-wrap">🔗</div>
        <div class="step-title">اعثر على وظائف</div>
        <p class="step-desc">بحث ذكي عن الوظائف مع درجة تطابق لكل فرصة وشرح واضح لأسباب ملاءمتها لملفك.</p>
      </div>
      <div class="step-item">
        <div class="step-number">05</div>
        <div class="step-icon-wrap">📧</div>
        <div class="step-title">تقدّم بذكاء</div>
        <p class="step-desc">Smart Send يولّد رسائل تغطية مخصصة ويُرسل طلباتك دفعةً واحدة مع تتبع الحالة.</p>
      </div>
      <div class="step-item">
        <div class="step-number">06</div>
        <div class="step-icon-wrap">🎯</div>
        <div class="step-title">تدرّب على المقابلة</div>
        <p class="step-desc">أسئلة مقابلة مخصصة لملفك والوظيفة المستهدفة مع تقييم فوري لإجاباتك ونصائح للتحسين.</p>
      </div>
    </div>
  </div>
</section>

<!-- BENTO FEATURES -->
<section class="section" style="background:var(--paper);">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div>
        <p class="section-eyebrow">لماذا JobAI</p>
        <h2 class="section-title">مميزات صُمّمت<br>لك أنت</h2>
      </div>
      <p class="section-desc">تجربة عربية حقيقية تجمع بين الاحترافية والذكاء الاصطناعي لتمنحك ميزة تنافسية حقيقية في سوق العمل.</p>
    </div>

    <div class="bento-grid fade-in">
      <div class="bento-card wide">
        <div>
          <span class="bento-tag bento-tag-blue">لوحة التحكم</span>
          <h3 class="bento-title">قياس تقدمك في كل خطوة</h3>
          <p class="bento-desc">لوحة تحكم ذكية تعرض درجة ATS، الوظائف المطابقة، الطلبات المُرسلة، ومؤشر جاهزية المقابلة — كل شيء في مكان واحد.</p>
        </div>
        <div class="mini-dashboard">
          <div class="mini-stat">
            <span class="mini-stat-label">درجة ATS</span>
            <span class="mini-stat-val" style="color:var(--success);">87</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-label">وظائف مطابقة</span>
            <span class="mini-stat-val">24</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-label">طلبات مُرسلة</span>
            <span class="mini-stat-val" style="color:var(--accent);">12</span>
          </div>
        </div>
      </div>

      <div class="bento-card accent-bg">
        <span class="bento-tag bento-tag-white">عربي أولاً</span>
        <h3 class="bento-title">دعم RTL وعربي كامل</h3>
        <p class="bento-desc">تجربة مصممة للعربية من الأساس — محاذاة صحيحة، محتوى محلي، وتدفق طبيعي للنص من اليمين لليسار.</p>
      </div>

      <div class="bento-card gold-bg">
        <span class="bento-tag bento-tag-gold">SmartSend</span>
        <h3 class="bento-title">أرسل طلباتك دفعةً واحدة</h3>
        <p class="bento-desc">ولّد رسائل تغطية مخصصة بالذكاء الاصطناعي وأرسلها لعشرات الشركات في خطوة واحدة مع تتبع النتائج.</p>
      </div>
    </div>
  </div>
</section>

<!-- JOBS -->
<section class="section jobs-section" id="jobs">
  <div class="section-inner">
    <div class="section-header fade-in">
      <div>
        <p class="section-eyebrow">أحدث الفرص</p>
        <h2 class="section-title">وظائف مطابقة<br>لملفك المهني</h2>
      </div>
      <p class="section-desc">فرص محدّثة يومياً في مجالات التقنية والذكاء الاصطناعي مع درجة تطابق مخصصة لسيرتك.</p>
    </div>

    <div class="jobs-list fade-in">
      <a href="#" class="job-row">
        <div class="job-company-logo">🏢</div>
        <div class="job-info">
          <div class="job-title">محلل قدرات ذكاء اصطناعي</div>
          <div class="job-meta">شركة Elm Tech · الرياض · دوام كامل</div>
        </div>
        <div class="job-tags">
          <span class="job-tag">Python</span>
          <span class="job-tag">ML</span>
          <span class="job-match">92% تطابق</span>
        </div>
      </a>

      <a href="#" class="job-row">
        <div class="job-company-logo">🔬</div>
        <div class="job-info">
          <div class="job-title">مهندس تطوير توظيف</div>
          <div class="job-meta">CareFusion · جدة · دوام جزئي</div>
        </div>
        <div class="job-tags">
          <span class="job-tag">React</span>
          <span class="job-tag">Node.js</span>
          <span class="job-match">85% تطابق</span>
        </div>
      </a>

      <a href="#" class="job-row">
        <div class="job-company-logo">🎨</div>
        <div class="job-info">
          <div class="job-title">مدير تجربة المستخدم</div>
          <div class="job-meta">AI Talent · الدمام</div>
        </div>
        <div class="job-tags">
          <span class="job-tag remote">عن بعد</span>
          <span class="job-tag">Figma</span>
          <span class="job-match">79% تطابق</span>
        </div>
      </a>

      <a href="#" class="job-row">
        <div class="job-company-logo">🚀</div>
        <div class="job-info">
          <div class="job-title">مطور تطبيقات ذكاء اصطناعي</div>
          <div class="job-meta">Saudi AI · الرياض · دوام كامل</div>
        </div>
        <div class="job-tags">
          <span class="job-tag">LLM</span>
          <span class="job-tag">API</span>
          <span class="job-match">88% تطابق</span>
        </div>
      </a>
    </div>

    <div class="jobs-cta-row">
      <a href="/register" class="btn btn-primary btn-lg">استعرض كل الوظائف →</a>
    </div>
  </div>
</section>

<!-- RECRUITER SECTION -->
<section class="recruiter-section" id="recruiters">
  <div class="section-inner">
    <div class="section-header fade-in" style="margin-bottom:40px;">
      <div>
        <p class="section-eyebrow">للمسؤولين عن التوظيف</p>
        <h2 class="section-title">نظام ATS مدمج<br>بالذكاء الاصطناعي</h2>
      </div>
      <p class="section-desc">صمّم لمديري التوظيف الذين يريدون الوصول إلى أفضل المرشحين بسرعة — رتّب، حلّل، وادعو للمقابلات في خطوات.</p>
    </div>

    <div class="recruiter-panel fade-in">
      <div class="recruiter-content">
        <p style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:var(--accent);text-transform:uppercase;margin-bottom:20px;">لوحة التوظيف</p>
        <h3 style="font-size:26px;font-weight:900;color:var(--ink);letter-spacing:-0.5px;margin-bottom:14px;">إدارة مرشحيك<br>بكفاءة استثنائية</h3>
        <p style="font-size:14px;color:var(--ink2);line-height:1.8;margin-bottom:32px;">رفع سيرات المتقدمين، تحليلها تلقائياً، وترتيبها بدرجات تطابق دقيقة — مع خط أنابيب ATS كامل لإدارة مراحل التوظيف.</p>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:28px;height:28px;background:var(--accent-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:13px;flex-shrink:0;">✓</div>
            <span style="font-size:14px;color:var(--ink2);">تحليل CVs تلقائي مع درجات مطابقة</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:28px;height:28px;background:var(--accent-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:13px;flex-shrink:0;">✓</div>
            <span style="font-size:14px;color:var(--ink2);">خط أنابيب ATS متكامل للمراحل</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:28px;height:28px;background:var(--accent-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:13px;flex-shrink:0;">✓</div>
            <span style="font-size:14px;color:var(--ink2);">دعوة للمقابلة الذكية بنقرة واحدة</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:28px;height:28px;background:var(--accent-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:13px;flex-shrink:0;">✓</div>
            <span style="font-size:14px;color:var(--ink2);">تقارير مفصّلة لكل مرشح</span>
          </div>
        </div>

        <div style="margin-top:36px;">
          <a href="/register" class="btn btn-primary">ابدأ كمسؤول توظيف →</a>
        </div>
      </div>

      <div class="recruiter-visual">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;margin-bottom:16px;text-transform:uppercase;">قائمة المرشحين</div>

        <div class="candidate-row">
          <div class="candidate-av av-blue">أ</div>
          <div style="flex:1;">
            <span class="candidate-name">أحمد الشمري</span>
            <span class="candidate-role">محلل بيانات · 5 سنوات خبرة</span>
          </div>
          <span class="candidate-score score-high">92%</span>
          <span class="candidate-stage stage-shortlist">مختصَر</span>
        </div>

        <div class="candidate-row">
          <div class="candidate-av av-gold">س</div>
          <div style="flex:1;">
            <span class="candidate-name">سارة العتيبي</span>
            <span class="candidate-role">مهندسة ML · 3 سنوات خبرة</span>
          </div>
          <span class="candidate-score score-high">88%</span>
          <span class="candidate-stage stage-interview">مقابلة</span>
        </div>

        <div class="candidate-row">
          <div class="candidate-av av-green">م</div>
          <div style="flex:1;">
            <span class="candidate-name">محمد الغامدي</span>
            <span class="candidate-role">مطور AI · سنتان خبرة</span>
          </div>
          <span class="candidate-score score-mid">74%</span>
          <span class="candidate-stage stage-new">جديد</span>
        </div>

        <div style="background:rgba(26,60,255,0.1);border:1px solid rgba(26,60,255,0.2);border-radius:var(--radius-md);padding:14px 16px;margin-top:8px;">
          <div style="font-size:11px;color:#6b86ff;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">توصية AI</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;">أحمد الشمري هو الأنسب لمنصب المحلل — يتطابق مع 9 من أصل 10 متطلبات.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- WHY -->
<section class="why-section">
  <div class="section-inner">
    <div style="text-align:center;max-width:560px;margin:0 auto 0;" class="fade-in">
      <p class="section-eyebrow" style="text-align:center;">لماذا JobAI</p>
      <h2 class="section-title">مميزات تجعل الفارق<br>في مسيرتك</h2>
    </div>

    <div class="why-grid fade-in">
      <div class="why-card">
        <span class="why-icon">🌐</span>
        <h3 class="why-title">مصمم للعربية من الأساس</h3>
        <p class="why-desc">ليس مجرد ترجمة — تجربة مبنية للعربية مع محاذاة RTL صحيحة وتدفق طبيعي في كل شاشة.</p>
      </div>
      <div class="why-card">
        <span class="why-icon">⚡</span>
        <h3 class="why-title">واجهة بسيطة وسريعة</h3>
        <p class="why-desc">تصميم نظيف يمنحك وصولاً سريعاً للمعلومة المهمة دون تعقيد أو فوضى بصرية.</p>
      </div>
      <div class="why-card">
        <span class="why-icon">🤖</span>
        <h3 class="why-title">ذكاء اصطناعي في كل خطوة</h3>
        <p class="why-desc">من تحليل السيرة حتى تحضير المقابلة — الذكاء الاصطناعي يرافقك ويُحسّن فرصك في كل مرحلة.</p>
      </div>
      <div class="why-card">
        <span class="why-icon">🎯</span>
        <h3 class="why-title">تطابق دقيق لا تخميني</h3>
        <p class="why-desc">نظام مطابقة يحلل مهاراتك وخبراتك ويشرح لك بالتفصيل لماذا أنت مناسب أو لا لكل وظيفة.</p>
      </div>
      <div class="why-card">
        <span class="why-icon">📊</span>
        <h3 class="why-title">تقارير قابلة للتنفيذ</h3>
        <p class="why-desc">ليست مجرد درجات — قوائم تحسين واضحة وعملية لرفع سيرتك وزيادة فرصك فعلياً.</p>
      </div>
      <div class="why-card">
        <span class="why-icon">🔒</span>
        <h3 class="why-title">بياناتك آمنة تماماً</h3>
        <p class="why-desc">بنية تحتية موثوقة وسياسة خصوصية صارمة تضمن أن بياناتك المهنية لن تُشارك أبداً.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="section-inner">
    <div class="cta-banner fade-in">
      <div style="position:relative;z-index:1;">
        <p class="cta-eyebrow">ابدأ اليوم</p>
        <h2 class="cta-title">وظيفتك التالية<br>أقرب مما تعتقد</h2>
        <p class="cta-desc">انضم لآلاف المهنيين الذين يستخدمون JobAI لبناء مسيرتهم المهنية بثقة وذكاء. مجاناً في البداية.</p>
      </div>
      <div class="cta-actions">
        <a href="/register" class="btn-cta-primary">
          <span>سجّل الآن مجاناً</span>
          <span>←</span>
        </a>
        <a href="/login" class="btn-cta-ghost">
          <span>لديّ حساب بالفعل</span>
        </a>
        <div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:8px;">لا بطاقة ائتمانية مطلوبة</div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <a href="#" class="footer-logo">
      <div class="footer-logo-mark">JA</div>
      <span class="footer-brand-name">JobAI</span>
    </a>
    <span class="footer-copy">© 2026 JobAI — منصة التوظيف الذكي</span>
    <div class="footer-links">
      <a href="#">الخصوصية</a>
      <a href="#">الشروط</a>
      <a href="#">تواصل معنا</a>
    </div>
  </div>
</footer>

<script>
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
</script>

</body>
</html>
