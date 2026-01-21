export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function formatMoneyKGS(amount) {
  const n = Number(amount || 0);
  return `${n.toLocaleString("ru-RU")} сом`;
}

export function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

export function getQuery() {
  const u = new URL(window.location.href);
  return Object.fromEntries(u.searchParams.entries());
}

export function setQuery(next) {
  const u = new URL(window.location.href);
  Object.entries(next).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === false) u.searchParams.delete(k);
    else u.searchParams.set(k, String(v));
  });
  window.history.replaceState({}, "", u.toString());
}

export function onEscape(handler) {
  const fn = (e) => {
    if (e.key === "Escape") handler(e);
  };
  window.addEventListener("keydown", fn);
  return () => window.removeEventListener("keydown", fn);
}
