(function () {
  "use strict";

  const META_URL = "/static/tools-meta.json?v=1"; // JSON 수정 후 v 값을 올리면 캐시 이슈 최소화

  document.addEventListener("DOMContentLoaded", () => {
    renderToolsPage().catch((err) => {
      console.error("[tools] render failed:", err);
      const msg = document.getElementById("tools-status");
      if (msg) msg.textContent = "도구 목록을 불러오지 못했습니다. (JSON 로드 실패)";
    });
  });

  async function renderToolsPage() {
    const root = mustGetEl("tools-root");
    const status = document.getElementById("tools-status");

    if (status) status.textContent = "도구 목록 불러오는 중…";

    const res = await fetch(META_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`META fetch failed: ${res.status}`);

    /** @type {{bases?: Record<string,string>, categories?: any[], tools?: any[]}} */
    const data = await res.json();

    const bases = data.bases || {};
    const categories = (data.categories || [])
      .slice()
      .sort((a, b) => (num(a.order, 9999) - num(b.order, 9999)));

    const tools = (data.tools || []).slice();

    // category -> tools[]
    const map = new Map();
    for (const t of tools) {
      const cat = (t.category || "uncategorized").trim();
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(t);
    }

    // sort tools within each category
    for (const [catId, list] of map.entries()) {
      list.sort((a, b) => {
        const byOrder = num(a.order, 9999) - num(b.order, 9999);
        if (byOrder !== 0) return byOrder;
        const at = (a.title || a.id || "").toString();
        const bt = (b.title || b.id || "").toString();
        return at.localeCompare(bt, "ko");
      });
    }

    // render
    root.innerHTML = "";

    let renderedCount = 0;

    for (const c of categories) {
      const list = map.get(c.id) || [];
      if (list.length === 0) continue;
      root.appendChild(renderCategorySection(c.title, list, bases));
      renderedCount += list.length;
    }

    // render uncategorized if any
    const leftover = map.get("uncategorized");
    if (leftover && leftover.length > 0) {
      root.appendChild(renderCategorySection("기타", leftover, bases));
      renderedCount += leftover.length;
    }

    if (status) status.textContent = renderedCount ? "" : "등록된 도구가 없습니다.";
  }

  function renderCategorySection(title, tools, bases) {
    const section = document.createElement("section");
    section.className = "section";

    const h2 = document.createElement("h2");
    h2.className = "local-h2";
    h2.textContent = title || "도구";
    section.appendChild(h2);

    for (const t of tools) {
      section.appendChild(renderToolCard(t, bases));
    }

    return section;
  }

  function renderToolCard(t, bases) {
    const a = document.createElement("a");
    a.className = "card";

    const href = buildHref(t, bases);
    a.href = href;

    // target 정책:
    // - 기본: 동일 origin이면 같은 탭
    // - cross-origin이면 새 탭 + noopener
    // - t.target이 명시되면 그 값 우선
    if (t && t.target) {
      a.target = t.target;
      if (t.target === "_blank") a.rel = "noopener";
    } else {
      const u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    }

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.textContent = (t && (t.title || t.id)) ? String(t.title || t.id) : "(제목 미지정)";
    a.appendChild(title);

    if (t && t.desc) {
      const desc = document.createElement("div");
      desc.className = "muted";
      desc.style.marginTop = "6px";
      desc.textContent = String(t.desc);
      a.appendChild(desc);
    }

    return a;
  }

  function buildHref(t, bases) {
    if (!t) return "#";

    // 1) url이 있으면 최우선
    if (t.url) return String(t.url);

    // 2) base + path 조합
    const baseKey = t.base || "deploy";
    const base = (bases && bases[baseKey]) ? String(bases[baseKey]) : "";
    const path = t.path ? String(t.path) : "/";

    if (!base) return path;

    const baseTrim = base.replace(/\/+$/, "");
    const pathTrim = path.replace(/^\/+/, "");
    return `${baseTrim}/${pathTrim}`;
  }

  function mustGetEl(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
  }

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
})();
