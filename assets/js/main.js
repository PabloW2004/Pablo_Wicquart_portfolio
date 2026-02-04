import { initNavbarScroll } from "./modules/navbarScroll.js";
import { initScrollReveal } from "./modules/scrollReveal.js";
import { initSmoothScroll } from "./modules/smoothScroll.js";
import { initScrollTop } from "./modules/scrollTop.js";
import { initStatsCounter } from "./modules/statsCounter.js";
import { initFlightPath } from "./modules/flightPath.js";
import { initStarfield } from "./modules/starsBackground.js";
import { initProjectsDeck } from "./modules/projectsDeck.js";

initProjectsDeck();
initNavbarScroll();
initScrollReveal();
initSmoothScroll();
initScrollTop();
initStatsCounter();
initFlightPath();
initStarfield({
  density: 0.05,
  parallax: 0.15,
  twinkleChance: 5,     // encore plus rare
  twinkleDuration: 500,   // 1s
  twinkleBoost: 0.4,
  fadeStart: 0.01,
  fadeEnd: 0.10,
  fadeMax: 1.0
});

