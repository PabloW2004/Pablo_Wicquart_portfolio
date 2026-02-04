export function initProjectsDeck() {
  const deck = document.getElementById("projects-cards");
  const overlay = document.getElementById("project-modal-overlay");
  if (!deck || !overlay) return;

  const cards = Array.from(deck.querySelectorAll(".project-card"));
  if (!cards.length) return;

  // --------- Layout éventail ----------
  const maxAngle = 18;
  const spreadX = 42;
  const liftY = 8;

  function layoutFan() {
    const n = cards.length;
    const mid = (n - 1) / 2;

    cards.forEach((card, i) => {
      if (card.classList.contains("is-open")) return;

      const t = i - mid;
      const angle = mid === 0 ? 0 : (t / mid) * maxAngle;
      const x = t * spreadX;
      const y = Math.abs(t) * liftY;

      card.style.transform =
        `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`;
      card.style.zIndex = String(100 + i);
    });
  }

  // --------- État ----------
  let openCard = null;

  function setOverlayState(isOpen) {
    overlay.classList.toggle("show", isOpen);
    // IMPORTANT: overlay ne doit PAS capter les clics
    overlay.style.pointerEvents = "none";
  }

  function open(card) {
    if (openCard) return;

    openCard = card;

    deck.classList.add("has-open");
    card.classList.add("is-open");

    setOverlayState(true);

    // Bloquer scroll du site
    document.body.classList.add("modal-open");

    // Remettre la carte en haut
    card.scrollTop = 0;

    layoutFan();
  }

  function close() {
    if (!openCard) return;

    openCard.classList.remove("is-open");
    openCard = null;

    deck.classList.remove("has-open");
    setOverlayState(false);

    document.body.classList.remove("modal-open");

    requestAnimationFrame(layoutFan);
  }

  // --------- Events ----------

  // ✅ OUVERTURE: délégation sur le deck
  deck.addEventListener("click", (e) => {
    if (openCard) return;

    // Si tu cliques sur un lien/bouton, on ne toggle pas
    if (e.target.closest("a, button")) return;

    const card = e.target.closest(".project-card");
    if (!card) return;

    open(card);
  });

  // ✅ FERMETURE: clic global si on clique hors de la carte ouverte
  document.addEventListener(
    "click",
    (e) => {
      if (!openCard) return;

      // Si le clic est DANS la carte ouverte, on ne ferme pas
      if (e.target.closest(".project-card.is-open")) return;

      // Sinon -> fermeture
      close();
    },
    true // capture = ultra fiable
  );

  // ✅ Molette fluide: si on scrolle hors carte, on scrolle la carte
  window.addEventListener(
    "wheel",
    (e) => {
      if (!openCard) return;

      const insideOpen = e.target.closest(".project-card.is-open");
      if (insideOpen) return; // laisse la carte gérer son scroll normalement

      // Sinon, on redirige vers la carte
      e.preventDefault();
      openCard.scrollTop += e.deltaY;
    },
    { passive: false }
  );

  // ✅ Bouton "Visiter": ne doit ni ouvrir ni fermer la carte
  document.querySelectorAll(".project-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // target="_blank" fait le job
    });
  });

  // ✅ ESC pour fermer
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // ✅ Resize -> recalcul éventail
  window.addEventListener("resize", () => requestAnimationFrame(layoutFan));

  // Init
  setOverlayState(false);
  layoutFan();
  setTimeout(layoutFan, 200);
}
