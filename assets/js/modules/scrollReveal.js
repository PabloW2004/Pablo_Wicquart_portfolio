export function initScrollReveal() {
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, observerOptions);

  document.querySelectorAll("section:not(.hero)").forEach(section => {
    sectionObserver.observe(section);
  });

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), index * 100);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".skill-card, .project-card").forEach(card => {
    cardObserver.observe(card);
  });
}
