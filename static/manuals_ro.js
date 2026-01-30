// static/manuals_ro.js
(function(){
  function hay(m){
    return [m.title, m.year, ...(m.tags||[])].join(" ").toLowerCase();
  }

  function render(wrap, list){
    if (!list.length) {
      wrap.innerHTML = `<div class="muted">편람 목록이 없습니다. (data/store.json의 manuals.list 수정)</div>`;
      return;
    }

    wrap.innerHTML = list.map(m => `
      <div class="card">
        <div class="row between wrap">
          <div style="min-width:260px;">
            <div style="font-weight:900;">${App.escapeHtml(m.title || "")}</div>
            <div class="muted">${App.escapeHtml(m.year || "")} ${App.escapeHtml((m.tags||[]).join(", "))}</div>
          </div>
          <div class="row right wrap">
            <a class="btn" href="${m.file}" target="_blank" rel="noopener">PDF 열기</a>
          </div>
        </div>
      </div>
    `).join("");
  }

  window.ManualsRO = {
    async init(){
      const store = await App.getStore();
      const all = App.getByPath(store, "manuals.list", []);
      const q = document.getElementById("manualQ");
      const wrap = document.getElementById("manualList");

      render(wrap, all);

      q.addEventListener("input", () => {
        const qq = q.value.trim().toLowerCase();
        const filtered = all.filter(m => !qq || hay(m).includes(qq));
        render(wrap, filtered);
      });
    }
  };
})();
