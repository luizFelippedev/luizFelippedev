<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Luiz Felipe — Software Developer</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #020408;
    --bg2: #060d14;
    --panel: rgba(0,255,136,0.04);
    --border: rgba(0,255,136,0.15);
    --border-hot: rgba(0,255,136,0.5);
    --green: #00ff88;
    --cyan: #00e5ff;
    --blue: #0066ff;
    --purple: #7c3aed;
    --red: #ff3366;
    --text: #c8d8e8;
    --text-dim: #4a6278;
    --text-bright: #e8f4ff;
    --font-mono: 'Share Tech Mono', monospace;
    --font-head: 'Orbitron', sans-serif;
    --font-body: 'Rajdhani', sans-serif;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── CANVAS BG ── */
  #matrix-canvas {
    position: fixed;
    top:0; left:0;
    width:100%; height:100%;
    z-index: 0;
    opacity: 0.08;
    pointer-events: none;
  }

  /* ── SCANLINES ── */
  body::before {
    content:'';
    position:fixed;
    inset:0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
    pointer-events:none;
    z-index:9999;
  }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--green); border-radius:2px; }

  /* ── LAYOUT ── */
  .wrapper { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 2rem; }

  /* ── NAV ── */
  nav {
    position:fixed; top:0; left:0; right:0;
    z-index:1000;
    background: rgba(2,4,8,0.92);
    border-bottom:1px solid var(--border);
    backdrop-filter: blur(12px);
    padding: 0.9rem 0;
  }
  .nav-inner {
    max-width:1200px; margin:0 auto; padding:0 2rem;
    display:flex; align-items:center; justify-content:space-between;
  }
  .nav-logo {
    font-family:var(--font-head);
    font-size:1rem; font-weight:900;
    color:var(--green);
    letter-spacing:3px;
    text-transform:uppercase;
  }
  .nav-logo span { color:var(--cyan); }
  .nav-links { display:flex; gap:2rem; align-items:center; }
  .nav-links a {
    font-family:var(--font-mono);
    font-size:0.75rem;
    color:var(--text-dim);
    text-decoration:none;
    letter-spacing:2px;
    text-transform:uppercase;
    transition:color 0.2s;
    position:relative;
  }
  .nav-links a::after {
    content:'';
    position:absolute; bottom:-4px; left:0; right:0;
    height:1px; background:var(--green);
    transform:scaleX(0); transition:transform 0.2s;
  }
  .nav-links a:hover { color:var(--green); }
  .nav-links a:hover::after { transform:scaleX(1); }

  /* ── LANG SWITCH ── */
  .lang-btn {
    font-family:var(--font-mono);
    font-size:0.7rem;
    letter-spacing:2px;
    border: 1px solid var(--border-hot);
    background:transparent;
    color:var(--green);
    padding:0.35rem 0.8rem;
    cursor:pointer;
    transition:all 0.2s;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .lang-btn:hover { background:var(--green); color:var(--bg); }

  /* ── HERO ── */
  #hero {
    min-height:100vh;
    display:flex; align-items:center;
    padding:6rem 0 3rem;
  }
  .hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
  
  .hero-badge {
    display:inline-flex; align-items:center; gap:0.5rem;
    font-family:var(--font-mono);
    font-size:0.7rem; letter-spacing:3px;
    color:var(--green); text-transform:uppercase;
    border:1px solid var(--border);
    padding:0.4rem 1rem;
    margin-bottom:1.5rem;
    clip-path: polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    background: var(--panel);
  }
  .hero-badge::before { content:'◈'; color:var(--green); }

  .hero-name {
    font-family:var(--font-head);
    font-size:clamp(2.2rem,5vw,4rem);
    font-weight:900;
    line-height:1.05;
    color:var(--text-bright);
    letter-spacing:2px;
    margin-bottom:0.5rem;
  }
  .hero-name .accent { color:var(--green); }

  .hero-title {
    font-family:var(--font-mono);
    font-size:0.9rem;
    color:var(--cyan);
    letter-spacing:4px;
    margin-bottom:1.5rem;
    text-transform:uppercase;
  }
  .hero-title::before { content:'> '; color:var(--text-dim); }

  .hero-desc {
    font-size:1.1rem;
    color:var(--text);
    line-height:1.8;
    margin-bottom:2rem;
    max-width:500px;
  }

  .hero-ctas { display:flex; gap:1rem; flex-wrap:wrap; }
  .btn-primary {
    font-family:var(--font-mono);
    font-size:0.75rem;
    letter-spacing:2px;
    text-transform:uppercase;
    text-decoration:none;
    padding:0.8rem 1.8rem;
    background:var(--green);
    color:var(--bg);
    font-weight:700;
    clip-path: polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    transition:all 0.2s;
    display:inline-block;
  }
  .btn-primary:hover { background:var(--cyan); transform:translateY(-2px); }
  .btn-outline {
    font-family:var(--font-mono);
    font-size:0.75rem;
    letter-spacing:2px;
    text-transform:uppercase;
    text-decoration:none;
    padding:0.8rem 1.8rem;
    border:1px solid var(--border-hot);
    color:var(--green);
    clip-path: polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    transition:all 0.2s;
    display:inline-block;
  }
  .btn-outline:hover { background:rgba(0,255,136,0.1); transform:translateY(-2px); }

  /* HERO STATS */
  .hero-stats {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1rem;
    margin-top:2.5rem;
  }
  .stat-card {
    border:1px solid var(--border);
    background:var(--panel);
    padding:1rem;
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    text-align:center;
    transition:border-color 0.2s;
  }
  .stat-card:hover { border-color:var(--border-hot); }
  .stat-num {
    font-family:var(--font-head);
    font-size:1.8rem;
    font-weight:900;
    color:var(--green);
    display:block;
  }
  .stat-label {
    font-family:var(--font-mono);
    font-size:0.65rem;
    letter-spacing:2px;
    color:var(--text-dim);
    text-transform:uppercase;
    display:block;
    margin-top:0.2rem;
  }

  /* HERO VISUAL */
  .hero-visual { position:relative; }
  .avatar-ring {
    width:320px; height:320px;
    margin:0 auto;
    position:relative;
    display:flex; align-items:center; justify-content:center;
  }
  .ring {
    position:absolute; inset:0;
    border-radius:50%;
    border:1px solid var(--border);
    animation: spin-slow 20s linear infinite;
  }
  .ring-2 {
    inset:16px;
    border:1px dashed rgba(0,229,255,0.2);
    animation: spin-slow 15s linear infinite reverse;
  }
  .ring-3 {
    inset:32px;
    border:1px solid rgba(0,255,136,0.1);
    animation: spin-slow 25s linear infinite;
  }
  @keyframes spin-slow { to { transform:rotate(360deg); } }

  .avatar-inner {
    width:220px; height:220px;
    border-radius:50%;
    background: linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);
    border:2px solid var(--border-hot);
    display:flex; align-items:center; justify-content:center;
    position:relative;
    box-shadow: 0 0 40px rgba(0,255,136,0.15), inset 0 0 40px rgba(0,255,136,0.05);
    font-family:var(--font-head);
    font-size:4rem;
    font-weight:900;
    color:var(--green);
    letter-spacing:-2px;
  }

  .orbit-dot {
    position:absolute; width:8px; height:8px;
    border-radius:50%; background:var(--green);
    box-shadow:0 0 10px var(--green);
  }

  .floating-tags {
    position:absolute;
    font-family:var(--font-mono);
    font-size:0.65rem;
    letter-spacing:2px;
    color:var(--green);
    background:rgba(0,255,136,0.08);
    border:1px solid var(--border);
    padding:0.3rem 0.6rem;
    white-space:nowrap;
  }
  .tag1 { top:10%; right:-20px; }
  .tag2 { bottom:20%; right:-30px; }
  .tag3 { top:30%; left:-40px; }
  .tag4 { bottom:10%; left:-10px; }

  /* ── SECTION COMMONS ── */
  section { padding:6rem 0; }
  .section-header { margin-bottom:3.5rem; }
  .section-label {
    font-family:var(--font-mono);
    font-size:0.7rem;
    letter-spacing:4px;
    color:var(--green);
    text-transform:uppercase;
    display:block;
    margin-bottom:0.5rem;
  }
  .section-label::before { content:'// '; color:var(--text-dim); }
  .section-title {
    font-family:var(--font-head);
    font-size:clamp(1.8rem,3vw,2.8rem);
    font-weight:900;
    color:var(--text-bright);
    letter-spacing:2px;
  }
  .section-line {
    width:60px; height:2px;
    background:linear-gradient(90deg,var(--green),transparent);
    margin-top:1rem;
  }

  /* ── SKILLS ── */
  .skills-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
    gap:1.5rem;
  }
  .skill-category {
    border:1px solid var(--border);
    background:var(--panel);
    padding:1.5rem;
    clip-path: polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));
    transition:border-color 0.3s, transform 0.3s;
    position:relative;
    overflow:hidden;
  }
  .skill-category::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,var(--green),transparent);
    opacity:0; transition:opacity 0.3s;
  }
  .skill-category:hover { border-color:var(--border-hot); transform:translateY(-3px); }
  .skill-category:hover::before { opacity:1; }

  .cat-header {
    display:flex; align-items:center; gap:0.75rem;
    margin-bottom:1.2rem;
  }
  .cat-icon { font-size:1.3rem; }
  .cat-title {
    font-family:var(--font-head);
    font-size:0.85rem;
    font-weight:700;
    color:var(--text-bright);
    letter-spacing:2px;
    text-transform:uppercase;
  }

  .skill-list { display:flex; flex-direction:column; gap:0.6rem; }
  .skill-item { display:flex; align-items:center; gap:0.75rem; }
  .skill-icon-wrap {
    width:28px; height:28px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .skill-icon-wrap img { width:22px; height:22px; object-fit:contain; filter:brightness(0.9); }
  .skill-info { flex:1; }
  .skill-name {
    font-family:var(--font-mono);
    font-size:0.72rem;
    color:var(--text);
    letter-spacing:1px;
    display:block;
    margin-bottom:3px;
  }
  .skill-bar {
    height:3px;
    background:rgba(255,255,255,0.05);
    border-radius:2px;
    overflow:hidden;
    position:relative;
  }
  .skill-fill {
    height:100%; border-radius:2px;
    background:linear-gradient(90deg,var(--green),var(--cyan));
    transform:scaleX(0);
    transform-origin:left;
    transition:transform 1.2s cubic-bezier(0.16,1,0.3,1);
  }
  .skill-pct {
    font-family:var(--font-mono);
    font-size:0.6rem;
    color:var(--text-dim);
    flex-shrink:0;
  }

  /* ── EXPERIENCE ── */
  .timeline { position:relative; padding-left:2rem; }
  .timeline::before {
    content:'';
    position:absolute; left:0; top:0; bottom:0;
    width:1px; background:var(--border);
  }
  .timeline-item {
    position:relative;
    margin-bottom:2.5rem;
    padding-left:2rem;
    opacity:0;
    transform:translateX(-20px);
    transition:all 0.6s ease;
  }
  .timeline-item.visible { opacity:1; transform:translateX(0); }
  .timeline-dot {
    position:absolute;
    left:-2.4rem; top:0.4rem;
    width:12px; height:12px;
    border-radius:50%;
    background:var(--bg);
    border:2px solid var(--green);
    box-shadow:0 0 10px rgba(0,255,136,0.4);
  }
  .timeline-dot::after {
    content:'';
    position:absolute; inset:3px;
    border-radius:50%;
    background:var(--green);
    animation: pulse-dot 2s ease infinite;
  }
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:0.4; transform:scale(0.7); }
  }
  .timeline-date {
    font-family:var(--font-mono);
    font-size:0.65rem;
    letter-spacing:3px;
    color:var(--green);
    text-transform:uppercase;
    margin-bottom:0.4rem;
  }
  .timeline-role {
    font-family:var(--font-head);
    font-size:1.1rem;
    font-weight:700;
    color:var(--text-bright);
    letter-spacing:2px;
    margin-bottom:0.2rem;
  }
  .timeline-company {
    font-family:var(--font-mono);
    font-size:0.75rem;
    color:var(--cyan);
    margin-bottom:0.75rem;
  }
  .timeline-desc { font-size:0.95rem; color:var(--text); line-height:1.7; }
  .timeline-tags { display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.75rem; }
  .tag {
    font-family:var(--font-mono);
    font-size:0.6rem;
    letter-spacing:1px;
    color:var(--text-dim);
    border:1px solid var(--border);
    padding:0.2rem 0.5rem;
    text-transform:uppercase;
    transition:all 0.2s;
  }
  .tag:hover { border-color:var(--border-hot); color:var(--green); }

  /* ── PROJECTS ── */
  .projects-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
    gap:1.5rem;
  }
  .project-card {
    border:1px solid var(--border);
    background:var(--panel);
    padding:1.8rem;
    clip-path: polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%);
    transition:all 0.3s;
    position:relative;
    overflow:hidden;
    cursor:default;
  }
  .project-card::after {
    content:'';
    position:absolute; bottom:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--green),var(--cyan));
    transform:scaleX(0); transform-origin:left;
    transition:transform 0.4s;
  }
  .project-card:hover { border-color:var(--border-hot); transform:translateY(-4px); }
  .project-card:hover::after { transform:scaleX(1); }

  .project-id {
    font-family:var(--font-mono);
    font-size:0.6rem;
    color:var(--text-dim);
    letter-spacing:3px;
    margin-bottom:0.8rem;
  }
  .project-title {
    font-family:var(--font-head);
    font-size:1rem;
    font-weight:700;
    color:var(--text-bright);
    letter-spacing:2px;
    margin-bottom:0.6rem;
  }
  .project-desc { font-size:0.9rem; color:var(--text); line-height:1.7; margin-bottom:1rem; }
  .project-stack { display:flex; flex-wrap:wrap; gap:0.4rem; }
  .stack-tag {
    font-family:var(--font-mono);
    font-size:0.6rem;
    color:var(--green);
    background:rgba(0,255,136,0.08);
    border:1px solid rgba(0,255,136,0.2);
    padding:0.2rem 0.5rem;
    letter-spacing:1px;
    text-transform:uppercase;
  }

  /* ── GITHUB STATS ── */
  .stats-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
    gap:1rem;
    margin-bottom:2rem;
  }
  .stat-block {
    border:1px solid var(--border);
    background:var(--panel);
    padding:1.2rem 1.5rem;
    display:flex; align-items:center; gap:1rem;
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    transition:border-color 0.2s;
  }
  .stat-block:hover { border-color:var(--border-hot); }
  .stat-icon { font-size:1.5rem; }
  .stat-block-num {
    font-family:var(--font-head);
    font-size:1.6rem;
    font-weight:900;
    color:var(--green);
    display:block;
    line-height:1;
  }
  .stat-block-label {
    font-family:var(--font-mono);
    font-size:0.62rem;
    letter-spacing:2px;
    color:var(--text-dim);
    text-transform:uppercase;
    display:block;
    margin-top:0.25rem;
  }

  .github-imgs {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:1.5rem;
  }
  .github-img-wrap {
    border:1px solid var(--border);
    background:var(--panel);
    padding:1rem;
    clip-path: polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);
    transition:border-color 0.2s;
  }
  .github-img-wrap:hover { border-color:var(--border-hot); }
  .github-img-wrap img { width:100%; display:block; border-radius:2px; }

  /* ── CONTACT ── */
  .contact-grid {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:4rem;
    align-items:start;
  }
  .contact-links { display:flex; flex-direction:column; gap:1rem; }
  .contact-link {
    display:flex; align-items:center; gap:1rem;
    text-decoration:none;
    border:1px solid var(--border);
    background:var(--panel);
    padding:1rem 1.5rem;
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    transition:all 0.2s;
    group:true;
  }
  .contact-link:hover { border-color:var(--border-hot); transform:translateX(6px); }
  .contact-link-icon { font-size:1.2rem; width:2rem; text-align:center; }
  .contact-link-text { flex:1; }
  .contact-link-label {
    font-family:var(--font-mono);
    font-size:0.65rem;
    letter-spacing:3px;
    color:var(--text-dim);
    text-transform:uppercase;
    display:block;
  }
  .contact-link-value {
    font-family:var(--font-mono);
    font-size:0.85rem;
    color:var(--green);
    display:block;
    margin-top:0.2rem;
  }
  .contact-link-arrow {
    font-family:var(--font-mono);
    color:var(--text-dim);
    transition:color 0.2s, transform 0.2s;
  }
  .contact-link:hover .contact-link-arrow { color:var(--green); transform:translateX(4px); }

  .availability-card {
    border:1px solid var(--border-hot);
    background:rgba(0,255,136,0.04);
    padding:2rem;
    clip-path: polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%);
  }
  .avail-indicator {
    display:flex; align-items:center; gap:0.75rem;
    margin-bottom:1.2rem;
  }
  .avail-dot {
    width:10px; height:10px; border-radius:50%;
    background:var(--green);
    box-shadow:0 0 10px var(--green);
    animation:blink 1.5s ease infinite;
    flex-shrink:0;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .avail-status {
    font-family:var(--font-mono);
    font-size:0.7rem;
    letter-spacing:3px;
    color:var(--green);
    text-transform:uppercase;
  }
  .avail-title {
    font-family:var(--font-head);
    font-size:1.3rem;
    font-weight:700;
    color:var(--text-bright);
    letter-spacing:2px;
    margin-bottom:0.75rem;
  }
  .avail-desc { font-size:0.9rem; color:var(--text); line-height:1.7; }

  /* ── FOOTER ── */
  footer {
    border-top:1px solid var(--border);
    padding:2rem 0;
    text-align:center;
  }
  .footer-inner {
    max-width:1200px; margin:0 auto; padding:0 2rem;
    display:flex; align-items:center; justify-content:space-between;
  }
  .footer-text {
    font-family:var(--font-mono);
    font-size:0.65rem;
    letter-spacing:2px;
    color:var(--text-dim);
    text-transform:uppercase;
  }
  .footer-text span { color:var(--green); }

  /* ── GLOW DIVIDERS ── */
  .glow-line {
    height:1px;
    background:linear-gradient(90deg,transparent,var(--green),transparent);
    margin:0;
    opacity:0.3;
  }

  /* ── ANIMATIONS ── */
  .fade-up {
    opacity:0; transform:translateY(30px);
    transition:all 0.7s ease;
  }
  .fade-up.visible { opacity:1; transform:translateY(0); }

  /* ── LANG HIDDEN ── */
  [data-lang] { display:none; }
  [data-lang].active { display:block; }
  span[data-lang] { display:none; }
  span[data-lang].active { display:inline; }

  /* ── RESPONSIVE ── */
  @media (max-width:900px) {
    .hero-grid { grid-template-columns:1fr; }
    .hero-visual { display:none; }
    .contact-grid { grid-template-columns:1fr; }
    .github-imgs { grid-template-columns:1fr; }
    .nav-links a:not(.lang-btn-wrap) { display:none; }
  }
</style>
</head>
<body>

<canvas id="matrix-canvas"></canvas>

<!-- NAV -->
<nav>
  <div class="nav-inner">
    <div class="nav-logo">LF<span>.</span>DEV</div>
    <div class="nav-links">
      <a href="#about"><span data-lang="pt" class="active">Sobre</span><span data-lang="en">About</span></a>
      <a href="#skills">Skills</a>
      <a href="#experience"><span data-lang="pt" class="active">Experiência</span><span data-lang="en">Experience</span></a>
      <a href="#projects"><span data-lang="pt" class="active">Projetos</span><span data-lang="en">Projects</span></a>
      <a href="#stats">GitHub</a>
      <a href="#contact">Contato</a>
      <button class="lang-btn" onclick="toggleLang()">
        <span data-lang="pt" class="active">🇧🇷 PT</span>
        <span data-lang="en">🇺🇸 EN</span>
      </button>
    </div>
  </div>
</nav>

<!-- HERO -->
<section id="about">
<div class="wrapper">
  <div class="hero-grid">
    <div class="hero-content">

      <div class="hero-badge">
        <span data-lang="pt" class="active">Disponível para Projetos</span>
        <span data-lang="en">Available for Projects</span>
      </div>

      <h1 class="hero-name">
        <span data-lang="pt" class="active">Olá, sou<br><span class="accent">Luiz Felipe</span></span>
        <span data-lang="en">Hi, I'm<br><span class="accent">Luiz Felipe</span></span>
      </h1>

      <div class="hero-title">
        <span data-lang="pt" class="active">Desenvolvedor de Software</span>
        <span data-lang="en">Software Developer</span>
      </div>

      <p class="hero-desc">
        <span data-lang="pt" class="active">
          Desenvolvedor apaixonado por criar soluções tecnológicas eficientes e escaláveis. 
          Com expertise em frontend, backend e automação — transformo ideias complexas em 
          código limpo e performático.
        </span>
        <span data-lang="en">
          Passionate developer building efficient, scalable tech solutions. 
          Skilled across frontend, backend, and automation — I turn complex ideas 
          into clean, high-performance code.
        </span>
      </p>

      <div class="hero-ctas">
        <a href="https://www.linkedin.com/in/luizfelippetech/" target="_blank" class="btn-primary">LinkedIn</a>
        <a href="https://github.com/luizFelippedev" target="_blank" class="btn-outline">GitHub</a>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-num">5+</span>
          <span class="stat-label">
            <span data-lang="pt" class="active">Anos Coding</span>
            <span data-lang="en">Years Coding</span>
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-num">10+</span>
          <span class="stat-label">
            <span data-lang="pt" class="active">Linguagens</span>
            <span data-lang="en">Languages</span>
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-num">30+</span>
          <span class="stat-label">
            <span data-lang="pt" class="active">Projetos</span>
            <span data-lang="en">Projects</span>
          </span>
        </div>
      </div>
    </div>

    <!-- HERO VISUAL -->
    <div class="hero-visual">
      <div class="avatar-ring">
        <div class="ring"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="avatar-inner">LF</div>
        <div class="floating-tags tag1">NODE.JS</div>
        <div class="floating-tags tag2">REACT</div>
        <div class="floating-tags tag3">PYTHON</div>
        <div class="floating-tags tag4">DOCKER</div>
      </div>
    </div>
  </div>
</div>
</section>

<div class="glow-line"></div>

<!-- SKILLS -->
<section id="skills">
<div class="wrapper">
  <div class="section-header fade-up">
    <span class="section-label">
      <span data-lang="pt" class="active">Habilidades Técnicas</span>
      <span data-lang="en">Technical Skills</span>
    </span>
    <h2 class="section-title">
      <span data-lang="pt" class="active">Stack & Ferramentas</span>
      <span data-lang="en">Stack & Tools</span>
    </h2>
    <div class="section-line"></div>
  </div>

  <div class="skills-grid">

    <!-- Languages -->
    <div class="skill-category fade-up">
      <div class="cat-header">
        <span class="cat-icon">⬡</span>
        <span class="cat-title">
          <span data-lang="pt" class="active">Linguagens</span>
          <span data-lang="en">Languages</span>
        </span>
      </div>
      <div class="skill-list">
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JS"></div>
          <div class="skill-info">
            <span class="skill-name">JavaScript</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.95"></div></div>
          </div>
          <span class="skill-pct">95%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TS"></div>
          <div class="skill-info">
            <span class="skill-name">TypeScript</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.90"></div></div>
          </div>
          <span class="skill-pct">90%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="PY"></div>
          <div class="skill-info">
            <span class="skill-name">Python</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.85"></div></div>
          </div>
          <span class="skill-pct">85%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" alt="Java"></div>
          <div class="skill-info">
            <span class="skill-name">Java</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.80"></div></div>
          </div>
          <span class="skill-pct">80%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" alt="Go"></div>
          <div class="skill-info">
            <span class="skill-name">Go</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.70"></div></div>
          </div>
          <span class="skill-pct">70%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg" alt="Rust"></div>
          <div class="skill-info">
            <span class="skill-name">Rust</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.60"></div></div>
          </div>
          <span class="skill-pct">60%</span>
        </div>
      </div>
    </div>

    <!-- Frontend -->
    <div class="skill-category fade-up">
      <div class="cat-header">
        <span class="cat-icon">◈</span>
        <span class="cat-title">Frontend</span>
      </div>
      <div class="skill-list">
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React"></div>
          <div class="skill-info">
            <span class="skill-name">React</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.92"></div></div>
          </div>
          <span class="skill-pct">92%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg" alt="Redux"></div>
          <div class="skill-info">
            <span class="skill-name">Redux</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.80"></div></div>
          </div>
          <span class="skill-pct">80%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5"></div>
          <div class="skill-info">
            <span class="skill-name">HTML5</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.95"></div></div>
          </div>
          <span class="skill-pct">95%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS3"></div>
          <div class="skill-info">
            <span class="skill-name">CSS3</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.90"></div></div>
          </div>
          <span class="skill-pct">90%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="Next" style="filter:invert(1) brightness(0.7)"></div>
          <div class="skill-info">
            <span class="skill-name">Next.js</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.82"></div></div>
          </div>
          <span class="skill-pct">82%</span>
        </div>
      </div>
    </div>

    <!-- Backend -->
    <div class="skill-category fade-up">
      <div class="cat-header">
        <span class="cat-icon">⬢</span>
        <span class="cat-title">Backend</span>
      </div>
      <div class="skill-list">
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node"></div>
          <div class="skill-info">
            <span class="skill-name">Node.js</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.93"></div></div>
          </div>
          <span class="skill-pct">93%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express" style="filter:invert(1) brightness(0.7)"></div>
          <div class="skill-info">
            <span class="skill-name">Express.js</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.90"></div></div>
          </div>
          <span class="skill-pct">90%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg" alt="Django"></div>
          <div class="skill-info">
            <span class="skill-name">Django</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.78"></div></div>
          </div>
          <span class="skill-pct">78%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg" alt="Spring"></div>
          <div class="skill-info">
            <span class="skill-name">Spring Boot</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.72"></div></div>
          </div>
          <span class="skill-pct">72%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-plain.svg" alt="Rails"></div>
          <div class="skill-info">
            <span class="skill-name">Ruby on Rails</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.65"></div></div>
          </div>
          <span class="skill-pct">65%</span>
        </div>
      </div>
    </div>

    <!-- Databases -->
    <div class="skill-category fade-up">
      <div class="cat-header">
        <span class="cat-icon">⬟</span>
        <span class="cat-title">
          <span data-lang="pt" class="active">Banco de Dados</span>
          <span data-lang="en">Databases</span>
        </span>
      </div>
      <div class="skill-list">
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" alt="Mongo"></div>
          <div class="skill-info">
            <span class="skill-name">MongoDB</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.88"></div></div>
          </div>
          <span class="skill-pct">88%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PG"></div>
          <div class="skill-info">
            <span class="skill-name">PostgreSQL</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.85"></div></div>
          </div>
          <span class="skill-pct">85%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt="MySQL"></div>
          <div class="skill-info">
            <span class="skill-name">MySQL</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.83"></div></div>
          </div>
          <span class="skill-pct">83%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" alt="Redis"></div>
          <div class="skill-info">
            <span class="skill-name">Redis</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.75"></div></div>
          </div>
          <span class="skill-pct">75%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" alt="SQLite"></div>
          <div class="skill-info">
            <span class="skill-name">SQLite</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.80"></div></div>
          </div>
          <span class="skill-pct">80%</span>
        </div>
      </div>
    </div>

    <!-- DevOps & Tools -->
    <div class="skill-category fade-up">
      <div class="cat-header">
        <span class="cat-icon">⬡</span>
        <span class="cat-title">DevOps & Tools</span>
      </div>
      <div class="skill-list">
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker"></div>
          <div class="skill-info">
            <span class="skill-name">Docker</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.85"></div></div>
          </div>
          <span class="skill-pct">85%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" alt="Git"></div>
          <div class="skill-info">
            <span class="skill-name">Git</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.92"></div></div>
          </div>
          <span class="skill-pct">92%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg" alt="Jenkins"></div>
          <div class="skill-info">
            <span class="skill-name">Jenkins</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.70"></div></div>
          </div>
          <span class="skill-pct">70%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" alt="Linux"></div>
          <div class="skill-info">
            <span class="skill-name">Linux / Bash</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.80"></div></div>
          </div>
          <span class="skill-pct">80%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" alt="Figma"></div>
          <div class="skill-info">
            <span class="skill-name">Figma</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.75"></div></div>
          </div>
          <span class="skill-pct">75%</span>
        </div>
      </div>
    </div>

    <!-- More Languages -->
    <div class="skill-category fade-up">
      <div class="cat-header">
        <span class="cat-icon">◇</span>
        <span class="cat-title">
          <span data-lang="pt" class="active">Outras Linguagens</span>
          <span data-lang="en">Other Languages</span>
        </span>
      </div>
      <div class="skill-list">
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" alt="C#"></div>
          <div class="skill-info">
            <span class="skill-name">C#</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.72"></div></div>
          </div>
          <span class="skill-pct">72%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" alt="PHP"></div>
          <div class="skill-info">
            <span class="skill-name">PHP</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.70"></div></div>
          </div>
          <span class="skill-pct">70%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg" alt="Ruby"></div>
          <div class="skill-info">
            <span class="skill-name">Ruby</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.68"></div></div>
          </div>
          <span class="skill-pct">68%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg" alt="Kotlin"></div>
          <div class="skill-info">
            <span class="skill-name">Kotlin</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.60"></div></div>
          </div>
          <span class="skill-pct">60%</span>
        </div>
        <div class="skill-item">
          <div class="skill-icon-wrap"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" alt="C++"></div>
          <div class="skill-info">
            <span class="skill-name">C++</span>
            <div class="skill-bar"><div class="skill-fill" style="--w:0.55"></div></div>
          </div>
          <span class="skill-pct">55%</span>
        </div>
      </div>
    </div>

  </div>
</div>
</section>

<div class="glow-line"></div>

<!-- EXPERIENCE -->
<section id="experience">
<div class="wrapper">
  <div class="section-header fade-up">
    <span class="section-label">
      <span data-lang="pt" class="active">Trajetória</span>
      <span data-lang="en">Journey</span>
    </span>
    <h2 class="section-title">
      <span data-lang="pt" class="active">Experiência</span>
      <span data-lang="en">Experience</span>
    </h2>
    <div class="section-line"></div>
  </div>

  <div class="timeline">
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">
        <span data-lang="pt" class="active">2024 — Presente</span>
        <span data-lang="en">2024 — Present</span>
      </div>
      <div class="timeline-role">
        <span data-lang="pt" class="active">Desenvolvedor Full Stack</span>
        <span data-lang="en">Full Stack Developer</span>
      </div>
      <div class="timeline-company">◈ Tech Innovation Lab</div>
      <p class="timeline-desc">
        <span data-lang="pt" class="active">
          Desenvolvimento de aplicações web escaláveis utilizando React, Node.js e PostgreSQL. 
          Implementação de pipelines CI/CD com Docker e Jenkins. 
          Liderança técnica em projetos com equipes ágeis.
        </span>
        <span data-lang="en">
          Building scalable web applications with React, Node.js, and PostgreSQL. 
          Implementing CI/CD pipelines with Docker and Jenkins. 
          Technical lead on agile team projects.
        </span>
      </p>
      <div class="timeline-tags">
        <span class="tag">React</span><span class="tag">Node.js</span>
        <span class="tag">Docker</span><span class="tag">PostgreSQL</span>
        <span class="tag">TypeScript</span>
      </div>
    </div>

    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">2023 — 2024</div>
      <div class="timeline-role">
        <span data-lang="pt" class="active">Desenvolvedor Backend</span>
        <span data-lang="en">Backend Developer</span>
      </div>
      <div class="timeline-company">◈ StartupX</div>
      <p class="timeline-desc">
        <span data-lang="pt" class="active">
          Construção de APIs RESTful e microsserviços com Node.js e Express. 
          Otimização de queries MongoDB para alta performance. 
          Integração com serviços de terceiros e webhooks.
        </span>
        <span data-lang="en">
          Building RESTful APIs and microservices with Node.js and Express. 
          Optimizing MongoDB queries for high performance. 
          Third-party service integrations and webhooks.
        </span>
      </p>
      <div class="timeline-tags">
        <span class="tag">Node.js</span><span class="tag">MongoDB</span>
        <span class="tag">Express</span><span class="tag">REST API</span>
      </div>
    </div>

    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">2022 — 2023</div>
      <div class="timeline-role">
        <span data-lang="pt" class="active">Estágio em Desenvolvimento</span>
        <span data-lang="en">Development Intern</span>
      </div>
      <div class="timeline-company">◈ Digital Agency</div>
      <p class="timeline-desc">
        <span data-lang="pt" class="active">
          Desenvolvimento de interfaces com React e CSS3. 
          Aprendizado de boas práticas de versionamento com Git. 
          Suporte em projetos Django e implementações de banco de dados.
        </span>
        <span data-lang="en">
          Building interfaces with React and CSS3. 
          Learning Git best practices and version control. 
          Support on Django projects and database implementations.
        </span>
      </p>
      <div class="timeline-tags">
        <span class="tag">React</span><span class="tag">Django</span>
        <span class="tag">CSS3</span><span class="tag">Git</span>
      </div>
    </div>
  </div>
</div>
</section>

<div class="glow-line"></div>

<!-- PROJECTS -->
<section id="projects">
<div class="wrapper">
  <div class="section-header fade-up">
    <span class="section-label">
      <span data-lang="pt" class="active">Portfólio</span>
      <span data-lang="en">Portfolio</span>
    </span>
    <h2 class="section-title">
      <span data-lang="pt" class="active">Projetos em Destaque</span>
      <span data-lang="en">Featured Projects</span>
    </h2>
    <div class="section-line"></div>
  </div>

  <div class="projects-grid">
    <div class="project-card fade-up">
      <div class="project-id">PROJECT_001</div>
      <div class="project-title">
        <span data-lang="pt" class="active">Plataforma E-Commerce</span>
        <span data-lang="en">E-Commerce Platform</span>
      </div>
      <p class="project-desc">
        <span data-lang="pt" class="active">Sistema completo de e-commerce com painel admin, gateway de pagamentos, gestão de estoque em tempo real e analytics avançados.</span>
        <span data-lang="en">Full e-commerce system with admin panel, payment gateway, real-time inventory management, and advanced analytics.</span>
      </p>
      <div class="project-stack">
        <span class="stack-tag">React</span>
        <span class="stack-tag">Node.js</span>
        <span class="stack-tag">MongoDB</span>
        <span class="stack-tag">Docker</span>
      </div>
    </div>

    <div class="project-card fade-up">
      <div class="project-id">PROJECT_002</div>
      <div class="project-title">
        <span data-lang="pt" class="active">API de Microsserviços</span>
        <span data-lang="en">Microservices API</span>
      </div>
      <p class="project-desc">
        <span data-lang="pt" class="active">Arquitetura de microsserviços com autenticação JWT, rate limiting, logging distribuído e documentação automática com Swagger.</span>
        <span data-lang="en">Microservices architecture with JWT auth, rate limiting, distributed logging, and auto Swagger documentation.</span>
      </p>
      <div class="project-stack">
        <span class="stack-tag">Node.js</span>
        <span class="stack-tag">PostgreSQL</span>
        <span class="stack-tag">Redis</span>
        <span class="stack-tag">Swagger</span>
      </div>
    </div>

    <div class="project-card fade-up">
      <div class="project-id">PROJECT_003</div>
      <div class="project-title">
        <span data-lang="pt" class="active">Dashboard em Tempo Real</span>
        <span data-lang="en">Real-Time Dashboard</span>
      </div>
      <p class="project-desc">
        <span data-lang="pt" class="active">Dashboard analítico com WebSockets para dados ao vivo, gráficos interativos, filtros dinâmicos e exportação de relatórios em PDF.</span>
        <span data-lang="en">Analytical dashboard with WebSockets for live data, interactive charts, dynamic filters, and PDF report export.</span>
      </p>
      <div class="project-stack">
        <span class="stack-tag">React</span>
        <span class="stack-tag">TypeScript</span>
        <span class="stack-tag">WebSocket</span>
        <span class="stack-tag">D3.js</span>
      </div>
    </div>

    <div class="project-card fade-up">
      <div class="project-id">PROJECT_004</div>
      <div class="project-title">
        <span data-lang="pt" class="active">Bot de Automação</span>
        <span data-lang="en">Automation Bot</span>
      </div>
      <p class="project-desc">
        <span data-lang="pt" class="active">Bot Python para automação de tarefas com scheduling, integração com APIs externas, notificações e sistema de logs robusto.</span>
        <span data-lang="en">Python bot for task automation with scheduling, external API integration, notifications, and robust logging system.</span>
      </p>
      <div class="project-stack">
        <span class="stack-tag">Python</span>
        <span class="stack-tag">Django</span>
        <span class="stack-tag">Celery</span>
        <span class="stack-tag">Redis</span>
      </div>
    </div>

    <div class="project-card fade-up">
      <div class="project-id">PROJECT_005</div>
      <div class="project-title">
        <span data-lang="pt" class="active">App Mobile Backend</span>
        <span data-lang="en">Mobile App Backend</span>
      </div>
      <p class="project-desc">
        <span data-lang="pt" class="active">Backend para aplicativo mobile com autenticação OAuth2, upload de mídia, notificações push e sincronização offline-first.</span>
        <span data-lang="en">Mobile app backend with OAuth2 auth, media uploads, push notifications, and offline-first sync.</span>
      </p>
      <div class="project-stack">
        <span class="stack-tag">Node.js</span>
        <span class="stack-tag">MongoDB</span>
        <span class="stack-tag">Firebase</span>
        <span class="stack-tag">JWT</span>
      </div>
    </div>

    <div class="project-card fade-up">
      <div class="project-id">PROJECT_006</div>
      <div class="project-title">
        <span data-lang="pt" class="active">Pipeline CI/CD</span>
        <span data-lang="en">CI/CD Pipeline</span>
      </div>
      <p class="project-desc">
        <span data-lang="pt" class="active">Pipeline completo de CI/CD com Jenkins, testes automatizados, análise de código estático, deployment containerizado e monitoramento.</span>
        <span data-lang="en">Full CI/CD pipeline with Jenkins, automated testing, static code analysis, containerized deployment, and monitoring.</span>
      </p>
      <div class="project-stack">
        <span class="stack-tag">Docker</span>
        <span class="stack-tag">Jenkins</span>
        <span class="stack-tag">GitHub Actions</span>
        <span class="stack-tag">Linux</span>
      </div>
    </div>
  </div>
</div>
</section>

<div class="glow-line"></div>

<!-- GITHUB STATS -->
<section id="stats">
<div class="wrapper">
  <div class="section-header fade-up">
    <span class="section-label">
      <span data-lang="pt" class="active">Atividade</span>
      <span data-lang="en">Activity</span>
    </span>
    <h2 class="section-title">GitHub Stats</h2>
    <div class="section-line"></div>
  </div>

  <div class="stats-grid fade-up">
    <div class="stat-block">
      <span class="stat-icon">⬡</span>
      <div>
        <span class="stat-block-num">200+</span>
        <span class="stat-block-label">
          <span data-lang="pt" class="active">Commits este ano</span>
          <span data-lang="en">Commits this year</span>
        </span>
      </div>
    </div>
    <div class="stat-block">
      <span class="stat-icon">◈</span>
      <div>
        <span class="stat-block-num">30+</span>
        <span class="stat-block-label">
          <span data-lang="pt" class="active">Repositórios</span>
          <span data-lang="en">Repositories</span>
        </span>
      </div>
    </div>
    <div class="stat-block">
      <span class="stat-icon">⬢</span>
      <div>
        <span class="stat-block-num">50+</span>
        <span class="stat-block-label">
          <span data-lang="pt" class="active">Pull Requests</span>
          <span data-lang="en">Pull Requests</span>
        </span>
      </div>
    </div>
    <div class="stat-block">
      <span class="stat-icon">◇</span>
      <div>
        <span class="stat-block-num">10+</span>
        <span class="stat-block-label">Stars Earned</span>
      </div>
    </div>
  </div>

  <div class="github-imgs fade-up">
    <div class="github-img-wrap">
      <img src="https://github-readme-stats.vercel.app/api?username=luizFelippedev&show_icons=true&theme=chartreuse-dark&bg_color=020408&border_color=00ff8822&title_color=00ff88&icon_color=00e5ff&text_color=c8d8e8&hide_border=false" alt="GitHub Stats" loading="lazy">
    </div>
    <div class="github-img-wrap">
      <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=luizFelippedev&layout=compact&theme=chartreuse-dark&bg_color=020408&border_color=00ff8822&title_color=00ff88&text_color=c8d8e8&hide_border=false" alt="Top Languages" loading="lazy">
    </div>
  </div>
</div>
</section>

<div class="glow-line"></div>

<!-- CONTACT -->
<section id="contact">
<div class="wrapper">
  <div class="section-header fade-up">
    <span class="section-label">
      <span data-lang="pt" class="active">Contato</span>
      <span data-lang="en">Contact</span>
    </span>
    <h2 class="section-title">
      <span data-lang="pt" class="active">Vamos Construir Algo</span>
      <span data-lang="en">Let's Build Something</span>
    </h2>
    <div class="section-line"></div>
  </div>

  <div class="contact-grid">
    <div class="contact-links fade-up">
      <a href="https://www.linkedin.com/in/luizfelippetech/" target="_blank" class="contact-link">
        <span class="contact-link-icon">🔗</span>
        <span class="contact-link-text">
          <span class="contact-link-label">LinkedIn</span>
          <span class="contact-link-value">luizfelippetech</span>
        </span>
        <span class="contact-link-arrow">→</span>
      </a>
      <a href="https://github.com/luizFelippedev" target="_blank" class="contact-link">
        <span class="contact-link-icon">⬡</span>
        <span class="contact-link-text">
          <span class="contact-link-label">GitHub</span>
          <span class="contact-link-value">luizFelippedev</span>
        </span>
        <span class="contact-link-arrow">→</span>
      </a>
      <a href="mailto:luizfelippe@dev.com" class="contact-link">
        <span class="contact-link-icon">◈</span>
        <span class="contact-link-text">
          <span class="contact-link-label">Email</span>
          <span class="contact-link-value">luizfelippe@dev.com</span>
        </span>
        <span class="contact-link-arrow">→</span>
      </a>
    </div>

    <div class="availability-card fade-up">
      <div class="avail-indicator">
        <div class="avail-dot"></div>
        <span class="avail-status">
          <span data-lang="pt" class="active">Online · Disponível</span>
          <span data-lang="en">Online · Available</span>
        </span>
      </div>
      <div class="avail-title">
        <span data-lang="pt" class="active">Aberto a Oportunidades</span>
        <span data-lang="en">Open to Opportunities</span>
      </div>
      <p class="avail-desc">
        <span data-lang="pt" class="active">
          Estou disponível para projetos freelance, posições full-time e colaborações 
          open source. Vamos conversar sobre como posso agregar valor ao seu projeto!
        </span>
        <span data-lang="en">
          Available for freelance projects, full-time positions, and open source collaborations. 
          Let's talk about how I can add value to your project!
        </span>
      </p>
    </div>
  </div>
</div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <span class="footer-text">
      © 2025 <span>Luiz Felipe</span> — <span data-lang="pt" class="active">Desenvolvedor de Software</span><span data-lang="en">Software Developer</span>
    </span>
    <span class="footer-text">
      <span data-lang="pt" class="active">Construído com</span>
      <span data-lang="en">Built with</span>
      <span> ◈ HTML · CSS · JS</span>
    </span>
  </div>
</footer>

<script>
// ── LANG TOGGLE ──
let lang = 'pt';
function toggleLang() {
  lang = lang === 'pt' ? 'en' : 'pt';
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
}

// ── MATRIX RAIN ──
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let cols, drops;
const chars = '01アイウエオカキクケコ<>/{}[]|\\;:アBCDEFGHIJKL∑∆Ω∞';

function initMatrix() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cols = Math.floor(canvas.width / 18);
  drops = Array(cols).fill(1);
}

function drawMatrix() {
  ctx.fillStyle = 'rgba(2,4,8,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff88';
  ctx.font = '13px Share Tech Mono';
  drops.forEach((y, i) => {
    const ch = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillStyle = i % 3 === 0 ? '#00e5ff' : '#00ff88';
    ctx.globalAlpha = Math.random() * 0.6 + 0.2;
    ctx.fillText(ch, i * 18, y * 18);
    ctx.globalAlpha = 1;
    if (y * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  });
}

initMatrix();
window.addEventListener('resize', initMatrix);
setInterval(drawMatrix, 60);

// ── SCROLL ANIMATIONS ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Animate skill bars
      entry.target.querySelectorAll('.skill-fill').forEach(bar => {
        const w = bar.style.getPropertyValue('--w');
        bar.style.transform = `scaleX(${w})`;
      });
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up, .timeline-item, .skill-category').forEach(el => {
  observer.observe(el);
});

// Also observe skill categories directly
document.querySelectorAll('.skill-category').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.08}s`;
  observer.observe(el);
});

// Also animate project cards
document.querySelectorAll('.project-card').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.1}s`;
  observer.observe(el);
});
</script>
</body>
</html>
