// starsBackground.js
export function initStarfield(options = {}) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const cfg = {
    density: options.density ?? 0.6,
    parallax: options.parallax ?? 0.15,

    minR: options.minR ?? 0.4,
    maxR: options.maxR ?? 1.6,

    minA: options.minA ?? 0.25,
    maxA: options.maxA ?? 0.85,

    minDepth: options.minDepth ?? 0.15,
    maxDepth: options.maxDepth ?? 1.0,

    clearAlpha: 1.0,

    // ✨ twinkle
    twinkleChance: options.twinkleChance ?? 0.2,   // visible mais rare
    twinkleDuration: options.twinkleDuration ?? 1000,
    twinkleBoost: options.twinkleBoost ?? 2.2,

    // fade-in au scroll (comme l’avion)
    fadeStart: options.fadeStart ?? 0.01, // 1% du scroll
    fadeEnd: options.fadeEnd ?? 0.10,     // 10% du scroll
    fadeMax: options.fadeMax ?? 1.0       // opacité max (1 = normal)

  };

  const canvas = document.createElement("canvas");
  canvas.id = "starfield-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let stars = [];
  let running = true;
  let rafId = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    w = Math.max(1, window.innerWidth);
    h = Math.max(1, window.innerHeight);

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area = (w * h) / 10000;
    const count = Math.max(80, Math.floor(area * cfg.density * 35));

    stars = new Array(count).fill(0).map(() => {
      const depth = rand(cfg.minDepth, cfg.maxDepth);
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(cfg.minR, cfg.maxR) * (0.6 + depth * 0.8),
        a: rand(cfg.minA, cfg.maxA),
        depth,
        twStart: -1,
        twDur: cfg.twinkleDuration
      };
    });
  }

  function draw(now = performance.now()) {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const baseOffset = -scrollY * cfg.parallax;
    const doc = document.documentElement;
    const scrollMax = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const raw = scrollY / scrollMax;

    // fade rapide (0 -> fadeMax)
    const fade = Math.max(0, Math.min(1, (raw - cfg.fadeStart) / (cfg.fadeEnd - cfg.fadeStart)));
    canvas.style.opacity = (fade * cfg.fadeMax).toFixed(3);


    ctx.clearRect(0, 0, w, h);

    // déclenchement twinkle (rare)
    if (cfg.twinkleChance > 0 && stars.length) {
      if (Math.random() < cfg.twinkleChance / 60) {
        const s = stars[(Math.random() * stars.length) | 0];
        if (s && s.twStart < 0) s.twStart = now;
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const s of stars) {
      let y = s.y + baseOffset * s.depth;
      y = ((y % h) + h) % h;

      let a = s.a;
      let r = s.r;
      let pulse = 0;

      if (s.twStart >= 0) {
        const t = (now - s.twStart) / s.twDur;
        if (t >= 1) {
          s.twStart = -1;
        } else {
          pulse = Math.sin(Math.PI * t);
          a = Math.min(1, a * (1 + pulse * cfg.twinkleBoost));
          r = s.r * (1 + pulse * 1.2);
        }
      }

      // étoile
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.arc(s.x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // halo visible pendant le twinkle
      if (pulse > 0.01) {
        ctx.save();
        ctx.globalAlpha = 0.35 * pulse;
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(s.x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  function tick(t) {
    if (!running) return;
    draw(t);
    rafId = requestAnimationFrame(tick);
  }

  function onScroll() {
    draw();
  }

  resize();
  draw();
  rafId = requestAnimationFrame(tick);

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  return {
    destroy() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      canvas.remove();
    }
  };
}
