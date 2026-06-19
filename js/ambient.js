/**
 * BOTW-inspired ambient effects: spirit orb particles, parallax.
 */
const HeroAmbient = (() => {
  let canvas, ctx, particles = [], animId = null;
  let running = false;

  function initParticles(w, h) {
    particles = [];
    const count = Math.min(40, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() > 0.6 ? 3 : 2,
        speedY: -0.15 - Math.random() * 0.3,
        speedX: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.3 ? '74, 232, 255' : '255, 140, 50',
      });
    }
  }

  function draw(time) {
    if (!running || !ctx) return;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = time * 0.001;
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(t + p.phase) * 0.15;

      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const alpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 2 + p.phase));
      ctx.fillStyle = `rgba(${p.hue}, ${alpha})`;
      const s = p.size;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);

      if (s > 2) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
      }
    });

    animId = requestAnimationFrame(draw);
  }

  function start() {
    canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initParticles(rect.width, rect.height);
    running = true;
    animId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas || !running) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles(rect.width, rect.height);
  }

  function stop() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
  }

  return { start, stop };
})();

document.addEventListener('DOMContentLoaded', () => {
  const landing = document.getElementById('landing');
  if (!landing) return;

  const observer = new MutationObserver(() => {
    if (!landing.classList.contains('hidden')) {
      HeroAmbient.start();
      observer.disconnect();
    }
  });

  if (!landing.classList.contains('hidden')) {
    HeroAmbient.start();
  } else {
    observer.observe(landing, { attributes: true, attributeFilter: ['class'] });
  }

  if (window.HeroIntro) {
    HeroIntro.setOnComplete(() => HeroAmbient.start());
  }
});

window.HeroAmbient = HeroAmbient;