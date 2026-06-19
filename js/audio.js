/**
 * Procedural chiptune audio for the intro sequence.
 * Original composition — no copyrighted game audio.
 */
const HeroAudio = (() => {
  let ctx = null;
  let enabled = false;
  let masterGain = null;

  function init() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function playTone(freq, start, duration, type = 'square', volume = 0.3) {
    if (!enabled || !ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function playIntroTheme() {
    if (!enabled) return;
    init();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const melody = [
      [392, 0], [440, 0.3], [494, 0.6], [523, 0.9],
      [494, 1.3], [440, 1.6], [392, 1.9], [349, 2.3],
      [392, 2.7], [440, 3.0], [523, 3.3], [587, 3.6],
      [523, 4.0], [494, 4.3], [440, 4.6], [392, 5.0],
    ];

    melody.forEach(([freq, offset]) => {
      playTone(freq, t + offset, 0.28, 'square', 0.2);
      playTone(freq / 2, t + offset, 0.28, 'triangle', 0.1);
    });

    const bass = [
      [98, 0], [98, 0.6], [110, 1.2], [110, 1.8],
      [98, 2.4], [87, 3.0], [98, 3.6], [98, 4.2],
    ];
    bass.forEach(([freq, offset]) => {
      playTone(freq, t + offset, 0.5, 'triangle', 0.15);
    });
  }

  function playRevealSting() {
    if (!enabled) return;
    init();
    const t = ctx.currentTime;
    [262, 330, 392, 523].forEach((freq, i) => {
      playTone(freq, t + i * 0.12, 0.4, 'square', 0.25 - i * 0.03);
    });
  }

  function playTextBlip() {
    if (!enabled) return;
    init();
    playTone(880, ctx.currentTime, 0.06, 'square', 0.08);
  }

  function setEnabled(val) {
    enabled = val;
    if (val && !ctx) init();
    if (val && ctx && ctx.state === 'suspended') ctx.resume();
  }

  function isEnabled() {
    return enabled;
  }

  function toggle() {
    setEnabled(!enabled);
    return enabled;
  }

  return { playIntroTheme, playRevealSting, playTextBlip, setEnabled, isEnabled, toggle };
})();

window.HeroAudio = HeroAudio;