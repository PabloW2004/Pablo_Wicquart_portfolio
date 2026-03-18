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
    overlay.style.pointerEvents = isOpen ? "auto" : "none";
  }

  function getOpenIndex() {
    if (!openCard) return -1;
    return cards.indexOf(openCard);
  }

  // --------- Scroll wrapper (pour laisser les flèches dépasser) ----------
  function ensureScrollWrapper(card) {
    if (!card) return;

    // déjà fait
    if (card.querySelector(":scope > .project-scroll")) return;

    const scroll = document.createElement("div");
    scroll.className = "project-scroll";

    // On déplace tous les enfants dans le wrapper,
    // sauf la croix et les flèches (qui doivent rester "au-dessus")
    const keepSelectors = [".project-close", ".project-nav-btn"];
    const children = Array.from(card.children);

    children.forEach((el) => {
      if (keepSelectors.some((sel) => el.matches(sel))) return;
      scroll.appendChild(el);
    });

    card.appendChild(scroll);
  }

  function scrollCardToTop(card) {
    const sc = card?.querySelector(":scope > .project-scroll");
    if (sc) sc.scrollTop = 0;
    else card.scrollTop = 0; // fallback
  }

  // --------- Flèches internes ----------
  function ensureNavButtons(card) {
    let prevBtn = card.querySelector(".project-nav-btn.prev");
    let nextBtn = card.querySelector(".project-nav-btn.next");

    if (!prevBtn) {
      prevBtn = document.createElement("button");
      prevBtn.className = "project-nav-btn prev";
      prevBtn.type = "button";
      prevBtn.setAttribute("aria-label", "Projet précédent");
      prevBtn.textContent = "‹";
      card.appendChild(prevBtn);

      // bind une seule fois
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        prev();
      });
    }

    if (!nextBtn) {
      nextBtn = document.createElement("button");
      nextBtn.className = "project-nav-btn next";
      nextBtn.type = "button";
      nextBtn.setAttribute("aria-label", "Projet suivant");
      nextBtn.textContent = "›";
      card.appendChild(nextBtn);

      // bind une seule fois
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        next();
      });
    }
  }

  function open(card) {
    if (openCard) return;

    // 1) Préparer wrapper scroll + flèches
    ensureScrollWrapper(card);
    ensureNavButtons(card);

    openCard = card;

    deck.classList.add("has-open");
    card.classList.add("is-open");

    setOverlayState(true);

    // 2) Remettre le scroll EN HAUT (sur wrapper)
    scrollCardToTop(card);

    layoutFan();
  }

  function close() {
    if (!openCard) return;

    openCard.classList.remove("is-open");
    openCard = null;

    deck.classList.remove("has-open");
    setOverlayState(false);

    requestAnimationFrame(layoutFan);
  }

  function switchTo(index) {
    if (!openCard) return;
    if (index < 0 || index >= cards.length) return;

    // fermer la carte actuelle
    openCard.classList.remove("is-open");

    // ouvrir la nouvelle
    openCard = cards[index];

    // wrapper + flèches sur la nouvelle
    ensureScrollWrapper(openCard);
    ensureNavButtons(openCard);

    openCard.classList.add("is-open");
    setOverlayState(true);

    // scroll top sur wrapper
    scrollCardToTop(openCard);

    requestAnimationFrame(layoutFan);
  }

  function next() {
    const i = getOpenIndex();
    if (i === -1) return;
    const ni = Math.min(cards.length - 1, i + 1);
    switchTo(ni);
  }

  function prev() {
    const i = getOpenIndex();
    if (i === -1) return;
    const pi = Math.max(0, i - 1);
    switchTo(pi);
  }

  // --------- Events ----------

  // ✅ OUVERTURE: délégation sur le deck
  deck.addEventListener("click", (e) => {
    if (openCard) return;
    if (e.target.closest("a, button")) return;

    const card = e.target.closest(".project-card");
    if (!card) return;

    open(card);
  });

  // ✅ CROIX: fermeture
  deck.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".project-close");
    if (!closeBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const card = closeBtn.closest(".project-card");
    if (card && card.classList.contains("is-open")) close();
  });

  // ✅ Bouton "Visiter": ne doit pas fermer
  deck.addEventListener("click", (e) => {
    const visitBtn = e.target.closest(".project-btn");
    if (!visitBtn) return;
    e.stopPropagation();
  });

  // ✅ FERMETURE AU CLIC DEHORS (capture)
  document.addEventListener(
    "click",
    (e) => {
      if (!openCard) return;

      // clic dans la carte ouverte => ne ferme pas
      if (e.target.closest(".project-card.is-open")) return;

      close();
    },
    true
  );

  // overlay: fermer aussi
  overlay.addEventListener("click", close);

  // ✅ ESC / navigation clavier
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (!openCard) return;

    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // ✅ Resize -> recalcul éventail
  window.addEventListener("resize", () => requestAnimationFrame(layoutFan));

  // Init
  setOverlayState(false);
  layoutFan();
  setTimeout(layoutFan, 200);
}
