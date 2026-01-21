import { addToCart } from "../../lib/cart.js";
import { formatMoneyKGS } from "../../lib/dom.js";
import { toast } from "../../lib/toast.js";

export function renderProductCard(p) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.setAttribute("data-reveal", "");

  const href = `./product.html?slug=${encodeURIComponent(p.slug)}`;

  const badges = `${p.is_new ? `<span class="badge badge--new">New</span>` : ""}${
    p.is_sale ? `<span class="badge badge--sale">Sale</span>` : ""
  }`;

  const old = p.old_price ? `<span class="product-card__old">${formatMoneyKGS(p.old_price)}</span>` : "";

  card.innerHTML = `
    <a class="product-card__link" href="${href}" data-link>
      <div class="product-card__media">
        <img class="product-card__img" src="${p.images[0]}" loading="lazy" decoding="async" alt="${escapeHtml(
    p.title
  )}" />
        ${
          p.images[1]
            ? `<img class="product-card__img is-alt" src="${p.images[1]}" loading="lazy" decoding="async" alt="" />`
            : ""
        }
      </div>
      <div class="product-card__body">
        <div class="badges">${badges}</div>
        <h3 class="product-card__title">${escapeHtml(p.title)}</h3>
        <div class="product-card__price">
          <span>${formatMoneyKGS(p.price)}</span>
          ${old}
        </div>
      </div>
    </a>
    <button class="icon-btn product-card__add" type="button" aria-label="Add to cart">
      <span class="icon icon--plus" aria-hidden="true"></span>
    </button>
  `;

  const addBtn = card.querySelector(".product-card__add");
  addBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const size = p.sizes?.[0] || "";
    const color = p.colors?.[0]?.name || "";

    addToCart({
      product_id: p.id,
      title: p.title,
      price: p.price,
      image: p.images[0],
      size,
      color,
      qty: 1,
    });

    toast({ title: "Добавлено в корзину", message: p.title });
  });

  return card;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
