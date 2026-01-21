import { qs, qsa, onEscape } from "./dom.js";
import { getCartCount } from "./cart.js";

export function initBaseUI() {
  document.documentElement.classList.add("js");
  initYear();
  initPageTransitions();
  initHeaderCompact();
  initMenuOverlay();
  initCartCount();

  window.addEventListener("cart:change", () => {
    initCartCount();
    bumpCartIcon();
  });
}

function initYear() {
  const y = new Date().getFullYear();
  qsa("[data-year]").forEach((n) => (n.textContent = String(y)));
}

function initCartCount() {
  const n = getCartCount();
  qsa("[data-cart-count]").forEach((el) => {
    el.textContent = String(n);
    el.style.display = n > 0 ? "inline-flex" : "none";
  });
}

export function bumpCartIcon() {
  const btn = qs('[aria-label="Cart"]');
  if (!btn) return;
  btn.animate(
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-1px) scale(1.06)" },
      { transform: "translateY(0) scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}

function initHeaderCompact() {
  const header = qs("[data-header]");
  if (!header) return;

  const onScroll = () => {
    const compact = window.scrollY > 18;
    header.classList.toggle("is-compact", compact);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMenuOverlay() {
  const overlay = qs("[data-menu-overlay]");
  const openBtn = qs("[data-menu-open]");
  const closeBtn = qs("[data-menu-close]");
  if (!overlay || !openBtn || !closeBtn) return;

  let cleanupEsc = null;

  const open = () => {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    cleanupEsc = onEscape(() => close());
  };

  const close = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (cleanupEsc) cleanupEsc();
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelectorAll("a[data-link]").forEach((a) => a.addEventListener("click", close));
}

function initPageTransitions() {
  const page = qs("[data-page]");
  if (!page) return;

  requestAnimationFrame(() => page.classList.add("is-enter"));

  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a[data-link]");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href) return;

    if (href.startsWith("#")) return;

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;

    e.preventDefault();
    page.classList.add("is-exit");
    window.setTimeout(() => {
      window.location.href = url.toString();
    }, 220);
  });
}
