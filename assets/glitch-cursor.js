// A small monochrome "glitch" cursor: three offset outline layers, difference-blended,
// jittering every frame with occasional stronger glitch bursts. Mouse + reduced-motion only.
try {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (!reduceMotion && hasFinePointer) {
    const cursor = document.createElement('div');
    cursor.className = 'glitch-cursor';
    cursor.innerHTML = '<span class="gc-layer gc-a"></span><span class="gc-layer gc-b"></span><span class="gc-layer gc-c"></span>';
    cursor.style.display = 'none';
    document.body.appendChild(cursor);
    document.documentElement.classList.add('glitch-cursor-on');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.display = 'block';
    }, { passive: true });
    window.addEventListener('mouseleave', () => { cursor.style.display = 'none'; });

    const layers = cursor.querySelectorAll('.gc-layer');
    const jitter = () => (Math.random() - 0.5) * 6;

    let raf = null;
    const loop = () => {
      const burst = Math.random() < 0.1; // occasional stronger glitch
      const amt = burst ? 3 : 1;
      cursor.style.transform = `translate(${mx}px, ${my}px)`;
      layers.forEach((el, i) => {
        const ox = jitter() * amt * (i + 1) * 0.4;
        const oy = jitter() * amt * (i + 1) * 0.4;
        el.style.transform = `translate(${ox}px, ${oy}px)`;
        el.style.opacity = burst ? String(0.5 + Math.random() * 0.5) : '0.85';
      });
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
    start();
  }
} catch (err) {
  console.warn('glitch-cursor skipped:', err);
}
