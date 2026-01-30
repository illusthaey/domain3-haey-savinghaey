// static/calendar_ro.js
(function(){
  function parseYmd(s){
    const [y,m,d] = s.split("-").map(Number);
    return new Date(y, m-1, d);
  }
  function pad(n){ return String(n).padStart(2,"0"); }
  function ymd(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

  function startOfWeek(date){ // 월요일 시작
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0=일
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function groupByDate(events){
    const map = new Map();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date).push(e);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a,b)=> String(a.time||"").localeCompare(String(b.time||"")));
      map.set(k, arr);
    }
    return map;
  }

  function renderDayList(container, dates, byDate){
    container.innerHTML = dates.map(d => {
      const items = byDate.get(d) || [];
      const html = items.map(e => `
        <div class="card">
          <div><b>${App.escapeHtml(e.time || "종일")}</b> ${App.escapeHtml(e.title || "")}</div>
          ${e.memo ? `<div class="muted" style="margin-top:6px;">${App.escapeHtml(e.memo)}</div>` : ""}
        </div>
      `).join("");

      return `
        <div class="section">
          <h3 class="local-h3">${d}</h3>
          ${html || `<div class="muted">등록된 일정이 없습니다.</div>`}
        </div>
      `;
    }).join("");
  }

  function renderMonthGrid(container, focusDateStr, events){
    const focus = focusDateStr ? parseYmd(focusDateStr) : new Date();
    const y = focus.getFullYear();
    const m = focus.getMonth();

    const first = new Date(y, m, 1);
    const last = new Date(y, m+1, 0);

    const gridStart = startOfWeek(first);
    const gridEnd = new Date(startOfWeek(new Date(last.getFullYear(), last.getMonth(), last.getDate()+1)));
    gridEnd.setDate(gridEnd.getDate() + 6);

    const counts = new Map();
    for (const e of events) counts.set(e.date, (counts.get(e.date) || 0) + 1);

    const days = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate()+1)) {
      const dStr = ymd(d);
      const isCur = d.getMonth() === m;
      const c = counts.get(dStr) || 0;
      days.push({ dStr, isCur, c });
    }

    container.innerHTML = `
      <div class="row between wrap" style="margin-bottom:10px;">
        <div style="font-weight:900;">${y}년 ${m+1}월</div>
        <div class="row wrap right">
          <button class="btn" id="prevM">이전달</button>
          <button class="btn" id="nextM">다음달</button>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:repeat(7, minmax(0,1fr)); gap:10px;">
        ${["월","화","수","목","금","토","일"].map(x=>`<div class="muted" style="text-align:center; font-weight:700;">${x}</div>`).join("")}
        ${days.map(x => `
          <div class="card" data-date="${x.dStr}" style="cursor:pointer; opacity:${x.isCur?1:0.55};">
            <div class="row between">
              <div style="font-weight:900;">${x.dStr.split("-")[2]}</div>
              ${x.c ? `<span class="pill">+${x.c}</span>` : `<span class="muted"></span>`}
            </div>
            <div class="muted" style="margin-top:6px;">${x.dStr}</div>
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("prevM").onclick = () => {
      const d = new Date(y, m-1, 1);
      CalendarRO.switchView("month", ymd(d));
    };
    document.getElementById("nextM").onclick = () => {
      const d = new Date(y, m+1, 1);
      CalendarRO.switchView("month", ymd(d));
    };

    container.querySelectorAll("[data-date]").forEach(el => {
      el.addEventListener("click", ()=>{
        const date = el.dataset.date;
        document.getElementById("date").value = date;
        CalendarRO.switchView("3day", date);
      });
    });
  }

  window.CalendarRO = {
    view: "month",
    anchor: null,
    events: [],
    byDate: new Map(),

    async init(){
      const store = await App.getStore();
      this.events = App.getByPath(store, "calendar.events", []);
      this.byDate = groupByDate(this.events);

      const d = document.getElementById("date");
      d.value = App.todayStr();
      d.addEventListener("change", ()=> this.switchView(this.view, d.value));

      document.getElementById("btnMonth").onclick = () => this.switchView("month");
      document.getElementById("btnWeek").onclick  = () => this.switchView("week");
      document.getElementById("btn3day").onclick  = () => this.switchView("3day");

      this.render();
    },

    switchView(view, anchorStr){
      this.view = view;
      this.anchor = anchorStr || this.anchor || App.todayStr();
      this.render();
    },

    render(){
      const wrap = document.getElementById("calWrap");
      const v = this.view;
      const anchor = this.anchor || App.todayStr();

      document.getElementById("viewName").textContent =
        v === "month" ? "월간달력(읽기전용)" : (v === "week" ? "주간달력(읽기전용)" : "어제·오늘·내일(3일, 읽기전용)");

      if (v === "month") {
        renderMonthGrid(wrap, anchor, this.events);
        return;
      }

      if (v === "week") {
        const base = parseYmd(anchor);
        const s = startOfWeek(base);
        const dates = [];
        for (let i=0;i<7;i++){
          const d = new Date(s); d.setDate(s.getDate()+i);
          dates.push(ymd(d));
        }
        renderDayList(wrap, dates, this.byDate);
        return;
      }

      const base = parseYmd(anchor);
      const y = new Date(base); y.setDate(base.getDate()-1);
      const t = new Date(base);
      const n = new Date(base); n.setDate(base.getDate()+1);
      renderDayList(wrap, [ymd(y), ymd(t), ymd(n)], this.byDate);
    }
  };
})();
