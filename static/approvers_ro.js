// static/approvers_ro.js
(function(){
  window.ApproversRO = {
    async init(){
      const store = await App.getStore();
      const list = App.getByPath(store, "approvers.status", []);
      const wrap = document.getElementById("approverList");

      if (!list.length) {
        wrap.innerHTML = `<div class="muted">등록된 결재권자 정보가 없습니다. (data/store.json의 approvers.status 수정)</div>`;
        return;
      }

      wrap.innerHTML = list.map(x => `
        <div class="card">
          <div style="min-width:260px;">
            <div style="font-weight:900;">
              ${App.escapeHtml(x.name || "")}
              <span class="muted" style="font-weight:600;">(${App.escapeHtml(x.role || "")})</span>
            </div>
            <div class="muted" style="margin-top:6px;">
              상태: <span class="pill">${App.escapeHtml(x.status || "")}</span>
              ${x.until ? ` · 복귀예정: <b>${App.escapeHtml(x.until)}</b>` : ""}
            </div>
            ${x.note ? `<div class="muted" style="margin-top:6px;">비고: ${App.escapeHtml(x.note)}</div>` : ""}
          </div>
        </div>
      `).join("");
    }
  };
})();
