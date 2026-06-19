/**
 * Zelda II NES-style intro sequence with BOTW 16-bit aesthetic.
 * Dark screen → castle silhouette rise → narrative crawl → fade to landing.
 */
const HeroIntro = (() => {
  const INTRO_KEY = 'heroIntroSeen';
  const NARRATIVE = [
    'When the wild winds stir across Hyrule...',
    '...a hero of legend awakens.',
    'What quest brings you here?',
  ];

  const PHASE = {
    STARS: 0,
    RISE: 1,
    HOLD: 2,
    TEXT: 3,
    FADE: 4,
    DONE: 5,
  };

  let canvas, ctx, overlay, textEl, skipBtn, soundBtn;
  let animId = null;
  let phase = PHASE.STARS;
  let phaseStart = 0;
  let castleY = 1;
  let textIndex = 0;
  let textVisible = false;
  let textTimer = 0;
  let stars = [];
  let mistOffset = 0;
  let onComplete = null;
  let running = false;
  let boundSkip = null;
  let boundSound = null;
  let boundKey = null;

  const TIMING = {
    stars: 1500,
    rise: 3500,
    hold: 1200,
    textLine: 2200,
    fade: 1500,
  };

  function initStars(w, h) {
    stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.7,
        size: Math.random() > 0.7 ? 2 : 1,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
      });
    }
  }

  function drawStars(w, h, time) {
    stars.forEach((s) => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(time * s.speed + s.twinkle));
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    });
  }

  function drawCastle(w, h, progress) {
    const baseY = h * 0.85;
    const targetY = h * 0.42;
    const y = baseY - (baseY - targetY) * progress;
    const scale = 2 + progress * 3;
    const cx = w / 2;

    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(scale, scale);

    const px = (x, py, pw, ph, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - pw / 2, py, pw, ph);
    };

    // Ground mist
    for (let i = -20; i < 20; i++) {
      const mx = i * 4 + Math.sin(mistOffset + i * 0.3) * 3;
      const my = 8 + Math.sin(mistOffset * 0.5 + i * 0.5) * 2;
      ctx.fillStyle = `rgba(42, 58, 74, ${0.3 + progress * 0.3})`;
      ctx.fillRect(mx, my, 6, 3);
    }

    // Castle silhouette (pixel blocks)
    const castleColor = '#0d1520';
    const glowColor = 'rgba(255, 140, 50, 0.5)';
    const blueGlow = 'rgba(74, 158, 255, 0.35)';

    // Main keep
    px(0, -18, 12, 18, castleColor);
    // Central tower
    px(0, -28, 6, 12, castleColor);
    px(0, -34, 4, 8, castleColor);
    px(0, -40, 2, 6, castleColor);
    // Left wing
    px(-10, -12, 9, 12, castleColor);
    px(-12, -18, 3, 8, castleColor);
    px(-12, -22, 2, 6, castleColor);
    // Right wing
    px(10, -12, 9, 12, castleColor);
    px(12, -18, 3, 8, castleColor);
    px(12, -22, 2, 6, castleColor);
    // Battlements
    px(-6, -20, 2, 3, castleColor);
    px(-2, -20, 2, 3, castleColor);
    px(2, -20, 2, 3, castleColor);
    px(6, -20, 2, 3, castleColor);
    // Window glows
    if (progress > 0.5) {
      px(0, -12, 2, 2, glowColor);
      px(-8, -8, 2, 2, blueGlow);
      px(8, -8, 2, 2, blueGlow);
    }

    // Triforce above castle
    if (progress > 0.7) {
      const triAlpha = (progress - 0.7) / 0.3;
      ctx.globalAlpha = triAlpha;
      ctx.fillStyle = '#e8a838';
      const ty = -48;
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(5, ty + 8);
      ctx.lineTo(-5, ty + 8);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawFrame(timestamp) {
    if (!running) return;
    if (!phaseStart) phaseStart = timestamp;
    const elapsed = timestamp - phaseStart;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    mistOffset += 0.02;

    switch (phase) {
      case PHASE.STARS:
        drawStars(w, h, timestamp * 0.001);
        if (elapsed > TIMING.stars) {
          phase = PHASE.RISE;
          phaseStart = timestamp;
          if (window.HeroAudio) HeroAudio.playIntroTheme();
        }
        break;

      case PHASE.RISE: {
        const progress = Math.min(elapsed / TIMING.rise, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        drawStars(w, h, timestamp * 0.001);
        drawCastle(w, h, eased);
        castleY = eased;
        if (progress >= 1) {
          phase = PHASE.HOLD;
          phaseStart = timestamp;
          if (window.HeroAudio) HeroAudio.playRevealSting();
        }
        break;
      }

      case PHASE.HOLD:
        drawStars(w, h, timestamp * 0.001);
        drawCastle(w, h, 1);
        if (elapsed > TIMING.hold) {
          phase = PHASE.TEXT;
          phaseStart = timestamp;
          textIndex = 0;
          textTimer = 0;
          showTextLine(0);
        }
        break;

      case PHASE.TEXT:
        drawStars(w, h, timestamp * 0.001);
        drawCastle(w, h, 1);
        textTimer += 16;
        if (textTimer > TIMING.textLine) {
          textTimer = 0;
          textIndex++;
          if (textIndex < NARRATIVE.length) {
            showTextLine(textIndex);
          } else {
            phase = PHASE.FADE;
            phaseStart = timestamp;
            hideText();
          }
        }
        break;

      case PHASE.FADE:
        drawStars(w, h, timestamp * 0.001);
        drawCastle(w, h, 1);
        {
          const fadeProgress = Math.min(elapsed / TIMING.fade, 1);
          overlay.style.opacity = String(1 - fadeProgress);
          if (fadeProgress >= 1) {
            phase = PHASE.DONE;
            finish();
            return;
          }
        }
        break;
    }

    animId = requestAnimationFrame(drawFrame);
  }

  function showTextLine(index) {
    if (!textEl) return;
    textEl.textContent = NARRATIVE[index];
    textEl.classList.add('visible');
    textVisible = true;
    if (window.HeroAudio) HeroAudio.playTextBlip();
  }

  function hideText() {
    if (textEl) textEl.classList.remove('visible');
    textVisible = false;
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars(rect.width, rect.height);
  }

  function finish() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
    overlay.classList.add('fade-out');
    sessionStorage.setItem(INTRO_KEY, '1');
    setTimeout(() => {
      overlay.classList.add('removed');
      overlay.setAttribute('aria-hidden', 'true');
      const landing = document.getElementById('landing');
      if (landing) landing.classList.remove('hidden');
      if (onComplete) onComplete();
    }, 1200);
  }

  function skip() {
    if (phase === PHASE.DONE) return;
    phase = PHASE.FADE;
    phaseStart = performance.now() - TIMING.fade * 0.7;
    hideText();
  }

  function start(force = false) {
    overlay = document.getElementById('intro-overlay');
    canvas = document.getElementById('intro-canvas');
    textEl = document.getElementById('intro-text');
    skipBtn = document.getElementById('intro-skip');
    soundBtn = document.getElementById('intro-sound');

    if (!overlay || !canvas) return;

    if (!force && sessionStorage.getItem(INTRO_KEY)) {
      overlay.classList.add('removed');
      overlay.setAttribute('aria-hidden', 'true');
      document.getElementById('landing')?.classList.remove('hidden');
      return;
    }

    ctx = canvas.getContext('2d');
    resize();

    overlay.classList.remove('fade-out', 'removed');
    overlay.style.opacity = '1';
    overlay.setAttribute('aria-hidden', 'false');
    document.getElementById('landing')?.classList.add('hidden');

    phase = PHASE.STARS;
    phaseStart = 0;
    castleY = 1;
    textIndex = 0;
    textVisible = false;
    running = true;

    if (boundSkip) skipBtn?.removeEventListener('click', boundSkip);
    if (boundSound) soundBtn?.removeEventListener('click', boundSound);
    if (boundKey) window.removeEventListener('keydown', boundKey);

    boundSkip = skip;
    boundSound = () => {
      const on = HeroAudio.toggle();
      soundBtn.textContent = on ? '🔊' : '🔇';
      soundBtn.classList.toggle('active', on);
      soundBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound');
    };
    boundKey = handleKey;

    skipBtn?.addEventListener('click', boundSkip);
    soundBtn?.addEventListener('click', boundSound);
    window.addEventListener('keydown', boundKey);
    window.addEventListener('resize', resize);

    animId = requestAnimationFrame(drawFrame);
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      skip();
    }
  }

  function replay() {
    sessionStorage.removeItem(INTRO_KEY);
    running = false;
    if (animId) cancelAnimationFrame(animId);
    start(true);
  }

  function setOnComplete(cb) {
    onComplete = cb;
  }

  return { start, skip, replay, setOnComplete };
})();

document.addEventListener('DOMContentLoaded', () => {
  HeroIntro.start();
});