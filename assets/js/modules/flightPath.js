export function initFlightPath() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const pageSvg = document.getElementById("page-path");
  const dotted = document.getElementById("page-dotted-path");
  const maskPath = document.getElementById("page-mask-path");

  const planeSvg = document.getElementById("plane-overlay");
  const plane = document.getElementById("plane");
  const planeImg = document.getElementById("plane-img");

  // Croix HTML
  const crossFinish = document.getElementById("cross-finish");
  const crossOffsetX = -40;
  const crossOffsetY = -40;

  // Flèche graffiti
  const arrowOverlay = document.getElementById("arrow-overlay");
  const arrowSvg = document.getElementById("arrow-svg");
  const arrowPath = document.getElementById("arrow-path");
  const arrowHead = document.getElementById("arrow-head");

  const targetBtn =
    document.querySelector('.contact a.btn.btn-primary[href^="mailto:"]') ||
    document.querySelector('#contact a[href^="mailto:"]') ||
    document.querySelector(".contact .btn-primary");

  if (
    !pageSvg || !dotted || !maskPath ||
    !planeSvg || !plane || !planeImg ||
    !crossFinish ||
    !arrowOverlay || !arrowSvg || !arrowPath || !arrowHead
  ) return;

  const config = {
    marginTop: 220,
    marginBottom: 220,
    baseXPercent: 55,
    wanderMax: 260,
    segmentMin: 260,
    segmentMax: 520,
    smoothness: 0.16,
    seed: 7777,
    lookAhead: 18,
    angleOffset: 70
  };

  // Flèche: réglages
  const arrowEndPadding = 30;   // raccourcit côté bouton (tige nickel, on touche pas)
  const arrowStartOffsetX = 0;
  const arrowStartOffsetY = 0;
  const arrowCurveLift = 30;

  const endThreshold = 0.985;

  let pathLength = 0;
  let planeW = 44;
  let planeH = 44;

  let arrowTimer = null;
  let arrowShown = false;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function syncArrowSvgViewBox() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    arrowSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    arrowSvg.setAttribute("width", w);
    arrowSvg.setAttribute("height", h);
  }

  function readPlaneSize() {
    planeW = parseFloat(planeImg.getAttribute("width")) || 44;
    planeH = parseFloat(planeImg.getAttribute("height")) || 44;
  }

  function buildOrganicPath() {
    const doc = document.documentElement;
    const docH = Math.max(doc.scrollHeight, document.body.scrollHeight || 0);
    const w = window.innerWidth;

    pageSvg.setAttribute("width", w);
    pageSvg.setAttribute("height", docH);
    pageSvg.setAttribute("viewBox", `0 0 ${w} ${docH}`);

    const rand = mulberry32(config.seed);
    const baseX = (config.baseXPercent / 100) * w;
    const leftBound = 80;
    const rightBound = w - 80;

    const pts = [];
    let y = config.marginTop;

    pts.push({ x: clamp(baseX + (rand() * 2 - 1) * 120, leftBound, rightBound), y });

    while (y < docH - config.marginBottom) {
      const seg = config.segmentMin + rand() * (config.segmentMax - config.segmentMin);
      y += seg;

      const chaos = (rand() * 2 - 1) * config.wanderMax;
      const prev = pts[pts.length - 1];
      const pullToCenter = (baseX - prev.x) * config.smoothness;

      const x = clamp(prev.x + chaos + pullToCenter, leftBound, rightBound);
      pts.push({ x, y: Math.min(y, docH - config.marginBottom) });
    }

    function catmullRom2bezier(points) {
      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} `;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const s = config.smoothness;

        const cp1x = p1.x + (p2.x - p0.x) * s;
        const cp1y = p1.y + (p2.y - p0.y) * s;

        const cp2x = p2.x - (p3.x - p1.x) * s;
        const cp2y = p2.y - (p3.y - p1.y) * s;

        d += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
      }
      return d;
    }

    const d = catmullRom2bezier(pts);
    dotted.setAttribute("d", d);
    maskPath.setAttribute("d", d);

    pathLength = dotted.getTotalLength();
    maskPath.style.strokeDasharray = `${pathLength}`;
    maskPath.style.strokeDashoffset = `${pathLength}`;
  }

  function resetGraffitiArrow() {
    arrowOverlay.classList.remove("show");
    arrowShown = false;
    arrowHead.style.transform = "translate(-9999px, -9999px)";
  }

  // ✅ On ne change PAS la tige, juste l'orientation de la pointe.
  function positionGraffitiArrowFrom(startX, startY) {
    if (!targetBtn) return;

    const b = targetBtn.getBoundingClientRect();

    // ✅ TIGE: inchangée (elle vise le côté gauche du bouton)
    const targetX = b.left - 10;
    const targetY = b.top + b.height / 2;

    // ✅ CENTRE DU BOUTON: utilisé uniquement pour la ROTATION de la pointe
    const btnCenterX = b.left + b.width / 2;
    const btnCenterY = b.top + b.height / 2;

    // Raccourcir côté bouton
    const dx0 = targetX - startX;
    const dy0 = targetY - startY;
    const dist0 = Math.hypot(dx0, dy0);
    if (dist0 < 1) return;

    const usable = Math.max(0, dist0 - arrowEndPadding);
    const ux = dx0 / dist0;
    const uy = dy0 / dist0;

    const endX = startX + ux * usable;
    const endY = startY + uy * usable;

    // Courbe "graffiti"
    const dx = endX - startX;
    const dy = endY - startY;

    const midX = startX + dx * 0.55;
    const midY = startY + dy * 0.55 + arrowCurveLift;

    // Tige: inchangée
    arrowPath.setAttribute(
      "d",
      `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`
    );

    // (dashStart ne sert plus si tu as supprimé l'animation, mais ça ne gêne pas)
    const L = arrowPath.getTotalLength();
    arrowPath.style.setProperty("--dashStart", `${Math.max(200, L)}`);

    // ✅ ROTATION POINTE: end -> centre du bouton (AU LIEU de mid -> end)
    const headAngle = Math.atan2(btnCenterY - endY, btnCenterX - endX) * (180 / Math.PI);

    arrowHead.style.setProperty(
      "--headT",
      `translate(${endX.toFixed(1)}px, ${endY.toFixed(1)}px) translate(-6px, -12px)`
    );
    arrowHead.style.setProperty("--headR", `${headAngle.toFixed(2)}deg`);
    arrowHead.style.transform =
      `translate(${endX.toFixed(1)}px, ${endY.toFixed(1)}px) translate(-6px, -12px) rotate(${headAngle.toFixed(2)}deg)`;
  }

  function update() {
    const doc = document.documentElement;
    const scrollY = window.scrollY || doc.scrollTop || 0;
    const scrollMax = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const p = clamp(scrollY / scrollMax, 0, 1);

    // Overlay avion
    const raw = scrollY / scrollMax;
    const fadeStart = 0.01;
    const fadeEnd = 0.10;
    const alpha = clamp((raw - fadeStart) / (fadeEnd - fadeStart), 0, 1);
    planeSvg.style.opacity = (alpha * 0.35).toFixed(3);

    // Chemin
    const len = pathLength * p;
    maskPath.style.strokeDashoffset = `${pathLength - len}`;

    // Position avion
    const pt = dotted.getPointAtLength(len);
    const la = clamp(len + config.lookAhead, 0, pathLength);
    const pt2 = dotted.getPointAtLength(la);

    const vx = pt.x;
    const vy = pt.y - scrollY;
    const vx2 = pt2.x;
    const vy2 = pt2.y - scrollY;

    const angle = (Math.atan2(vy2 - vy, vx2 - vx) * (180 / Math.PI)) + config.angleOffset;

    const x = vx - planeW / 2;
    const y = vy - planeH / 2;

    plane.setAttribute(
      "transform",
      `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)} ${planeW / 2} ${planeH / 2})`
    );

    // Croix
    const crossX = x + crossOffsetX;
    const crossY = y + crossOffsetY;
    crossFinish.style.transform = `translate(${crossX.toFixed(2)}px, ${crossY.toFixed(2)}px)`;

    // Départ flèche = centre de la croix
    const crossW = crossFinish.offsetWidth || 132;
    const crossH = crossFinish.offsetHeight || 132;
    const arrowStartX = crossX + crossW / 2 + arrowStartOffsetX;
    const arrowStartY = crossY + crossH / 2 + arrowStartOffsetY;

    const atEnd = p >= endThreshold;

    planeImg.style.opacity = atEnd ? "0" : "1";
    crossFinish.style.opacity = atEnd ? "1" : "0";

    if (atEnd) {
      syncArrowSvgViewBox();
      positionGraffitiArrowFrom(arrowStartX, arrowStartY);

      if (!arrowShown && !arrowTimer) {
        arrowTimer = setTimeout(() => {
          const doc2 = document.documentElement;
          const scrollY2 = window.scrollY || doc2.scrollTop || 0;
          const scrollMax2 = Math.max(1, doc2.scrollHeight - doc2.clientHeight);
          const p2 = clamp(scrollY2 / scrollMax2, 0, 1);

          if (p2 >= endThreshold) {
            resetGraffitiArrow();
            void arrowOverlay.offsetWidth;

            syncArrowSvgViewBox();
            positionGraffitiArrowFrom(arrowStartX, arrowStartY);
            arrowOverlay.classList.add("show");
            arrowShown = true;
          }
          arrowTimer = null;
        }, 500);
      }
    } else {
      if (arrowTimer) {
        clearTimeout(arrowTimer);
        arrowTimer = null;
      }
      resetGraffitiArrow();
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  readPlaneSize();
  buildOrganicPath();
  syncArrowSvgViewBox();
  resetGraffitiArrow();
  update();

  window.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      readPlaneSize();
      buildOrganicPath();
      syncArrowSvgViewBox();
      update();
    });
  });
}
