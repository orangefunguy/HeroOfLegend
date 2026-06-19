/**
 * Apple Mac Studio-style scroll-driven story.
 * All animations scrub with scroll position and reverse on scroll up.
 */
const ScrollStory = (() => {
  const scenes = [];
  let reducedMotion = false;
  let ticking = false;

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getSceneProgress(sceneEl) {
    const rect = sceneEl.getBoundingClientRect();
    const track = sceneEl.offsetHeight - window.innerHeight;
    if (track <= 0) return rect.top <= 0 ? 1 : 0;
    const scrolled = -rect.top;
    return clamp(scrolled / track, 0, 1);
  }

  function setCaption(el, opacity, y, scale) {
    if (!el) return;
    el.style.opacity = opacity;
    const centered = el.classList.contains('narrative-caption--accent');
    const base = centered ? 'translateX(-50%) ' : '';
    el.style.transform = `${base}translateY(${y}px) scale(${scale})`;
  }

  function updateIntro(p) {
    const swordWrap = document.getElementById('intro-sword-wrap');
    const plungeLines = document.getElementById('intro-plunge-lines');
    const pyramidWrap = document.getElementById('intro-pyramid-wrap');
    const impact = document.getElementById('intro-impact');
    const swordGlow = document.getElementById('intro-sword-glow');
    const godRays = document.getElementById('intro-god-rays');
    const b1 = document.getElementById('intro-bubble-1');
    const b2 = document.getElementById('intro-bubble-2');
    const b3 = document.getElementById('intro-bubble-3');

    const vh = window.innerHeight;

    // Phase 1 (0–0.6): sword plunges straight down, point-first, perfectly vertical
    const diveT = easeInOutCubic(clamp(p / 0.6, 0, 1));
    const swordStartY = -vh * 0.38;
    const swordEndY = vh * 0.34;
    const swordY = lerp(swordStartY, swordEndY, diveT);

    if (swordWrap) {
      swordWrap.style.setProperty('--sword-y', `${swordY}px`);
      swordWrap.style.setProperty('--sword-rotate', '0deg');
      swordWrap.style.setProperty('--sword-scale', lerp(1.05, 1, diveT));
    }

    // Vertical speed lines trail behind the plunge
    if (plungeLines) {
      const linesOpacity = diveT > 0.02 && diveT < 0.92
        ? lerp(0, 0.85, Math.sin(diveT * Math.PI))
        : 0;
      plungeLines.style.opacity = linesOpacity;
      plungeLines.style.transform = `translateX(-50%) translateY(${swordY * 0.15}px)`;
    }

    if (pyramidWrap) {
      const pyramidScale = lerp(0.75, 1, easeOutCubic(clamp(p / 0.25, 0, 1)));
      pyramidWrap.style.setProperty('--pyramid-scale', pyramidScale);
    }

    // God rays intensify as sword seats
    if (godRays) {
      godRays.style.opacity = lerp(0.5, 1, easeOutCubic(clamp(p / 0.5, 0, 1)));
    }

    // Impact flash when tip meets Triforce apex
    const impactT = clamp((p - 0.54) / 0.1, 0, 1);
    if (impact) {
      impact.style.setProperty('--impact-scale', easeOutCubic(impactT) * 2.5);
      impact.style.setProperty('--impact-opacity', impactT > 0 && impactT < 0.8
        ? 1 - impactT * 0.6
        : impactT >= 0.8 ? lerp(0.4, 0.6, clamp((p - 0.6) / 0.15, 0, 1)) : 0);
    }

    // Blade glow after seated (pedestal scene like BOTW reference)
    if (swordGlow) {
      const glowT = easeOutCubic(clamp((p - 0.58) / 0.12, 0, 1));
      swordGlow.style.opacity = glowT;
    }

    // Narrative captions stagger after the sword seats
    const b1T = easeOutCubic(clamp((p - 0.56) / 0.1, 0, 1));
    const b2T = easeOutCubic(clamp((p - 0.66) / 0.1, 0, 1));
    const b3T = easeOutCubic(clamp((p - 0.76) / 0.12, 0, 1));

    setCaption(b1, b1T, lerp(16, 0, b1T), lerp(0.92, 1, b1T));
    setCaption(b2, b2T, lerp(16, 0, b2T), lerp(0.92, 1, b2T));
    setCaption(b3, b3T, lerp(16, 0, b3T), lerp(0.92, 1, b3T));
  }

  function updateHero(p) {
    const reveal = document.getElementById('hero-reveal');
    if (!reveal) return;
    const t = easeOutCubic(p);
    reveal.style.setProperty('--hero-opacity', t);
    reveal.style.setProperty('--hero-y', `${lerp(60, 0, t)}px`);
  }

  function updateQuests(p) {
    const cards = document.querySelectorAll('.quest-card');
    const count = cards.length;
    cards.forEach((card, i) => {
      const start = i / (count + 0.5);
      const end = start + 0.22;
      const t = easeOutCubic(clamp((p - start) / (end - start), 0, 1));
      const rotate = card.dataset.card === '0' ? -2 : card.dataset.card === '1' ? 1 : card.dataset.card === '2' ? -1 : 2;
      card.style.setProperty('--card-opacity', t);
      card.style.setProperty('--card-y', `${lerp(50, 0, t)}px`);
      card.style.setProperty('--card-rotate', `${lerp(rotate * 3, rotate, t)}deg`);
    });
  }

  function updateContact(p) {
    const reveal = document.getElementById('contact-reveal');
    const panel = document.getElementById('contact-panel');
    if (!reveal) return;

    const t = easeOutCubic(p);
    reveal.style.setProperty('--contact-opacity', t);
    reveal.style.setProperty('--contact-y', `${lerp(80, 0, t)}px`);
    reveal.style.setProperty('--contact-scale', lerp(0.92, 1, t));

    if (panel) {
      panel.style.setProperty('--contact-interactive', t > 0.75 ? 'auto' : 'none');
    }
  }

  function updateUI() {
    const introScene = document.getElementById('scene-intro');
    const introP = introScene ? getSceneProgress(introScene) : 1;
    const hint = document.getElementById('scroll-hint');
    const header = document.getElementById('site-header');

    if (hint) hint.classList.toggle('hidden', introP > 0.08 || window.scrollY > 80);
    if (header) header.classList.toggle('visible', introP > 0.15 || window.scrollY > 100);
  }

  function update() {
    scenes.forEach((scene) => {
      const p = getSceneProgress(scene);
      scene.style.setProperty('--progress', p);
      const type = scene.dataset.scene;
      if (type === 'intro') updateIntro(p);
      else if (type === 'hero') updateHero(p);
      else if (type === 'quests') updateQuests(p);
      else if (type === 'contact') updateContact(p);
    });
    updateUI();
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function initSceneHeights() {
    document.querySelectorAll('.scroll-scene').forEach((scene) => {
      const mult = parseFloat(scene.dataset.height) || 3;
      scene.style.setProperty('--scene-mult', mult);
      scenes.push(scene);
    });
  }

  function initReducedMotion() {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      updateIntro(1);
      updateHero(1);
      updateQuests(1);
      updateContact(1);
      const panel = document.getElementById('contact-panel');
      if (panel) panel.style.setProperty('--contact-interactive', 'auto');
      const hint = document.getElementById('scroll-hint');
      if (hint) hint.classList.add('hidden');
      const header = document.getElementById('site-header');
      if (header) header.classList.add('visible');
    }
  }

  function scrollToScene(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function init() {
    initSceneHeights();
    initReducedMotion();
    if (!reducedMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }
  }

  return { init, scrollToScene, getSceneProgress };
})();

document.addEventListener('DOMContentLoaded', () => {
  ScrollStory.init();
});

window.ScrollStory = ScrollStory;