function animateValue(element, start, end, duration) {
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value + (element.dataset.suffix || "");
    if (progress < 1) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}

export function initStatsCounter() {
  const statsSections = document.querySelectorAll(".stats");
  if (!statsSections.length) return;

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const statNumbers = entry.target.querySelectorAll(".stat-number");
      statNumbers.forEach(stat => {
        const original = stat.textContent.trim();
        const endValue = parseInt(original, 10);
        stat.dataset.suffix = original.replace(/[0-9]/g, "");
        animateValue(stat, 0, endValue, 2000);
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  statsSections.forEach(section => statsObserver.observe(section));
}
