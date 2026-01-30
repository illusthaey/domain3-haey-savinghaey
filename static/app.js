
// static/app.js
(function () {
  const NAV = [
    { href: "/index.html", label: "대시보드" },
    { href: "/tools.html", label: "업무 효율화 도구 모음" },
    { href: "/calendar.html", label: "일정 달력" },
    { href: "/favorites.html", label: "즐겨찾기" },
    { href: "/manuals.html", label: "편람(PDF)" },
  ];

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  window.App = {
    escapeHtml,

    navHTML(activePath) {
      const items = NAV.map(n => {
        const active = (activePath === n.href);
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
                <div class="brand-sub muted">정적 페이지 · 로컬 저장(LocalStorage) 기반</div>
              </div>
              <nav class="nav" aria-label="상단 메뉴">
                ${items}
              </nav>
            </div>
          </div>
        </header>
      `;
    },

    mountNav() {
      const here = location.pathname.endsWith("/") ? "/index.html" : location.pathname;
      const nav = document.getElementById("app-nav");
      if (nav) nav.innerHTML = App.navHTML(here);
    },

    load(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch {
        return fallback;
      }
    },

    save(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },

    pad(n){ return String(n).padStart(2, "0"); },

    todayStr() {
      const d = new Date();
      return `${d.getFullYear()}-${App.pad(d.getMonth()+1)}-${App.pad(d.getDate())}`;
    },

    addDays(ymd, delta){
      const [y,m,d] = ymd.split("-").map(Number);
      const dt = new Date(y, m-1, d);
      dt.setDate(dt.getDate() + delta);
      return `${dt.getFullYear()}-${App.pad(dt.getMonth()+1)}-${App.pad(dt.getDate())}`;
    }
  };
})();
