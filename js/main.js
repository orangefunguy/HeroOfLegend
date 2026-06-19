/**
 * Main landing page interactions.
 */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const replayBtn = document.getElementById('replay-intro');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        if (window.HeroIntro) HeroIntro.replay();
      }, 400);
    });
  }

  // Subtle parallax on hero layers
  const hero = document.querySelector('.hero');
  const layers = document.querySelectorAll('.hero-clouds, .hero-landscape, .hero-mist');
  if (hero && layers.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progress = -rect.top / rect.height;
      layers.forEach((layer, i) => {
        const speed = (i + 1) * 12;
        layer.style.transform = `translateY(${progress * speed}px)`;
      });
    }, { passive: true });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});