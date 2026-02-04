export function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  }, { passive: true });
}
