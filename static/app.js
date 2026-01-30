// static/app.js
(function () {
  const NAV = [
    { href: "/index.html", label: "대시보드" },
    { href: "/tools.html", label: "업무 효율화 도구 모음" },
    { href: "/calendar.html", label: "일정 달력" },
    { href: "/favorites.html", label: "즐겨찾기" },
    { href: "/manuals.html", label: "편람(PDF)" }
  ];

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function pad(n){ return String(n).padStart(2, "0"); }

  function todayStr(){
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  // store.json (GitHub에서 수정)
  const STORE_URL = "/data/store.json";

  async function fetchStore(){
    const bust = Date.now(); // 캐시 우회
    const res = await fetch(`${STORE_URL}?v=${bust}`, { cache: "no-store" });
    if (!res.ok) throw new Error("store.json 로드 실패");
    return await res.json();
  }

  const getStore = (function(){
    let memo = null;
    return async function(){
      if (memo) return memo;
      memo = await fetchStore();
      return memo;
    };
  })();

  function getByPath(obj, path, fallback){
    try {
      return path.split(".").reduce((acc, k) => acc[k], obj) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function navHTML(activePath){
    const items = NAV.map(n => {
      const active = activePath === n.href;
      const cls = active ? "nav-btn is-active" : "nav-btn";
      const aria = active ? ' aria-current="page"' : "";
      return `<a class="${cls}" href="${n.href}"${aria}>${escapeHtml(n.label)}</a>`;
    }).join("");

    return `
      <header class="site-header">
        <div class="shell">
          <div class="topbar">
            <div class="brand">
              <div class="brand-title">개인용 업무 보조</div>
              <div class="brand-sub">운영: GitHub에서 JSON/소스 직접 수정(읽기 전용)</div>
            </div>
            <nav class="nav" aria-label="상단 메뉴">
              ${items}
            </nav>
          </div>
        </div>
      </header>
    `;
  }

  function mountNav(){
    const here = location.pathname.endsWith("/") ? "/index.html" : location.pathname;
    const el = document.getElementById("app-nav");
    if (el) el.innerHTML = navHTML(here);
  }

  window.App = {
    escapeHtml,
    pad,
    todayStr,
    STORE_URL,
    fetchStore,
    getStore,
    getByPath,
    mountNav
  };
})();
