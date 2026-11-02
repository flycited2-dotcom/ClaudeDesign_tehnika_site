import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("output/category-art/manifest.json", "utf8"));
const generated = JSON.parse(await readFile("src/lib/generated-category-art.json", "utf8"));
const escape = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rows = manifest.categories.filter(c => generated[c.slug]);
const groups = [...new Set(rows.map(c => c.path[0]))];
const sections = groups.map(group => `<section><h2>${escape(group)}</h2><div class="grid">` +
  rows.filter(c => c.path[0] === group).map(c => `<article data-search="${escape(c.path.join(" ").toLowerCase())}">` +
    `<div class="art"><img src="../../public${escape(generated[c.slug] ?? c.art)}" alt="" loading="lazy"></div>` +
    `<h3>${escape(c.name)}</h3><p>${escape(c.path.slice(0,-1).join(" → "))}</p></article>`).join("") +
  `</div></section>`).join("");
const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title>Иллюстрации каталога — БытТехОпт</title><style>` +
  `*{box-sizing:border-box}body{margin:0;background:linear-gradient(130deg,#dbe7ff,#f4f6ff 60%,#ffe2d3);color:#10204a;font:16px/1.5 system-ui,sans-serif}` +
  `main{max-width:1320px;margin:auto;padding:32px 24px}header{padding:24px;border:1px solid white;border-radius:24px;background:#ffffff90;margin-bottom:28px}` +
  `h1{margin:0 0 8px;font-size:32px}header p{margin:0 0 16px;color:#5c6a8c}input{width:100%;padding:12px 16px;font:inherit;border:1px solid #cedbff;border-radius:12px}` +
  `h2{margin:28px 0 16px;font-size:22px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}` +
  `article{padding:16px;border-radius:20px;background:#ffffffb0;border:1px solid white}.art{height:175px;display:grid;place-items:center}` +
  `img{width:100%;height:100%;object-fit:contain}h3{font-size:15px;line-height:1.35;margin:14px 0 6px}article p{font-size:12px;color:#5c6a8c;margin:0}` +
  `[hidden]{display:none!important}@media(max-width:600px){main{padding:16px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.art{height:120px}h1{font-size:24px}}` +
  `</style><main><header><h1>Иллюстрации каталога</h1><p>Иллюстрации для ${rows.length} из ${manifest.storefrontCategories} категорий. Единый стиль, прозрачный фон, без водяных знаков.</p>` +
  `<input type="search" aria-label="Поиск категории" placeholder="Найти категорию…"></header>${sections}</main>` +
  `<script>document.querySelector('input').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('article').forEach(el=>el.hidden=!el.dataset.search.includes(q));document.querySelectorAll('section').forEach(el=>el.hidden=![...el.querySelectorAll('article')].some(a=>!a.hidden));});</script></html>`;
await writeFile("output/category-art/gallery.html", html);
console.log(`${rows.length} illustrations in gallery`);
