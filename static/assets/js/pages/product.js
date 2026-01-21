import { products } from "../data/products.js";
import { formatMoneyKGS, getQuery, qs } from "../lib/dom.js";
import { addToCart } from "../lib/cart.js";
import { initBaseUI } from "../lib/ui.js";
import { initReveal } from "../lib/reveal.js";
import { toast } from "../lib/toast.js";
import { renderProductCard } from "./shared/renderers.js";

initBaseUI();
initReveal();

const q = getQuery();
const slug = q.slug || products[0]?.slug;
const product = products.find((p) => p.slug === slug) || products[0];

if (!product) {
  toast({ title: "Товар не найден", message: "Вернись в каталог" });
} else {
  hydrate(product);
}

function hydrate(p) {
  document.title = `${p.title} — AURUM`;

  const bc = qs("[data-bc-title]");
  if (bc) bc.textContent = p.title;

  const title = qs("[data-title]");
  if (title) title.textContent = p.title;

  const badges = qs("[data-badges]");
  if (badges) {
    badges.innerHTML = `${p.is_new ? `<span class="badge badge--new">New</span>` : ""}${
      p.is_sale ? `<span class="badge badge--sale">Sale</span>` : ""
    }`;
  }

  const price = qs("[data-price]");
  if (price) {
    price.innerHTML = `${formatMoneyKGS(p.price)}${
      p.old_price ? ` <span class="muted" style="text-decoration:line-through;font-size:13px">${formatMoneyKGS(
          p.old_price
        )}</span>` : ""
    }`;
  }

  const short = qs("[data-short]");
  if (short) short.textContent = p.description?.short || "";

  initVariants(p);
  initGallery(p);
  initAccordion();
  renderSimilar(p);
}

function initVariants(p) {
  const sizes = qs("[data-sizes]");
  const colors = qs("[data-colors]");
  const sizeErr = qs("[data-size-error]");
  const addBtn = qs("[data-add]");
  const buyBtn = qs("[data-buy]");

  let selectedSize = "";
  let selectedColor = p.colors?.[0]?.name || "";

  if (sizes) {
    sizes.innerHTML = "";
    p.sizes.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "seg__btn";
      b.textContent = s;
      b.addEventListener("click", () => {
        selectedSize = s;
        sizeErr.hidden = true;
        sizes.querySelectorAll(".seg__btn").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
      });
      sizes.appendChild(b);
    });
  }

  if (colors) {
    colors.innerHTML = "";
    p.colors.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.style.background = c.hex;
      b.title = c.name;
      b.setAttribute("aria-label", c.name);
      if (c.name === selectedColor) b.classList.add("is-active");
      b.addEventListener("click", () => {
        selectedColor = c.name;
        colors.querySelectorAll(".swatch").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
      });
      colors.appendChild(b);
    });
  }

  const add = () => {
    if (!selectedSize) {
      if (sizeErr) sizeErr.hidden = false;
      sizes?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    addToCart({
      product_id: p.id,
      title: p.title,
      price: p.price,
      image: p.images[0],
      size: selectedSize,
      color: selectedColor,
      qty: 1,
    });

    toast({ title: "Добавлено", message: `${p.title} • ${selectedSize} • ${selectedColor}` });
    return true;
  };

  addBtn?.addEventListener("click", () => add());
  buyBtn?.addEventListener("click", () => {
    if (add()) window.location.href = "./cart.html";
  });
}

function initGallery(p) {
  const thumbs = qs("[data-thumbs]");
  const mainInner = qs("[data-main-inner]");
  const prev = qs("[data-prev]");
  const next = qs("[data-next]");

  if (!thumbs || !mainInner) return;

  let idx = 0;

  thumbs.innerHTML = "";
  mainInner.innerHTML = "";

  const mainImg = document.createElement("img");
  mainImg.src = p.images[0];
  mainImg.alt = p.title;
  mainImg.loading = "eager";
  mainInner.appendChild(mainImg);

  p.images.forEach((src, i) => {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "thumb" + (i === 0 ? " is-active" : "");
    t.innerHTML = `<img src="${src}" loading="lazy" decoding="async" alt="" />`;
    t.addEventListener("click", () => set(i));
    thumbs.appendChild(t);
  });

  const set = (nextIdx) => {
    idx = (nextIdx + p.images.length) % p.images.length;
    thumbs.querySelectorAll(".thumb").forEach((x, i) => x.classList.toggle("is-active", i === idx));

    const img = document.createElement("img");
    img.src = p.images[idx];
    img.alt = p.title;
    img.style.opacity = "0";
    img.style.transform = "scale(1.01)";

    mainInner.appendChild(img);
    requestAnimationFrame(() => {
      img.style.opacity = "1";
    });

    const prevImg = mainInner.querySelector("img");
    if (prevImg && prevImg !== img) {
      prevImg.style.opacity = "0";
      window.setTimeout(() => prevImg.remove(), 260);
    }
  };

  prev?.addEventListener("click", () => set(idx - 1));
  next?.addEventListener("click", () => set(idx + 1));

  initSwipe(mainInner, () => set(idx + 1), () => set(idx - 1));
}

function initSwipe(el, onLeft, onRight) {
  let startX = 0;
  let startY = 0;
  let active = false;

  el.addEventListener(
    "pointerdown",
    (e) => {
      active = true;
      startX = e.clientX;
      startY = e.clientY;
    },
    { passive: true }
  );

  el.addEventListener(
    "pointerup",
    (e) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onLeft();
      else onRight();
    },
    { passive: true }
  );
}

function initAccordion() {
  const btn = qs("[data-acc-btn]");
  const panel = qs("[data-acc-panel]");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
    panel.hidden = open;
  });
}

function renderSimilar(p) {
  const grid = qs("[data-similar-grid]");
  if (!grid) return;

  const similar = products
    .filter((x) => x.id !== p.id && (x.category === p.category || x.is_new === p.is_new || x.is_sale === p.is_sale))
    .slice(0, 4);

  grid.innerHTML = "";
  similar.forEach((x) => grid.appendChild(renderProductCard(x)));
  initReveal(grid);
}
