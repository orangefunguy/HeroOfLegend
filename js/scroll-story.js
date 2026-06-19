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

  function setBubble(el, opacity, y, scale) {
    if (!el) return;
    el.style.opacity = opacity;
    const base = el.id === 'intro-bubble-3' ? 'translateX(-50%) ' : '';
    el.style.transform = `${base}translateY(${y}px) scale(${scale})`;
  }

  function updateIntro(p) {
    const swordWrap = document.getElementById('intro-sword-wrap');
    const actionLines = document.getElementById('intro-action-lines');
    const pyramidWrap = document.getElementById('intro-pyramid-wrap');
    const impact = document.getElementById('intro-impact');
    const b1 = document.getElementById('intro-bubble-1');
    const b2 = document.getElementById('intro-bubble-2');
    const b3 = document.getElementById('intro-bubble-3');

    // Phase 1 (0–0.55): sword dives toward pyramid
    const diveT = easeInOutCubic(clamp(p / 0.55, 0, 1));
    const vh = window.innerHeight;
    const swordTravel = vh * 0.38;
    const swordY = lerp(0, swordTravel, diveT);
    const swordRotate = lerp(-8, 12, diveT);
    const swordScale = lerp(1, 0.85, diveT);

    if (swordWrap) {
      swordWrap.style.setProperty('--sword-y', `${swordY}px`);
      swordWrap.style.setProperty('--sword-rotate', `${swordRotate}deg`);
      swordWrap.style.setProperty('--sword-scale', swordScale);
    }

    if (actionLines) {
      actionLines.style.opacity = diveT > 0.05 && diveT < 0.85 ? lerp(0, 0.9, Math.sin(diveT * Math.PI)) : 0;
    }

    if (pyramidWrap) {
      const pyramidScale = lerp(0.7, 1, easeOutCubic(clamp(p / 0.3, 0, 1)));
      pyramidWrap.style.setProperty('--pyramid-scale', pyramidScale);
    }

    // Impact at dive completion
    const impactT = clamp((p - 0.48) / 0.12, 0, 1);
    if (impact) {
      impact.style.setProperty('--impact-scale', easeOutCubic(impactT) * 2);
      impact.style.setProperty('--impact-opacity', impactT > 0 && impactT < 1 ? 1 - impactT * 0.5 : impactT >= 1 ? 0.5 : 0);
    }

    // Speech bubbles stagger after impact
    const b1T = easeOutCubic(clamp((p - 0.52) / 0.12, 0, 1));
    const b2T = easeOutCubic(clamp((p - 0.62) / 0.12, 0, 1));
    const b3T = easeOutCubic(clamp((p - 0.74) / 0.14, 0, 1));

    setBubble(b1, b1T, lerp(20, 0, b1T), lerp(0.9, 1, b1T));
    setBubble(b2, b2T, lerp(20, 0, b2T), lerp(0.9, 1, b2T));
    setBubble(b3, b3T, lerp(20, 0, b3T), lerp(0.9, 1, b3T));
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