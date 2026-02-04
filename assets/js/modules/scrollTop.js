export function initScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTop");
  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) scrollTopBtn.classList.add("visible");
    else scrollTopBtn.classList.remove("visible");
  }, { passive: true });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
