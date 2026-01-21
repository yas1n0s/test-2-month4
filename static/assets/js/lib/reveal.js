import { qsa } from "./dom.js";

let io = null;

export function initReveal(root = document) {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (!ent.isIntersecting) return;
          const el = ent.target;
          const delay = Number(el.getAttribute("data-reveal-delay") || 0);
          window.setTimeout(() => el.classList.add("is-in"), delay);
          io.unobserve(el);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );
  }

  const els = qsa("[data-reveal]", root).filter((el) => !el.dataset.revealObserved);
  els.forEach((el) => {
    el.dataset.revealObserved = "1";
    io.observe(el);
  });
}
