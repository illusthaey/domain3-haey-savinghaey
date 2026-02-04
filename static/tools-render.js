(function () {
  "use strict";

  // tools-meta.json 갱신 시 숫자만 올리면 캐시 이슈를 줄일 수 있습니다.
  const META_VERSION = 1;

  // "페이지 위치"가 아니라 "스크립트 위치" 기준으로 tools-meta.json을 찾습니다.
  const scriptSrc = (document.currentScript && document.currentScript.src) ? document.currentScript.src : "";
  const META_URL = scriptSrc
    ? new URL(`./tools-meta.json?v=${META_VERSION}`, scriptSrc).toString()
    : `/static/tools-meta.json?v=${META_VERSION}`;

  document.addEventListener("DOMContentLoaded", () => {
    renderToolsPage().catch((err) => {
      console.error("[tools] render failed:", err);
      const status = document.getElementById("tools-status");
      if (status) status.textContent = "도구 목록을 불러오지 못했습니다. (tools-meta.json 로드/파싱 실패)";
    });
  });

  async function renderToolsPage() {
    const root = mustGetEl("tools-root");
    const status = document.getElementById("tools-status");

    if (status) status.textContent = "도구 목록 불러오는 중…";

    const res = await fetch(META_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`META fetch failed: ${res.status}`);

    const data = await res.json();

    const bases = data.bases || {};
    const categories = (data.categories || [])
      .slice()
      .sort((a, b) => num(a.order, 9999) - num(b.order, 9999));

    const tools = (data.tools || []).slice();

    // categoryId -> tool[]
    const map = new Map();
    for (const t of tools) {
      const cat = (t.category || "uncategorized").toString().trim() || "uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(t);
    }

    // tool 정렬
    for (const [catId, list] of map.entries()) {
      list.sort((a, b) => {
        const ao = num(a.order, 9999);
        const bo = num(b.order, 9999);
        if (ao !== bo) return ao - bo;
        return String(a.title || a.id || "").localeCompare(String(b.title || b.id || ""), "ko");
      });
    }

    root.innerHTML = "";
    let rendered = 0;

    // categories에 정의된 순서대로 렌더
    for (const c of categories) {
      const cid = String(c.id || "");
      const list = map.get(cid) || [];
      if (!list.length) continue;

      root.appendChild(renderCategorySection(String(c.title || cid || "도구"), list, bases));
      rendered += list.length;
    }

    // categories에 정의되지 않은 category가 있으면 뒤에 추가
    const defined = new Set(categories.map((c) => String(c.id || "")));
    const extraIds = [...map.keys()]
      .filter((id) => !defined.has(String(id)) && String(id) !== "uncategorized")
      .sort((a, b) => String(a).localeCompare(String(b), "ko"));

    for (const id of extraIds) {
      const list = map.get(id) || [];
      if (!list.length) continue;

      root.appendChild(renderCategorySection(String(id), list, bases));
      rendered += list.length;
    }

    // uncategorized 마지막 처리
    const uncategorized = map.get("uncategorized") || [];
    if (uncategorized.length) {
      root.appendChild(renderCategorySection("기타", uncategorized, bases));
      rendered += uncategorized.length;
    }

    if (status) status.textContent = rendered ? "" : "등록된 도구가 없습니다.";
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
    a.href = buildHref(t, bases);

    // target 정책:
    // - tool에서 target 명시 시 우선 적용
    // - 미명시 시 cross-origin이면 새 탭 처리
    const desiredTarget = (t && t.target) ? String(t.target) : "";
    if (desiredTarget) {
      a.target = desiredTarget;
      if (desiredTarget === "_blank") a.rel = "noopener";
    } else {
      try {
        const u = new URL(a.href, window.location.href);
        if (u.origin !== window.location.origin) {
          a.target = "_blank";
          a.rel = "noopener";
        }
      } catch (_) {
        // href 파싱 실패 시 무시
      }
    }

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.textContent = String(t.title || t.id || "(제목 미지정)");
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
    const baseKey = (t.base || "deploy").toString();
    const base = (bases && bases[baseKey]) ? String(bases[baseKey]) : "";
    const path = t.path ? String(t.path) : "/";

    if (!base) return path;

    const b = base.replace(/\/+$/, "");
    const p = path.replace(/^\/+/, "");
    return `${b}/${p}`;
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
