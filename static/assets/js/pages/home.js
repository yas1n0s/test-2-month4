import { products } from "../data/products.js";
import { qs } from "../lib/dom.js";
import { initBaseUI } from "../lib/ui.js";
import { initReveal } from "../lib/reveal.js";
import { renderProductCard } from "./shared/renderers.js";

initBaseUI();
initReveal();
initHeroParallax();
renderFeatured();

function renderFeatured() {
  const grid = qs("[data-featured-grid]");
  if (!grid) return;

  const featured = products.slice(0, 6);
  grid.innerHTML = "";
  featured.forEach((p) => grid.appendChild(renderProductCard(p)));
  initReveal(grid);
}

function initHeroParallax() {
  const bg = qs(".hero__bg");
  if (!bg) return;

  const onScroll = () => {
    const y = window.scrollY;
    bg.style.transform = `translateY(${Math.min(28, y * 0.06)}px)`;
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
