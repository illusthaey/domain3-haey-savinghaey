// static/app.js
// 역할:
// - 메인(index.html): 타이틀/제작문구/헤드라인만 표시(메뉴바 없음)
// - 상세페이지(그 외): 타이틀/제작문구/헤드라인 + 메뉴바 + "메인페이지로" 버튼 표시
// - data/store.json 읽기(캐시 우회) 유틸 제공

(function () {
  const NAV = [
    { href: "/tools.html", label: "업무 효율화 도구 모음" },
    { href: "/assist-tools.html", label: "업무보조 도구 모음" },
    { href: "/calendar.html", label: "일정 달력" },
    { href: "/favorites.html", label: "즐겨찾기" },
    { href: "/manuals.html", label: "편람(PDF)" }
  ];

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // store.json (GitHub에서 수정)
  const STORE_URL = "/data/store.json";

  async function fetchStore() {
    const bust = Date.now(); // 캐시 우회
    const res = await fetch(`${STORE_URL}?v=${bust}`, { cache: "no-store" });
    if (!res.ok) throw new Error("store.json 로드 실패");
    return await res.json();
  }

  // 페이지당 1회만 로드(동일 페이지 내 중복 fetch 방지)
  const getStore = (function () {
    let memo = null;
    return async function () {
      if (memo) return memo;
      memo = await fetchStore();
      return memo;
    };
  })();

  // "calendar.events" 같은 경로 접근
  function getByPath(obj, path, fallback) {
    try {
      return path.split(".").reduce((acc, k) => acc[k], obj) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function isIndexPage() {
    const p = location.pathname.endsWith("/") ? "/index.html" : location.pathname;
    return p === "/index.html";
  }

  function headerOnlyHTML() {
    return `
      <header class="site-header">
        <div class="shell">
          <div class="header-hero">
            <h1 class="header-title">(타이틀) 개인 업무 보조 웹페이지</h1>
            <div class="header-byline">-제작·운영: 천재 고주무관</div>
          </div>
        </div>
      </header>
    `;
  }

  function headerWithNavHTML(activePath) {
    const items = NAV.map(n => {
      const active = activePath === n.href;
      const cls = active ? "nav-btn is-active" : "nav-btn";
      const aria = active ? ' aria-current="page"' : "";
      return `<a class="${cls}" href="${n.href}"${aria}>${escapeHtml(n.label)}</a>`;
    }).join("");

    return `
      <header class="site-header">
        <div class="shell">

          <div class="header-hero">
            <h1 class="header-title">(타이틀) 개인 업무 보조 웹페이지</h1>
            <div class="header-byline">-제작·운영: 천재 고주무관</div>
            <div class="header-rule" aria-hidden="true"></div>

            <!-- 상세페이지 전용: 메인으로 -->
            <div class="header-actions">
              <a class="header-home" href="/index.html">메인페이지로</a>
            </div>
          </div>

          <nav class="nav" aria-label="상단 메뉴">
            ${items}
          </nav>

        </div>
      </header>
    `;
  }

  function mountHeader() {
    const here = location.pathname.endsWith("/") ? "/index.html" : location.pathname;
    const el = document.getElementById("app-nav");
    if (!el) return;

    if (isIndexPage()) {
      el.innerHTML = headerOnlyHTML();
    } else {
      el.innerHTML = headerWithNavHTML(here);
    }
  }

  window.App = {
    // util
    escapeHtml,
    pad,
    todayStr,

    // store
    STORE_URL,
    fetchStore,
    getStore,
    getByPath,

    // header
    mountHeader
  };
})();

