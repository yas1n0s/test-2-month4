import { products } from "../data/products.js";
import { debounce, formatMoneyKGS, getQuery, qs, qsa, setQuery } from "../lib/dom.js";
import { initBaseUI } from "../lib/ui.js";
import { initReveal } from "../lib/reveal.js";
import { renderProductCard } from "./shared/renderers.js";

initBaseUI();
initReveal();

const state = {
  category: "",
  tagNew: false,
  tagSale: false,
  priceMin: null,
  priceMax: null,
  sort: "newest",
  limit: 8,
};

const applyDebounced = debounce(apply, 300);

initFromQuery();
initControls();
apply();

function initFromQuery() {
  const q = getQuery();
  if (q.category) state.category = q.category;
  if (q.tag === "new") state.tagNew = true;
  if (q.tag === "sale") state.tagSale = true;
}

function initControls() {
  const sort = qs("[data-sort]");
  if (sort) {
    sort.value = state.sort;
    sort.addEventListener("change", () => {
      state.sort = sort.value;
      apply();
    });
  }

  qsa("[data-filter-category]").forEach((r) => {
    r.checked = r.value === state.category;
    r.addEventListener("change", () => {
      state.category = r.value;
      state.limit = 8;
      setQuery({ category: state.category || null, tag: tagParam() });
      apply();
    });
  });

  qsa("[data-filter-tag]").forEach((c) => {
    c.checked = (c.value === "new" && state.tagNew) || (c.value === "sale" && state.tagSale);
    c.addEventListener("change", () => {
      state.tagNew = qsa('[data-filter-tag][value="new"]')[0]?.checked || false;
      state.tagSale = qsa('[data-filter-tag][value="sale"]')[0]?.checked || false;
      state.limit = 8;
      setQuery({ category: state.category || null, tag: tagParam() });
      apply();
    });
  });

  const min = qs("[data-price-min]");
  const max = qs("[data-price-max]");

  if (min) {
    min.value = state.priceMin ?? "";
    min.addEventListener("input", () => {
      state.priceMin = min.value ? Number(min.value) : null;
      state.limit = 8;
      applyDebounced();
    });
  }

  if (max) {
    max.value = state.priceMax ?? "";
    max.addEventListener("input", () => {
      state.priceMax = max.value ? Number(max.value) : null;
      state.limit = 8;
      applyDebounced();
    });
  }

  const reset = qs("[data-reset]");
  reset?.addEventListener("click", () => {
    state.category = "";
    state.tagNew = false;
    state.tagSale = false;
    state.priceMin = null;
    state.priceMax = null;
    state.limit = 8;

    qsa("[data-filter-category]").forEach((r) => (r.checked = r.value === ""));
    qsa("[data-filter-tag]").forEach((c) => (c.checked = false));
    if (min) min.value = "";
    if (max) max.value = "";

    setQuery({ category: null, tag: null });
    apply();
  });

  const more = qs("[data-load-more]");
  more?.addEventListener("click", () => {
    state.limit += 8;
    apply();
  });

  initMobileFiltersSheet();
}

function initMobileFiltersSheet() {
  const sheet = qs("[data-filters-sheet]");
  const openBtn = qs("[data-open-filters]");
  const closeBtns = qsa("[data-close-filters]");
  const desktopFilters = qs("[data-filters]");
  const slot = qs("[data-filters-sheet-content]");

  if (!sheet || !openBtn || !desktopFilters || !slot) return;

  const open = () => {
    slot.innerHTML = "";
    slot.appendChild(desktopFilters.cloneNode(true));
    wireClonedFilters(slot);

    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openBtn.addEventListener("click", open);
  closeBtns.forEach((b) => b.addEventListener("click", close));
}

function wireClonedFilters(root) {
  root.querySelectorAll("[data-filter-category]").forEach((r) => {
    r.addEventListener("change", () => {
      state.category = r.value;
      state.limit = 8;
      setQuery({ category: state.category || null, tag: tagParam() });
      syncDesktop();
      apply();
    });
  });

  root.querySelectorAll("[data-filter-tag]").forEach((c) => {
    c.addEventListener("change", () => {
      state.tagNew = root.querySelector('[data-filter-tag][value="new"]')?.checked || false;
      state.tagSale = root.querySelector('[data-filter-tag][value="sale"]')?.checked || false;
      state.limit = 8;
      setQuery({ category: state.category || null, tag: tagParam() });
      syncDesktop();
      apply();
    });
  });

  const min = root.querySelector("[data-price-min]");
  const max = root.querySelector("[data-price-max]");
  if (min) {
    min.addEventListener("input", () => {
      state.priceMin = min.value ? Number(min.value) : null;
      state.limit = 8;
      syncDesktop();
      applyDebounced();
    });
  }
  if (max) {
    max.addEventListener("input", () => {
      state.priceMax = max.value ? Number(max.value) : null;
      state.limit = 8;
      syncDesktop();
      applyDebounced();
    });
  }

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    state.category = "";
    state.tagNew = false;
    state.tagSale = false;
    state.priceMin = null;
    state.priceMax = null;
    state.limit = 8;

    setQuery({ category: null, tag: null });
    syncDesktop();
    apply();
  });
}

function syncDesktop() {
  qsa("[data-filter-category]").forEach((r) => (r.checked = r.value === state.category));
  qsa("[data-filter-tag]").forEach((c) => {
    c.checked = (c.value === "new" && state.tagNew) || (c.value === "sale" && state.tagSale);
  });
  const min = qs("[data-price-min]");
  const max = qs("[data-price-max]");
  if (min) min.value = state.priceMin ?? "";
  if (max) max.value = state.priceMax ?? "";
}

function tagParam() {
  if (state.tagNew && !state.tagSale) return "new";
  if (state.tagSale && !state.tagNew) return "sale";
  return null;
}

function apply() {
  const grid = qs("[data-products-grid]");
  const empty = qs("[data-empty]");
  const count = qs("[data-results-count]");
  const moreWrap = qs("[data-more]");
  if (!grid || !empty || !count || !moreWrap) return;

  let list = [...products];

  if (state.category) list = list.filter((p) => p.category === state.category);
  if (state.tagNew) list = list.filter((p) => p.is_new);
  if (state.tagSale) list = list.filter((p) => p.is_sale);

  if (state.priceMin !== null) list = list.filter((p) => p.price >= state.priceMin);
  if (state.priceMax !== null) list = list.filter((p) => p.price <= state.priceMax);

  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (state.sort === "newest") list.sort((a, b) => Number(b.is_new) - Number(a.is_new));

  count.textContent = String(list.length);

  const shown = list.slice(0, state.limit);

  grid.innerHTML = "";
  shown.forEach((p) => grid.appendChild(renderProductCard(p)));
  initReveal(grid);

  empty.hidden = list.length !== 0;
  moreWrap.style.display = list.length > shown.length ? "flex" : "none";

  const maxP = Math.max(...products.map((p) => p.price));
  const minP = Math.min(...products.map((p) => p.price));
  const min = qs("[data-price-min]");
  const max = qs("[data-price-max]");
  if (min && !min.placeholder) min.placeholder = formatMoneyKGS(minP).replace(" сом", "");
  if (max && !max.placeholder) max.placeholder = formatMoneyKGS(maxP).replace(" сом", "");

}
