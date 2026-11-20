(function () {
  'use strict';
  const KEY = 'ot.calc.v1';
  const EN0 = (() => { try { return JSON.parse(localStorage.getItem('ot.calc.v1')).settings.lang === 'en'; } catch (e) { return false; } })();
  const MONTHS_SI = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];
  const MONTHS = EN0 ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] : MONTHS_SI;
  const DAYS_SI = ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'];
  const DAYS = EN0 ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : DAYS_SI;
  const DAYS_S = EN0 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['ඉරි', 'සඳු', 'අඟ', 'බදා', 'බ්‍රහ', 'සිකු', 'සෙන'];
  const TYPE_NAME = { weekday: 'සතියේ දිනය', sat: 'සෙනසුරාදා', sun: 'ඉරිදා', holiday: 'රජයේ නිවාඩු දිනය' };
  const pad = OT.pad;

  /* ---------- storage ---------- */
  let DB = load();
  function load() {
    try {
      const j = JSON.parse(localStorage.getItem(KEY));
      if (j) return { settings: OT.mergeSettings(j.settings), entries: j.entries || {}, claims: j.claims || {}, wordsOv: j.wordsOv || {} };
    } catch (e) { /* ignore */ }
    return { settings: OT.mergeSettings(null), entries: {}, claims: {} };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('දත්ත සුරැකීමට නොහැකි විය'); }
  }

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const APP_VER = 'v17';
  let logoN = 0;
  function nrLogo(w) { const u = 'l' + (logoN++); return '<svg width="'+w+'" height="'+w+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><defs><linearGradient id="gd'+u+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6C453"/><stop offset="1" stop-color="#D97706"/></linearGradient><mask id="m'+u+'"><rect width="120" height="120" fill="#fff"/><g transform="translate(60,60) scale(.66) translate(-57,-60)" stroke="#000" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M34 82V38L56 82V38"/><path d="M56 38H68a11 11 0 0 1 0 22H56M66 60L80 82"/></g></mask></defs><rect x="4" y="4" width="112" height="112" rx="28" fill="#0A1931"/><path d="M27.1 41A38 38 0 0 1 89.1 35.6" stroke="#1D4ED8" stroke-width="6" stroke-linecap="round"/><path d="M92.9 79A38 38 0 0 1 30.9 84.4" stroke="#1D4ED8" stroke-width="6" stroke-linecap="round"/><circle cx="95.2" cy="45.8" r="4" fill="#1D4ED8"/><circle cx="24.8" cy="74.2" r="4" fill="#1D4ED8"/><circle cx="60" cy="60" r="29" fill="url(#gd'+u+')" mask="url(#m'+u+')"/></svg>'; }
  const EN_ON = window.OT_DEV === true; /* English UI is still being prepared – only the test build enables it */
  const HELP_READY = window.OT_DEV === true;
  const LANG = () => (EN_ON && DB.settings.lang === 'en' ? 'en' : 'si');
  const lg = (si, en) => (LANG() === 'en' ? en : si);
  const tr = (s) => (LANG() === 'en' && window.I18N ? window.I18N.tr(s) : s);
  const confirmT = (m) => window.confirm(tr(m));
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mon = (i) => MONTHS[i];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const todayStr = () => OT.dateStr(new Date());
  const money = (n) => 'රු. ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dur = (m) => OT.fmtDur(m);
  const H = () => OT.holidayMap(window.LK_HOLIDAYS, DB.settings);
  const wd = (ds) => OT.parseDate(ds).getDay();
  const monthLabel = (mk) => { const [y, m] = mk.split('-').map(Number); return y + ' ' + MONTHS[m - 1]; };
  const dayNum = (ds) => +ds.slice(8);
  const longDate = (ds) => { const d = OT.parseDate(ds); return d.getFullYear() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + DAYS[d.getDay()]; };
  const hm = (v) => (v ? v : '—');

  let view = { tab: 'home', month: todayStr().slice(0, 7) };
  const SUM = () => OT.summarize(view.month, DB.entries, DB.settings, H());

  let toastT;
  function toast(msg, warn) {
    const t = $('#toast');
    t.textContent = tr(msg); t.className = 'on' + (warn ? ' warn' : '');
    clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, 3200);
  }

  /* ---------- result explanations ---------- */
  function explain(r, type) {
    switch (r.code) {
      case 'W_OK':
        return { cls: 'ok', t: '<b>OT ' + dur(r.ot) + '</b><br>උදේ ' + dur(r.morning) + ' + හවස/රාත්‍රි ' + dur(r.evening) + (r.late ? '<br>ප්‍රමාද අඩු කිරීම: විනාඩි ' + r.lateChunk : '') };
      case 'W_BELOW_MIN': return { cls: 'warn', t: 'අවම කොන්දේසි සපුරා නැත (එක් පැත්තකට විනාඩි 30, දවසට පැය 1). OT නැත.' };
      case 'W_LATE_OVER': return { cls: 'bad', t: 'දවසේ සේවය පැය 3½ ට අඩුයි (පෙ.ව. 12.30 ට පසු පැමිණීම). අද OT නැත.' };
      case 'W_LEAVE_OK': return { cls: 'ok', t: '<b>OT ' + dur(r.ot) + '</b><br>' + (r.leave === 'short' ? 'කෙටි නිවාඩුව (පැය 1½ අඩු කළා)' : 'අර්ධ දින නිවාඩුව (පැය 3½ අඩු කළා)') };
      case 'W_LEAVE_BELOW_MIN': return { cls: 'warn', t: (r.leave === 'short' ? 'කෙටි නිවාඩුව (පැය 1½)' : 'අර්ධ දින නිවාඩුව (පැය 3½)') + ' අඩු කළාම OT පැය 1 ට අඩුයි. OT නැත.' };
      case 'W_EARLY_OVER': return { cls: 'bad', t: 'පෙ.ව. 12.00 ට පෙර පිටවීම (සේවය පැය 3½ ට අඩුයි). අද OT නැත.' };
      case 'W_LATE_AND_EARLY': return { cls: 'bad', t: 'ප්‍රමාද වී පැමිණ කලින් පිටවීම. අද OT නැත.' };
      case 'H_ALLOW': return { cls: 'ok', t: '<b>දෛනික දීමනාව + OT ' + dur(r.ot) + '</b>' + (r.allowNext ? '<br>ඊළඟ දවසේ දීමනාවක්ද හිමියි' : '') };
      case 'H_ALLOW_NO_OT': return { cls: 'ok', t: '<b>දෛනික දීමනාව පමණි</b><br>OT නැත (අවම කොන්දේසි සපුරා නැත).' };
      case 'H_NOALLOW_LATE': return { cls: 'warn', t: 'පෙ.ව. 9.00 ට පසු පැමිණීම: දීමනාව නැත.<br><b>සම්පූර්ණ කාලය OT ' + dur(r.ot) + '</b>' };
      case 'H_NOALLOW_EARLY': return { cls: 'warn', t: 'සාමාන්‍ය වේලාවට කලින් පිටවීම: දීමනාව නැත.<br><b>සම්පූර්ණ කාලය OT ' + dur(r.ot) + '</b>' };
      case 'H_NOALLOW_UNCOVERED': return { cls: 'warn', t: 'ප්‍රමාදය හවසින් ආවරණය කර නැත: දීමනාව නැත.<br><b>සම්පූර්ණ කාලය OT ' + dur(r.ot) + '</b>' };
      case 'BAD_RANGE': return { cls: 'bad', t: 'පිටවීම පැමිණීමට පසු විය යුතුය.' };
      default: return { cls: '', t: '' };
    }
  }

  /* ---------- render ---------- */
  function render() {
    $('#mname').textContent = monthLabel(view.month);
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.t === view.tab));
    const showNav = view.tab === 'home' || view.tab === 'month';
    document.querySelectorAll('header.top .iconbtn,#mname').forEach((e) => { e.style.visibility = showNav ? 'visible' : 'hidden'; });
    $('#ttl').textContent = { home: 'OT ගණකය', month: 'මාසික සටහන', claims: 'වවුචර්', settings: 'සැකසුම්', help: 'උදවු' }[view.tab];
    const app = $('#app');
    if (view.tab === 'home') app.innerHTML = renderHome();
    else if (view.tab === 'month') app.innerHTML = renderMonth();
    else if (view.tab === 'claims') app.innerHTML = renderClaims();
    else if (view.tab === 'help') app.innerHTML = renderHelp();
    else app.innerHTML = renderSettings();
  }

  function cellInfo(row) {
    const r = row.res;
    if (r.kind === 'leave') return '<small class="t-mu">නිවාඩු</small>';
    if (r.kind === 'off') return '<small class="t-mu">off</small>';
    if (r.kind === 'cont') return '<small class="t-al">↳රාත්‍රි</small>';
    if (r.kind === 'incomplete') return '<small class="t-bad">?</small>';
    if (r.kind === 'worked') {
      if (!r.valid) return '<small class="t-bad">වැරදියි</small>';
      let s = '';
      if (r.ot > 0) s += '<small class="t-ot">' + dur(r.ot) + '</small>';
      if (r.allowance) s += '<small class="t-al">දීමනා</small>';
      if (!s) s = '<small class="t-mu">✓</small>';
      return s;
    }
    return '';
  }

  function capCard(sm) {
    const cap = sm.capH;
    const own = DB.settings.monthCaps && DB.settings.monthCaps[view.month] != null && DB.settings.monthCaps[view.month] !== '';
    let body;
    if (cap == null) {
      body = '<div class="mute">අතිකාල පැය සීමාවක් නෑ.</div>';
    } else {
      const pct = cap ? Math.min(100, (sm.otMin / (cap * 60)) * 100) : 0;
      const cls = sm.otMin >= cap * 60 ? 'bad' : pct >= 85 ? 'warn' : '';
      body = '<div class="row sb"><div><span class="big">' + dur(sm.otMin) + '</span> <span class="mute">/ ' + cap + ':00</span></div>' +
        (sm.excessMin > 0 ? '<span class="chip bad">ඉක්මවා ඇත ' + dur(sm.excessMin) + '</span>' : '<span class="chip ok">ඉතිරි ' + dur(cap * 60 - sm.otMin) + '</span>') + '</div>' +
        '<div class="bar"><i class="' + cls + '" style="width:' + pct + '%"></i></div>';
    }
    let days = '';
    if (sm.dayCap != null) days = '<div class="row sb" style="margin-top:6px"><span>විවේක දින ගෙවීම</span><span><b>' + sm.allowDays + '</b> / ' + sm.dayCap +
      (sm.excessDays > 0 ? ' <span class="chip bad">ඉක්මවා ' + sm.excessDays + '</span>' : '') + '</span></div>';
    return '<div class="card" style="padding:10px 14px"><h2 style="margin-bottom:6px">මාසික අතිකාල සීමාව</h2>' + body + days +
      (!own && cap != null ? '<div class="mute" style="margin-top:4px;font-size:12px">සීමාව පෙර මාසයෙන් ගත්තකි</div>' : '') + '</div>';
  }

  function backupBlob() { return new Blob([JSON.stringify({ app: 'ot-calc', v: 1, at: new Date().toISOString(), data: DB }, null, 1)], { type: 'application/json' }); }
  function backupBanner() {
    const S = DB.settings;
    if (!S.welcomed) return '';
    if (!S.backupFrom) { S.backupFrom = Date.now(); save(); }
    const last = S.lastBackup || S.backupFrom, days = Math.floor((Date.now() - last) / 86400000);
    if (days < 3 || S.backupSnooze === todayStr()) return '';
    return '<div class="card" style="border:2px solid #e8b53a"><b>⚠ ' + lg('උපස්ථයක් ගන්න', 'Time to take a backup') + '</b><div class="mute" style="margin:4px 0 8px">' +
      (S.lastBackup ? lg('අන්තිම උපස්ථය දින ' + days + 'කට කලින්.', 'Last backup ' + days + ' days ago.') : lg('තවම උපස්ථයක් ගෙන නෑ.', 'No backup taken yet.')) + ' ' +
      lg('උපස්ථ ගොනු Downloads වලට සුරැකේ. පරණ ඒවා අතින් මකන්න (අලුත්ම 5ක් පමණක් තබා ගන්න).', 'Backup files are saved to Downloads. Delete old ones by hand (keep only the newest 5).') +
      '</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold sm" data-a="backup">💾 ' + lg('උපස්ථය බාගන්න', 'Download backup') + '</button><button class="btn alt sm" data-a="backupshare">📤 Share / WhatsApp</button><button class="btn alt sm" data-a="backuplater">' + lg('පසුව', 'Later') + '</button></div></div>';
  }
  function renderHome() {
    const sm = SUM();
    const t = todayStr();
    const hol = H();
    const inMonth = t.slice(0, 7) === view.month;
    let out = backupBanner();
    // reminder banner
    const te = DB.entries[t];
    const partial = !!te && te.status === 'worked' && (!te.in || !te.out);
    const dueNow = DB.settings.reminderOn && inMonth && (!te || partial) && (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() >= OT.toMin(DB.settings.reminderTime); })();
    if (dueNow) out += '<div class="banner"><span>' + (partial ? 'අද පිටවීම තවම සටහන් කර නෑ' : 'අද පැමිණීම/පිටවීම තවම සටහන් කර නෑ') + '</span><button class="btn sm gold" data-a="edit" data-d="' + t + '">සටහන් කරන්න</button></div>';
    // today card
    const tt = OT.dayTypeOf(t, hol);
    const tr = sm.rows.find((r) => r.date === t);
    out += '<div class="card"><div class="row sb"><div><div class="mute">අද</div><div style="font-weight:700">' + esc(longDate(t)) + '</div>' +
      '<div class="mute">' + TYPE_NAME[tt] + (hol[t] ? ' · ' + esc(hol[t]) : '') + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;flex:none">' +
      (!te ? '<button class="btn gold" data-a="quick" data-f="in">පැමිණීම = දැන්</button>' : (partial && te.in && !te.out ? '<button class="btn gold" data-a="quick" data-f="out">පිටවීම = දැන්</button>' : '')) +
      '<button class="btn' + (!te || (partial && te.in && !te.out) ? ' alt sm' : '') + '" data-a="edit" data-d="' + t + '">' + (te ? 'සංස්කරණය' : 'වෙනත් වේලාවක්') + '</button>' +
      '<button class="btn alt sm" data-a="togcal">' + (view.showCal ? 'දින දර්ශනය වසන්න' : 'වෙනත් දිනයක් තෝරන්න') + '</button></div></div>';
    if (tr && te) {
      const e = explain(tr.res, tt);
      if (te.status === 'worked' && partial) out += '<div class="pv warn" style="margin-bottom:0">පැමිණීම ' + hm(te.in) + ' · පිටවීම ' + hm(te.out) + '<br>' + (te.out ? 'පැමිණීම තවම සටහන් කර නෑ' : 'පිටවන විට "පිටවීම = දැන්" ඔබන්න') + '</div>';
      else if (te.status === 'worked') out += '<div class="pv ' + e.cls + '" style="margin-bottom:0">' + hm(te.in) + ' → ' + hm(te.out) + (te.overnight ? ' (ඊළඟ දවසේ)' : '') + '<br>' + e.t + '</div>';
      else out += '<div class="pv" style="margin-bottom:0">' + (te.status === 'leave' ? 'නිවාඩු' : 'off day') + '</div>';
    }
    out += '</div>';
    out += capCard(sm);
    // calendar
    const [y, m] = view.month.split('-').map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    let cal = '<div class="cal">' + DAYS_S.map((d) => '<div class="dh">' + d + '</div>').join('');
    for (let i = 0; i < first; i++) cal += '<div class="cell blank"></div>';
    for (const row of sm.rows) {
      const cls = ['cell'];
      if (row.type !== 'weekday') cls.push('hol');
      if (row.date === t) cls.push('today');
      cal += '<div class="' + cls.join(' ') + '" data-a="edit" data-d="' + row.date + '"><span class="n">' + dayNum(row.date) + '</span>' + cellInfo(row) + '</div>';
    }
    cal += '</div><div class="legend"><span><i class="dot" style="background:var(--hol)"></i>සති අන්ත / නිවාඩු</span><span class="t-ot">3:30 = OT</span><span class="t-al">දීමනා = දෛනික දීමනාව</span></div>';
    if (view.showCal) out += '<div class="card"><div class="row sb" style="margin-bottom:10px"><h2 style="margin:0">දිනයක් තෝරන්න</h2>' +
      (inMonth ? '' : '<button class="btn alt sm" data-a="gotoday">අද වෙත</button>') + '</div>' + cal + '</div>';
    // totals
    out += '<div class="card"><h2>මෙම මාසයේ එකතුව</h2><div class="tot">' +
      '<span>OT</span><b>' + money(sm.otAmount) + '</b>' +
      '<span>PH / OFF DAYS</span><b>' + money(sm.allowAmount) + '</b>' +
      (sm.excessDays > 0 ? '<span style="color:var(--bad)">සීමාව ඉක්මවූ දින (නොගෙවේ)</span><b style="color:var(--bad)">' + sm.excessDays + '</b>' : '') +
      '<div class="sep"></div><span><b>TOTAL</b></span><b>' + money(sm.otAmount + sm.allowAmount) + '</b></div>' +
      '<button class="btn alt block" style="margin-top:10px" data-a="viewsum">සාරාංශය බලන්න</button></div>';
    if (!DB.settings.baseSalary) out += '<div class="banner" style="background:var(--badbg);color:var(--bad)"><span>මූලික වැටුප සැකසුම් වල ඇතුළත් කරන්න</span><button class="btn sm" data-a="tab" data-t="settings">සැකසුම්</button></div>';
    out += installCard();
    { const by = OT.builtinYears(window.LK_HOLIDAYS), now = new Date(), cy = now.getFullYear(), ex = DB.settings.holidayExtra || {};
      const has = (y) => by[y] || Object.keys(ex).some((d) => d.startsWith(y + '-'));
      const miss = !has(cy) ? cy : (now.getMonth() >= 9 && !has(cy + 1) ? cy + 1 : 0);
      if (miss) out += '<div class="banner" style="background:#fff3cd;color:#6b4e00"><span>' + miss + ' වසරේ පොහොය ඇතුළු නිවාඩු දින ලැයිස්තුව තවම ඇතුළත් කර නැත. සැකසුම් → නිවාඩු වලින් එක් කරන්න, නැතිනම් ඇප් එකේ අලුත් අනුවාදයක් ලැබෙන තෙක් බලන්න.</span><button class="btn sm" data-a="tab" data-t="settings">සැකසුම්</button></div>'; }
    out += '<div style="margin-top:14px;opacity:.9">' + nrLogo(34) + '</div>';
    return out;
  }

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if (view.tab === 'home') render(); });
  function installCard() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) return '';
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (deferredPrompt) return '<div class="card row sb"><span>ඇප් එකක් ලෙස ෆෝන් එකට දාගන්න</span><button class="btn gold" data-a="install">Install</button></div>';
    if (ios) return '<div class="card mute">iPhone: Safari හි Share බොත්තම → "Add to Home Screen".</div>';
    return '<div class="card mute">ෆෝන් එකට දාගන්න: Chrome මෙනුව (⋮) → "Install app" / "Add to Home screen".</div>';
  }

  function renderMonth() {
    const sm = SUM();
    let list = '';
    for (const row of sm.rows) {
      const r = row.res;
      const cls = row.type !== 'weekday' ? ' hol' : '';
      let mid = '<span class="mute">සටහනක් නෑ</span>', right = '';
      if (r.kind === 'worked' && r.valid) {
        mid = hm(row.entry.in) + ' → ' + hm(row.entry.out) + (row.entry.overnight ? ' <span class="chip mu">ඊළඟ දවසේ</span>' : '');
        right = (r.ot > 0 ? '<b style="color:var(--ok)">' + dur(r.ot) + '</b>' : '<span class="mute">OT නෑ</span>') + (r.allowance ? '<br><span class="chip ok">දීමනා</span>' : '') + (r.splitNext ? '<br><span class="mute">00:00 න් පසු ' + dur(r.splitNext) + ' → ඊළඟ මාසයට</span>' : '');
      } else if (r.kind === 'worked') { mid = '<span style="color:var(--bad)">වැරදි වේලාවක්</span>'; }
      if (r.kind === 'worked' && r.valid) {
        if (r.adjFail) mid += '<br><span class="chip bad">නොගෙවේ – ආසන්න වැඩ දිනයේ සේවය නැත</span>';
        else if (r.adj === 'pending') mid += '<br><span class="chip warn">⚠ ආසන්න වැඩ දිනය තහවුරු කර නැත</span>';
        if (r.leave === 'short') mid += '<br><span class="chip mu">කෙටි නිවාඩුව</span>';
        else if (r.leave === 'half') mid += '<br><span class="chip mu">අර්ධ දින නිවාඩුව</span>';
        const spTxt = { am: 'උදේ OT පමණයි', pm: 'හවස OT පමණයි', comp: 'හිලව් නිවාඩුවට', allot: 'සම්පූර්ණ පැය OT', skip: 'ගන්නේ නෑ', noot: 'OT ගන්නේ නෑ' }[r.special];
        if (spTxt) mid += '<br><span class="chip mu">★ ' + spTxt + '</span>';
      }
      if (r.kind === 'leave') mid = '<span class="chip mu">නිවාඩු</span>';
      else if (r.kind === 'off') mid = '<span class="chip mu">off day</span>';
      else if (r.kind === 'cont') { mid = '<span class="chip ok">රාත්‍රි සේවයේ දිගුව</span>'; if (r.from) mid += ' <span class="mute">' + dayNum(r.from) + ' සිට</span>'; if (r.ot > 0) right = '<b style="color:var(--ok)">' + dur(r.ot) + '</b>'; }
      else if (r.kind === 'incomplete') mid = '<span style="color:var(--bad)">අසම්පූර්ණයි</span>';
      list += '<div class="item' + cls + '" data-a="edit" data-d="' + row.date + '"><div class="d"><b>' + dayNum(row.date) + '</b><span>' + DAYS_S[wd(row.date)] + '</span></div>' +
        '<div class="m">' + mid + (row.holiday ? '<div class="mute">' + esc(row.holiday) + '</div>' : '') + '</div><div class="r">' + right + '</div></div>';
    }
    const claimed = DB.claims[view.month];
    const lb = (a, b) => '<span>' + a + (b ? '<br><small style="color:var(--mute)">' + b + '</small>' : '') + '</span>';
    const dvTxt = '1/' + (DB.settings.allowanceDivisor || 30);
    let out = '<div class="card" id="mSum"><h2>' + monthLabel(view.month) + ' සාරාංශය</h2><div class="tot">' +
      '<span>සේවය කල දින ගණන</span><b>' + sm.workedDays + '</b>' +
      '<span>ලබා ගත් නිවාඩු / OFF</span><b>' + sm.leaveDays + ' / ' + sm.offDays + '</b>' +
      (sm.shortLeaves || sm.halfDays ? lb('කෙටි නිවාඩු / අර්ධ දින', 'කෙටි නිවාඩු මාසයට ' + sm.shortLeaveCap + 'ක් හිමියි') + '<b>' + sm.shortLeaves + ' / ' + sm.halfDays + '</b>' : '') +
      '<div class="sep"></div>' + lb('<b>OT + DAYS PAY</b>') + '<b style="font-size:20px">' + money(sm.otAmount + sm.allowAmount) + '</b></div></div>' +
      '<div class="card"><h2>OT</h2><div class="tot">' +
      '<span>අනුමත උපරිම පැය ගණන</span><b>' + (sm.capH != null ? sm.capH + ':00' : 'සීමාවක් නෑ') + '</b>' +
      lb('ඉටු කර ඇති OT පැය', 'ගණන') + '<b>' + dur(sm.otMin) + '</b>' +
      (sm.excessMin > 0 ? '<span style="color:var(--bad)">ඉක්මවූ පැය (නොගෙවේ)</span><b style="color:var(--bad)">' + dur(sm.excessMin) + '</b>' : '') +
      lb('ගෙවිය හැකි OT පැය', 'ගණන') + '<b>' + dur(sm.payMin) + '</b>' +
      '<span>පැයකට ගෙවන මුදල</span><b>' + money(sm.hourly) + '</b>' +
      '<div class="sep"></div><span><b>OT සඳහා මුදල</b></span><b>' + money(sm.otAmount) + '</b></div></div>' +
      '<div class="card"><h2>PH / OFF DAYS</h2><div class="tot">' +
      lb('සේවය කල විවේක දින', 'ගණන') + '<b>' + sm.allowDays + '</b>' +
      (sm.dayCap != null ? '<span>අනුමත දින ගණන</span><b>' + sm.dayCap + '</b>' : '') +
      (sm.excessDays > 0 ? '<span style="color:var(--bad)">ඉක්මවූ දින (නොගෙවේ)</span><b style="color:var(--bad)">' + sm.excessDays + '</b>' : '') +
      lb('දීමනා ගෙවිය හැකි දින', 'ගණන') + '<b>' + sm.allowPay + '</b>' +
      '<span>දිනක වැටුප</span><b>' + money(sm.daily) + '</b>' +
      '<div class="sep"></div><span><b>' + dvTxt + ' දීමනාව</b></span><b>' + money(sm.allowAmount) + '</b></div>' +
      (claimed ? '<p class="mute" style="margin:10px 0 0">✅ මෙම මාසය ' + new Date(claimed.at).toLocaleDateString() + ' දින සුරකින ලදී. නැවත තහවුරු කළොත් අලුත් අගයන් ආදේශ වේ.</p>' : '') +
      '<button class="btn gold block" style="margin-top:12px" data-a="claim">වවුචර් සකසන්න</button><div style="text-align:center;margin-top:8px"><a href="#" data-a="spmanual" style="font-size:13px">විශේෂ දින තෝරන්න</a></div></div>';
    out += '<div class="card"><h2>දිනපතා සටහන්</h2>' + list + '</div>';
    return out;
  }

  /* ---------- special days popup (before making vouchers) ---------- */
  const SPN = { comp: 'හිලව් නිවාඩුවක් සඳහා ඉතිරි කරනවා', allot: 'සම්පූර්ණ පැය ගණනම OT ලෙස', skip: 'මේ දවසේ OT / දීමනා ගන්නේ නෑ', noot: 'මේ දවසේ OT ගන්නේ නෑ', am: 'OT උදේ පමණයි', pm: 'OT හවස පමණයි' };
  function spRelevant(sm) { return sm.rows.some((r) => r.res.kind === 'worked' && r.res.valid && r.entry && (r.type !== 'weekday' || r.res.leave || r.res.adj === 'pending' || r.entry.special || r.entry.otTo || r.entry.lvOverride)); }
  function otToOpts(cur) { let o = '<option value="">අනුමත වේලාව දක්වා</option>'; for (let m = 16 * 60 + 30; m <= 22 * 60; m += 15) { const t = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); o += '<option value="' + t + '"' + (cur === t ? ' selected' : '') + '>' + t + '</option>'; } return o; }
  function spPopup(open) {
    const sm = SUM(); let p = document.getElementById('spop'); if (p) p.remove();
    const days = sm.rows.filter((r) => r.res.kind === 'worked' && r.res.valid && r.entry && (r.type !== 'weekday' || r.res.ot > 0 || r.res.leave || r.entry.special || r.entry.otTo));
    const marked = days.filter((r) => r.entry.special).length;
    if (marked) open = true;
    p = document.createElement('div'); p.id = 'spop';
    p.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px';
    let o = '<div style="background:var(--card);color:var(--ink);border-radius:18px;padding:16px;width:100%;max-width:440px;max-height:92vh;overflow:auto"><b style="font-size:18px">' + monthLabel(view.month) + ' – විශේෂ දින තියෙනවද?</b>';
    if (!open) {
      o += '<p class="mute">හිලව් නිවාඩුවක් සඳහා දින ඉතිරි කිරීම, දීමනාවක් වෙනුවට සම්පූර්ණ පැය OT ලෙස ගැනීම, OT උදේ/හවස පමණක් ගැනීම, OT අවසන් වේලාව වෙනස් කිරීම හෝ සමහර දවස් වල OT/දීමනා නොගැනීම මෙතනින් තෝරන්න.</p>' +
        '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-a="claimgo">නැහැ, ඉදිරියට</button><button class="btn alt" data-a="spopen">ඔව්, දින තෝරන්න</button><button class="btn alt" data-a="spclose">අවලංගු</button></div></div>';
    } else {
      o += '<p class="mute" style="margin:6px 0">දවස් ටික් කරලා පහළින් විකල්පයක් එබුවම ඒ සියල්ලටම යෙදෙනවා.</p>';
      days.forEach((r) => {
        const sp = r.entry.special;
        o += '<label style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)"><input type="checkbox" class="spck" value="' + r.date + '" style="width:22px;height:22px">' +
          '<span><b>' + dayNum(r.date) + '</b> ' + DAYS_S[wd(r.date)] + (r.type !== 'weekday' ? ' <span class="chip mu">විවේක</span>' : '') + ' <span class="mute">' + hm(r.entry.in) + '→' + hm(r.entry.out) + '</span>' +
          (sp ? '<br><span class="chip warn">★ ' + SPN[sp] + '</span>' : '') + (r.res.leave ? '<br><select data-c="splv" data-d="' + r.date + '" style="margin-top:4px"><option value="">' + (r.res.leave === 'short' ? 'කෙටි නිවාඩුව' : 'අර්ධ දින නිවාඩුව') + ' (ස්වයංක්‍රීය)</option><option value="short"' + (r.entry.lvOverride === 'short' ? ' selected' : '') + '>කෙටි නිවාඩුවක් ලෙස</option><option value="half"' + (r.entry.lvOverride === 'half' ? ' selected' : '') + '>අර්ධ දින නිවාඩුවක් ලෙස</option></select>' : '') + (r.type === 'weekday' && !r.entry.overnight && r.res.kind === 'worked' ? '<br><select data-c="spot" data-d="' + r.date + '" style="margin-top:4px">' + otToOpts(r.entry.otTo || '') + '</select>' : '') + (r.res.adjFail ? '<br><span class="chip bad">ආසන්න වැඩ දිනයේ සේවය නැත – නොගෙවේ</span>' : '') + '</span></label>';
      });
      o += '<div style="display:grid;gap:6px;margin-top:10px">' + ['comp', 'allot', 'am', 'pm', 'skip', 'noot'].map((k) => '<button class="btn alt sm" data-a="spset" data-v="' + k + '">' + SPN[k] + '</button>').join('') +
        '<button class="btn alt sm" data-a="spset" data-v="">සාමාන්‍ය කරන්න (තෝරා ගැනීම ඉවත් කරන්න)</button></div>' +
        '<div class="mute" style="margin-top:6px">සටහන: "හිලව් නිවාඩුව" සහ "සම්පූර්ණ පැය OT" වලට අදාල වන්නේ විවේක දින (සෙනසුරාදා/ඉරිදා/PH) පමණි.</div>' +
        '<div class="row" style="gap:8px;margin-top:12px"><button class="btn gold" data-a="claimgo">ඉදිරියට – වවුචර් සකසන්න</button><button class="btn alt" data-a="spclose">අවලංගු</button></div></div>';
    }
    p.innerHTML = o; document.body.appendChild(p);
  }
  const sumKey = (x) => JSON.stringify([x.otMin, x.payMin, x.allowDays, x.allowPay, x.otAmount, x.allowAmount, x.hourly, x.daily, x.rows.filter((r) => r.res.kind === 'worked').length]);
  function claimStale(k) { const c = DB.claims[k]; return !c || sumKey(c.sum) !== sumKey(OT.summarize(k, DB.entries, DB.settings, H())); }
  function renderClaims() {
    const keys = Object.keys(DB.claims).sort().reverse();
    if (!keys.length) return '<div class="card mute" data-a="gotoclaim" style="cursor:pointer">තවම සුරැකි වවුචර් නෑ. "මාසය" පිටුවේ "වවුචර් සකසන්න" බොත්තම ඔබන්න. <b style="color:var(--brand2)">(මෙතන ඔබන්න ➜)</b></div>';
    return keys.map((k) => {
      const c = DB.claims[k];
      if (claimStale(k)) {
        return '<div class="card" style="border:2px solid #e8b53a"><div class="row sb"><b>' + monthLabel(k) + '</b><span class="chip warn">මාසයේ දත්ත වෙනස් වී ඇත</span></div>' +
          '<p class="mute" style="margin:8px 0">සුරැකි වවුචරය දැන් ඇති මුදල් වලට නොගැළපේ. නැවත සකසන්න.</p>' +
          '<div class="row" style="flex-wrap:wrap"><button class="btn sm gold" data-a="gotoclaim" data-m="' + k + '">වවුචර් නැවත සකසන්න ➜</button>' +
          '<button class="btn sm alt" data-a="delclaim" data-m="' + k + '">ඉවත් කරන්න</button></div></div>';
      }
      const s = c.sum;
      return '<div class="card"><div class="row sb"><b>' + monthLabel(k) + '</b><span class="mute">' + new Date(c.at).toLocaleDateString() + '</span></div>' +
        '<div class="tot" style="margin:8px 0"><span>ගෙවිය හැකි OT පැය</span><b>' + dur(s.payMin) + '</b><span>OT මුදල</span><b>' + money(s.otAmount) + '</b>' +
        '<span>දෛනික දීමනා (' + (s.allowPay != null ? s.allowPay : s.allowDays) + ')</span><b>' + money(s.allowAmount) + '</b></div>' +
        '<div class="row" style="flex-wrap:wrap"><button class="btn sm" data-a="voucher" data-k="ot" data-m="' + k + '">OT වවුචරය</button>' +
        '<button class="btn sm" data-a="voucher" data-k="al" data-m="' + k + '">දීමනා වවුචරය</button>' +
        '<button class="btn sm alt" data-a="delclaim" data-m="' + k + '">ඉවත් කරන්න</button></div></div>';
    }).join('');
  }

  /* ---------- settings ---------- */
  function fld(label, path, type, extra, pre) {
    const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), DB.settings);
    if (pre) return '<label class="f"><span>' + label + '</span><span class="pw' + (pre.length > 2 ? ' long' : '') + '"><i>' + pre + '</i><input type="' + type + '" value="' + esc(v == null ? '' : v) + '" data-c="set" data-p="' + path + '"' + (type === 'number' ? ' inputmode="decimal" step="any"' : '') + (extra || '') + '></span></label>';
    return '<label class="f"><span>' + label + '</span><input type="' + type + '" value="' + esc(v == null ? '' : v) + '" data-c="set" data-p="' + path + '"' + (type === 'number' ? ' inputmode="decimal" step="any"' : '') + (extra || '') + '></label>';
  }
  function holidaySection() {
    const yr = view.hy || new Date().getFullYear();
    const S = DB.settings;
    const rows = [];
    for (const [d, n] of Object.entries(window.LK_HOLIDAYS)) if (d.startsWith(yr + '-')) rows.push({ d, n, src: 'b', removed: S.holidayRemoved.includes(d) });
    for (const [d, n] of Object.entries(S.holidayExtra)) if (d.startsWith(yr + '-')) rows.push({ d, n, src: 'x', removed: false });
    rows.sort((a, b) => (a.d < b.d ? -1 : 1));
    const yrs = [new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2];
    let h = '<div class="card"><h2>රජයේ ප්‍රසිද්ධ නිවාඩු දින</h2>' +
      '<div class="seg">' + yrs.map((y) => '<button class="' + (y === +yr ? 'on' : '') + '" data-a="hy" data-y="' + y + '">' + y + '</button>').join('') + '</div>';
    if (!rows.length) h += '<p class="mute">මෙම වසර සඳහා ලැයිස්තුවක් ඇතුළත් කර නෑ. අවශ්‍ය දින පහත එක් කරන්න.</p>';
    h += rows.map((r) => '<div class="row sb" style="padding:6px 0;border-bottom:1px solid var(--line);' + (r.removed ? 'opacity:.5;text-decoration:line-through' : '') + '"><div><b>' + r.d.slice(5) + '</b> · ' + DAYS_S[wd(r.d)] + '<br><span class="mute">' + esc(r.n) + (r.src === 'x' ? ' (ඔබ එක් කළ)' : '') + '</span></div>' +
      '<button class="btn alt sm" data-a="' + (r.src === 'x' ? 'delhol' : r.removed ? 'resthol' : 'remhol') + '" data-d="' + r.d + '">' + (r.removed ? 'නැවත' : 'ඉවත්') + '</button></div>').join('');
    h += '<div class="grid2" style="margin-top:12px"><label class="f"><span>දිනය</span><input type="date" id="hd"></label><label class="f"><span>නම</span><input type="text" id="hn" placeholder="උදා: විශේෂ නිවාඩුව"></label></div>' +
      '<button class="btn block" data-a="addhol">නිවාඩු දිනයක් එක් කරන්න</button></div>';
    return h;
  }
  const capTxt = (v) => (v == null || v === '' ? '— (පෙර මාසයෙන්)' : v === 'none' ? 'සීමාවක් නෑ' : v);
  function capSection() {
    const S = DB.settings;
    const hc = S.monthCaps || {}, dc = S.monthDayCaps || {};
    const m = view.month;
    const keys = Array.from(new Set(Object.keys(hc).concat(Object.keys(dc)))).sort().reverse();
    let h = '<div class="card"><h2>මාසික අනුමත සීමා</h2><p class="mute" style="margin-top:0">මාසය තෝරා අනුමත අතිකාල පැය සහ විවේක දින (සති අන්ත/නිවාඩු දිනවල ගෙවන දින) ගණන දාන්න. අලුත් සීමාවක් දාන තෙක් පෙර මාසයේ අගයම යෙදේ. <b>සීමාවක් නැත්නම් 0 ඇතුළත් කරන්න (0 = සීමාවක් නෑ).</b> හිස් තැබුවොත් පෙර මාසයේ සීමාව යෙදේ.</p>' +
      '<div class="grid3" style="grid-template-columns:1.7fr 1fr 1fr"><label class="f"><span>මාසය</span><input type="month" id="capm" value="' + m + '"></label>' +
      '<label class="f"><span>OT පැය</span><input type="number" id="caph" inputmode="decimal" step="any" min="0" placeholder="0" value="' + (hc[m] != null ? (hc[m] === 'none' ? 0 : hc[m]) : '') + '"></label>' +
      '<label class="f"><span>විවේක දින</span><input type="number" id="capd" inputmode="numeric" step="1" min="0" placeholder="0" value="' + (dc[m] != null ? (dc[m] === 'none' ? 0 : dc[m]) : '') + '"></label></div>' +
      '<button class="btn block" data-a="addcap">සීමාව සුරකින්න</button>' +
      '<div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn alt sm" data-a="nocap" data-t="h">OT පැය සීමාව ඉවත් කරන්න</button>' +
      '<button class="btn alt sm" data-a="nocap" data-t="d">විවේක දින සීමාව ඉවත් කරන්න</button></div>';
    if (keys.length) {
      h += '<div style="margin-top:12px">' + keys.map((k) => '<div class="row sb" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><b>' + monthLabel(k) + '</b><br><span class="mute">OT පැය: ' +
        capTxt(hc[k]) + ' · විවේක දින: ' + capTxt(dc[k]) + '</span></div>' +
        '<button class="btn alt sm" data-a="delcap" data-k="' + k + '">මකන්න</button></div>').join('') + '</div>';
    }
    return h + '</div>';
  }
  function area(label, path, rows, hint) {
    const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), DB.settings);
    return '<label class="f"><span>' + label + '</span><textarea rows="' + (rows || 4) + '" data-c="set" data-p="' + path + '">' + esc(v == null ? '' : v) + '</textarea></label>' + (hint ? '<p class="mute" style="margin:-6px 0 8px">' + hint + '</p>' : '');
  }
  const STABS = [['me', 'පුද්ගලික'], ['pay', 'අනුපාත / නීති'], ['lim', 'සීමා'], ['hol', 'නිවාඩු'], ['app', 'ඇප්']];
  function renderSettings() {
    const S = DB.settings, st = view.st || 'me';
    const h0 = renderSettings0();
    if (S.locked && typeof S.locked === 'object') S.locked = !!(S.locked.me || S.locked.pay); /* migrate older flag */
    const lk = S.locked === true;
    const i = h0.indexOf('</div>') + 6; /* after the tab strip */
    const strip = h0.slice(0, i), body = h0.slice(i);
    const banner = lk ? '<div style="margin-bottom:12px"><button class="btn alt block" data-a="unlock">🔒 ' + lg('සැකසුම් වෙනස් කරන්න', 'Edit settings') + '</button></div>' : '';
    const idx = STABS.findIndex((x) => x[0] === st);
    const arrows = '<div class="row" style="gap:10px;margin-top:10px">' + (idx > 0 ? '<button class="btn alt" style="flex:1;font-size:22px" data-a="snav" data-d="-1">◀</button>' : '<span style="flex:1"></span>') +
      (idx < STABS.length - 1 ? '<button class="btn alt" style="flex:1;font-size:22px" data-a="snav" data-d="1">▶</button>' : '<span style="flex:1"></span>') + '</div>';
    const save = lk ? '' : '<button class="btn gold block" id="saveBtn" data-a="savenext">SAVE</button>';
    return strip + banner + '<fieldset ' + (lk ? 'disabled' : '') + ' style="border:0;padding:0;margin:0;min-width:0">' + body + '</fieldset>' + save + arrows;
  }
  const DESIGS = ['රාජ්‍ය සෞඛ්‍ය කළමනාකරණ සහකාර', 'සංවර්ධන නිලධාරී'];
  function desigField() {
    const d = DB.settings.designation || '', known = DESIGS.indexOf(d) >= 0, other = !known && d !== '';
    let o = '<label class="f"><span>' + lg('තනතුර', 'Designation') + '</span><select data-c="desig"><option value=""' + (d === '' ? ' selected' : '') + '>' + lg('තෝරන්න', 'Select') + '</option>';
    DESIGS.forEach((x) => { o += '<option' + (x === d ? ' selected' : '') + ' value="' + x + '">' + x + '</option>'; });
    o += '<option value="__o"' + (other ? ' selected' : '') + '>' + lg('වෙනත්', 'Other') + '</option></select></label>';
    return o + '<div id="desOther" style="display:' + (other ? 'block' : 'none') + '">' + fld(lg('වෙනත් තනතුර ටයිප් කරන්න', 'Type your designation'), 'designation', 'text') + '</div>';
  }
  function capGuard() {
    if (!(view.tab === 'settings' && view.capDirty)) return false;
    const b = document.querySelector('[data-a=addcap]');
    if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.style.outline = '4px solid #dc2626'; setTimeout(() => { b.style.outline = ''; }, 1500); }
    toast(lg('"සීමාව සුරකින්න" ඔබා සීමාව සුරකින්න', 'Press "Save limit" to save the limit first'), true);
    return true;
  }
  function guardLeave() {
    if (capGuard()) return true;
    if (!(view.tab === 'settings' && view.dirty && DB.settings.locked !== true)) return false;
    const b = document.getElementById('saveBtn');
    if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.style.outline = '4px solid #dc2626'; setTimeout(() => { b.style.outline = ''; }, 1500); }
    toast(lg('මෙම පිටුවේ වෙනස්කම් SAVE කරන්න', 'Please SAVE your changes first'), true);
    return true;
  }
  function renderSettings0() {
    const S = DB.settings, st = view.st || 'me';
    let h = '<div class="seg stabs">' + STABS.map(([k, n]) => '<button class="' + (k === st ? 'on' : '') + '" data-a="stab" data-s="' + k + '">' + n + '</button>').join('') + '</div>';
    if (st === 'me') {
      h += '<div class="card"><h2>පෞද්ගලික තොරතුරු</h2>' + fld('නම', 'name', 'text') + desigField() + fld('සේවා ස්ථානය', 'station', 'text') + fld('වැටුප් අංකය', 'salaryNo', 'text') + fld('මූලික වැටුප (රු.)', 'baseSalary', 'number') + '</div>';
      h += '<div class="card"><h2>පොදු 35 අ වවුචරය</h2>' + fld('ගෙවීම් ශාඛාව', 'payUnit', 'text') +
        fld('විෂය සංකේතය (උදා: AA, AB)', 'subjectCode', 'text') +
        area('අතිකාල රාජකාරි විස්තරය', 'workDesc', 6, 'දිගු විස්තරයක් නම් කොටස් වශයෙන් අනු අංක යටතේ ලියන්න (1. ... 2. ...). Enter ඔබා නව පේළියක් ආරම්භ කරන්න. හිස් නම් වවුචරයේ විෂය සංකේත වාක්‍යය පමණක් මුද්‍රණය වේ. අතින් ටයිප් නොකර, මුද්‍රිත ලැයිස්තුව Google Lens එකෙන් Copy කරලා මෙතනට Paste කරන්නත් පුළුවන්.') + '</div>';
    } else if (st === 'pay') {
      h += '<div class="card"><h2>OT සහ PH ගණනය කිරීමේ අනුපාත</h2>' +
        fld('OT පැයක අනුපාතය', 'otDivisor', 'number', '', 'මූලික වැටුප ÷') + fld('දෛනික දීමනාව', 'allowanceDivisor', 'number', '', 'මූලික වැටුප ÷') +
        fld('OT පැයකට ගෙවන්නේ රේට් එකක් නම්, එම මුදල', 'otRate', 'number') + '</div>';
      h += '<div class="card"><h2>සාමාන්‍ය රාජකාරි වේලාවන්</h2>' +
        [['weekday', 'සතියේ දින (සඳුදා–සිකුරාදා)'], ['sat', 'සෙනසුරාදා'], ['sun', 'ඉරිදා'], ['holiday', 'රජයේ ප්‍රසිද්ධ නිවාඩු දින']].map(([k, n]) =>
          '<div style="margin-bottom:6px"><div class="mute">' + n + '</div><div class="grid2">' + fld('ආරම්භය', 'duty.' + k + '.s', 'time') + fld('අවසානය', 'duty.' + k + '.e', 'time') + '</div></div>').join('') + '</div>';
      h += '<div class="card"><h2>OT නීති</h2><div class="grid2">' + fld('උදේ OT ගණන් ගන්නා වේලාව', 'morningFrom', 'time') + fld('ප්‍රමාද වීමේ සහනය (විනාඩි)', 'graceMin', 'number') +
        fld('වටයන කොටස (විනාඩි)', 'chunk', 'number') + fld('එක් පැත්තකට අවම (විනාඩි)', 'minSide', 'number') + fld('දවසකට අවම (විනාඩි)', 'minDay', 'number') + '</div></div>';
    } else if (st === 'lim') {
      h += capSection();
      h += '<div class="card"><h2>OT ගෙවන අවසාන වේලාව</h2><p class="mute" style="margin-top:0">මෙම වේලාවෙන් පසු රැඳී සිටි කාලය නොගෙවේ. සමහර කාල සීමා වලට වෙනස් වේලාවක් දාන්න.</p>' +
        fld('සාමාන්‍ය අවසාන වේලාව', 'defaultCutoff', 'time') +
        '<div class="mute" style="margin:6px 0">විශේෂ කාල සීමා (සිට / දක්වා / වේලාව)</div>' +
        (S.limits || []).map((p, i) => '<div class="limrow"><label class="f" style="margin:0"><span>' + lg('සිට', 'From') + '</span><input type="date" value="' + esc(p.from) + '" data-c="lim" data-i="' + i + '" data-f="from"></label><label class="f" style="margin:0"><span>' + lg('දක්වා', 'To') + '</span><input type="date" value="' + esc(p.to) + '" data-c="lim" data-i="' + i + '" data-f="to"></label><label class="f" style="margin:0"><span>' + lg('අවසාන වේලාව', 'Cut-off time') + '</span><input type="time" value="' + esc(p.time) + '" data-c="lim" data-i="' + i + '" data-f="time"></label><button class="iconbtn" style="background:var(--badbg);color:var(--bad)" data-a="dellim" data-i="' + i + '">✕</button></div>').join('') +
        '<button class="btn alt sm" data-a="addlim">+ කාල සීමාවක් එක් කරන්න</button></div>';
    } else if (st === 'hol') {
      h += holidaySection();
    } else {
      if (EN_ON) h += '<div class="card"><h2>භාෂාව / Language</h2><div class="seg"><button class="' + (LANG() === 'si' ? 'on' : '') + '" data-a="setlang" data-l="si">සිංහල</button><button class="' + (LANG() === 'en' ? 'on' : '') + '" data-a="setlang" data-l="en">English</button></div></div>';
      h += '<div class="card"><h2>මතක් කිරීම්</h2><label class="sw"><input type="checkbox" ' + (S.reminderOn ? 'checked' : '') + ' data-c="rem"><span>දිනපතා සටහන් කරන්න මතක් කරන්න</span></label>' +
        fld('මතක් කරන වේලාව', 'reminderTime', 'time') +
        '<button class="btn alt sm" data-a="notif">දැනුම්දීම් අවසර දෙන්න</button>' +
        '<p class="mute" style="margin-bottom:0">ඇප් එක විවෘතව තිබෙන විට වේලාව පැමිණි විට දැනුම්දීමක් සහ බැනරයක් පෙන්වයි. ඇප් එක වසා තිබෙන විටත් වේලාවට එන දැනුම්දීම සඳහා APK අනුවාදය අවශ්‍යයි.</p></div>';
      h += '<div class="card"><h2>දත්ත උපස්ථය</h2><div class="row" style="flex-wrap:wrap"><button class="btn sm" data-a="backup">උපස්ථ ගොනුව බාගන්න</button>' +
        '<label class="btn alt sm" style="cursor:pointer">ගොනුවකින් ප්‍රතිස්ථාපනය<input type="file" accept="application/json" id="restore" hidden></label></div>' +
        '<p class="mute" style="margin-bottom:0">දත්ත ඇත්තේ මෙම ෆෝන් එකේ පමණි. Chrome දත්ත මැකුවොත් නැති වේ, ඒ නිසා කලින් කලට උපස්ථයක් ගන්න.</p></div>';
      h += '<button class="btn block" data-a="tab" data-t="help">❓ උදවු / භාවිත මාර්ගෝපදේශය</button>';
      h += '<div class="card" style="text-align:center;margin-top:12px"><div style="display:flex;justify-content:center">' + nrLogo(72) + '</div><h2 style="margin:8px 0 2px">සංවර්ධකයා ගැන</h2><div style="font-weight:700">නලින් රණසිංහ</div><div class="mute" style="margin-top:4px">මෙම ඇප් එක නිර්මාණය කළේ නලින් රණසිංහ විසිනි.</div><div class="mute" style="margin-top:6px;font-size:12px">අනුවාදය ' + APP_VER + '</div></div>';
    }
    return h;
  }

  /* ---------- help ---------- */
  function renderHelp() {
    const sec = (title, body) => HELP_READY ? '<details class="card help"><summary><b>' + title + '</b></summary><div class="hb">' + body + '</div></details>' : '<div class="card help" data-a="helpna" style="cursor:pointer"><b>' + title + '</b></div>';
    const li = (arr) => '<ul>' + arr.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
    let h = '<div class="row sb" style="margin-bottom:10px"><b>' + lg('භාවිත මාර්ගෝපදේශය', 'User guide') + '</b>' + (EN_ON ? '<div class="seg" style="margin:0;width:170px"><button class="' + (LANG() === 'si' ? 'on' : '') + '" data-a="setlang" data-l="si">සිංහල</button><button class="' + (LANG() === 'en' ? 'on' : '') + '" data-a="setlang" data-l="en">English</button></div>' : '') + '</div>';
    h += sec(lg('1. ආරම්භ කිරීම', '1. Getting started'), li([
      lg('Chrome වල ⋮ මෙනුව → "ඇප් එකක් ලෙස ෆෝන් එකට දාගන්න (Install app)" ඔබන්න. එවිට ඇප් එක ෆෝන් එකේ අයිකනයක් ලෙස එයි, අන්තර්ජාලයක් නැතිවත් ක්‍රියා කරයි.', 'In Chrome open the ⋮ menu and tap "Install app". The app is added to your home screen and works offline.'),
      lg('සැකසුම් → පුද්ගලික: නම, තනතුර, සේවා ස්ථානය සහ වැටුප් අංකය ඇතුළත් කරන්න (වවුචරයට මුද්‍රණය වේ).', 'Settings → Personal: enter your name, designation, service station and salary number (printed on the vouchers).'),
      lg('සැකසුම් → වැටුප් / නීති: මූලික වැටුප, OT සහ දීමනා ගණනය කරන අනුපාත (÷200/240, ÷30/20) සහ රාජකාරි වේලාවන් පරීක්ෂා කරන්න.', 'Settings → Pay / Rules: set your basic salary, the OT and allowance divisors (÷200/240, ÷30/20) and the normal duty times.')]));
    h += sec(lg('2. දිනපතා සටහන් කිරීම', '2. Daily entries'), li([
      lg('"මුල් පිටුව": රාජකාරියට පැමිණි විට "පැමිණීම = දැන්", පිටවන විට "පිටවීම = දැන්" ඔබන්න. වෙනත් වේලාවක් නම් "වෙනත් වේලාවක්" ඔබන්න.', 'On the Home tab tap "Arrival = now" when you arrive and "Departure = now" when you leave. For another time tap "Other time".'),
      lg('එක් වේලාවක් පමණක් ඇතුළත් කර සුරකින්න, අනෙක් වේලාව පසුව එක් කරන්න පුළුවන් (අසම්පූර්ණ දින ලකුණු වේ).', 'You may save only one time and add the other later (such days are marked incomplete).'),
      lg('පෙර දිනයක් සඳහා "වෙනත් දිනයක් තෝරන්න" හෝ "මාසය" පිටුවෙන් දිනය ඔබා වේලාවන් ඇතුළත් කරන්න. නිවාඩු දිනයක් නම් "නිවාඩු" ලෙස සලකුණු කරන්න.', 'For an earlier date tap "Pick another date" or open the Month tab and tap the day. Mark leave days as "Leave".'),
      lg('රාත්‍රිය පුරා සේවය නම් "රාත්‍රිය පුරා සේවය" ඔන් කර, පිටවීම ඊළඟ දවසේ වේලාව ඇතුළත් කරන්න.', 'For overnight duty switch on "Overnight duty" and enter the departure time of the next day.')]));
    h += sec(lg('3. ගණනය කරන නීති (සාරාංශය)', '3. Calculation rules (summary)'), li([
      lg('සතියේ දින රාජකාරිය 08:30–16:15. උදේ OT 07:00 සිට. 15 මිනිත්තු කොටස් වලට පහළට වටයයි.', 'Weekday duty is 08:30–16:15. Morning OT counts from 07:00. Time is rounded down to 15-minute blocks.'),
      lg('ප්‍රමාද: 15 ක් දක්වා නම් හවස OT වලින් 15 ක්, 16–30 නම් 30 ක් අඩු වේ. 09:01 න් පසු පැමිණියොත් OT නැත.', 'Late arrival: up to 15 min deducts 15 min of evening OT, 16–30 min deducts 30 min. Arrival after 09:00 earns no OT.'),
      lg('එක් පැත්තකට අවම විනාඩි 30, දවසට අවම පැය 1. එක් පැත්තක් පැය 1 ක් හෝ වැඩි නම් අනෙක් පැත්ත විනාඩි 30 ට අඩු වුවහොත් ගෙවන්නේ වැඩි පැත්ත පමණි.', 'Each side needs at least 30 min and the day at least 1 hour. If one side is 1 hour or more and the other is under 30 min, only the larger side is paid.'),
      lg('සති අන්ත / නිවාඩු දිනවල සාමාන්‍ය පැය සඳහා දෛනික දීමනාවක් ලැබේ (වැටුප ÷30 හෝ ÷20). ඊට අමතර පැය OT වේ.', 'Normal hours on weekends and public holidays earn a daily allowance (salary ÷30 or ÷20). Extra hours are OT.'),
      lg('OT ගෙවන්නේ අවසාන වේලාව (පෙරනිමි 18:00, 2026 නොවැම්බර්–දෙසැම්බර් 22:00) දක්වා පමණි. සැකසුම් → සීමා වලින් වෙනස් කළ හැක.', 'OT is paid only until the cut-off time (default 18:00; 22:00 for Nov–Dec 2026). Change it in Settings → Limits.'),
      lg('රාත්‍රි සේවය: 16:15 සිට පසුදින රාජකාරි ආරම්භය දක්වා සියල්ල OT. මාසයේ අන්තිම දවසේ නම් රාත්‍රී 12.00 දක්වා ඒ මාසයටත්, 12.00 න් පසු අලුත් මාසයටත් ගණන් වේ.', 'Overnight duty: everything from 16:15 until the next duty start is OT. If it starts on the last day of a month, time until midnight counts to that month and time after midnight counts to the next month.')]));
    h += sec(lg('4. මාසික සීමා', '4. Monthly limits'), li([
      lg('සැකසුම් → සීමා: මාසය තෝරා අනුමත OT පැය සහ විවේක දින ගණන දාන්න. නව සීමාවක් දාන තෙක් පෙර මාසයේ අගයම යෙදේ.', 'Settings → Limits: choose a month and enter the approved OT hours and rest-day count. The previous month value applies until you enter a new one.'),
      lg('සීමාව ඉක්මවූ පැය වවුචරයේ මුළු එකතුවේ පෙන්වයි, ඒත් ගෙවන්නේ අනුමත ප්‍රමාණයට පමණි.', 'Hours above the limit stay in the voucher total but only the approved amount is paid.')]));
    h += sec(lg('5. ඉල්ලීම් සහ වවුචර්', '5. Claims and vouchers'), li([
      lg('මාසය අවසන් වූ විට "මුල් පිටුව" හෝ "මාසය" පිටුවෙන් "ඉල්ලීම සුරකින්න" ඔබන්න. ඉන්පසු "ඉල්ලීම්" පිටුවෙන් වවුචර් විවෘත කරන්න.', 'At month end tap "Save claim" on the Home or Month tab, then open the vouchers from the Claims tab.'),
      lg('පොදු 35 අ = අතිකාල දීමනා වවුචරය, පොදු 35 = සති අන්ත / නිවාඩු දින දීමනා වවුචරය. දෙකම හිස් A4 කඩදාසියක ෆෝරමයත් සමඟ සම්පූර්ණයෙන් මුද්‍රණය වේ.', 'Gen 35a is the overtime voucher, Gen 35 is the weekend / holiday allowance voucher. Both print the complete form on a blank A4 sheet.'),
      lg('මුද්‍රණය: "මුද්‍රණය / PDF" ඔබා Chrome මුද්‍රණ කවුළුවේ කඩදාසි ප්‍රමාණය A4, Margins = None, Scale = 100%, "Background graphics" ඔන් කර Print කරන්න (PDF ලෙස සුරැකීමටද මෙයම).', 'To print tap "Print / PDF", then in the Chrome print dialog choose paper size A4, Margins = None, Scale = 100% and tick "Background graphics". Choose "Save as PDF" to make a PDF.'),
      lg('35 අ වගුවේ දිනයට මුලින් SA (සෙනසුරාදා), SU (ඉරිදා), PH (රජයේ නිවාඩු) ලකුණු කෙරේ. පේළි 31 ක් දක්වා එක පිටුවේ ඇතුළත් වේ, ඊට වැඩි නම් දෙවන පිටුවක් එකතු වේ.', 'In the Gen 35a table dates are prefixed SA (Saturday), SU (Sunday) or PH (public holiday). Up to 31 rows fit on one page; more rows continue on a second page.')]));
    h += sec(lg('6. නිවාඩු දින', '6. Holidays'), li([
      lg('2026 සහ 2027 රජයේ ප්‍රසිද්ධ නිවාඩු දින ඇතුළත්ය. ඉන් පසු වසර වල සිංහල අවුරුදු (අප්‍රේල් 13, 14), මැයි 1, නත්තල, පෙබරවාරි 4 ස්වයංක්‍රීයව ඇතුළත් වේ; පොහොය දින ඇතුළු අනෙක් දින එක් කළ යුතුය. අමතර නිවාඩුවක් ප්‍රකාශයට පත් වුවහොත් සැකසුම් → නිවාඩු වලින් එක් කරන්න, අනවශ්‍ය දිනයක් ඉවත් කරන්න.', 'Public holidays for 2026 and 2027 are built in. After that only fixed-date holidays (Apr 13/14, May 1, Feb 4, Dec 25) are added automatically; add Poya days and others yourself. If the government announces an extra holiday, add it in Settings → Holidays; you can also remove a day.')]));
    h += sec(lg('7. දත්ත ආරක්ෂාව සහ යාවත්කාලීන කිරීම', '7. Data safety and updating'), li([
      lg('ඔබේ දත්ත ඇත්තේ ෆෝන් එකේ Chrome තුළ පමණි. සැකසුම් → ඇප් → "උපස්ථ ගොනුව බාගන්න" මගින් කලින් කලට උපස්ථයක් ගන්න.', 'Your data is stored only inside Chrome on this phone. Take a backup regularly from Settings → App → "Download backup file".'),
      lg('ඇප් එකේ අලුත් අනුවාදයක් දමන්නේ එම අඩවියේම (Netlify හි Deploys පිටුවේ) පමණි. අලුත් අඩවියක් හැදුවොත් දත්ත හිස් පෙනේ — එවිට උපස්ථ ගොනුවෙන් ප්‍රතිස්ථාපනය කරන්න.', 'Upload new versions of the app to the same site (the Deploys page on Netlify). A new site shows empty data; if that happens restore your backup file.')]));
    return h;
  }

  /* ---------- editor sheet ---------- */
  let draft = null, draftDate = null;
  let tpTarget = 'tin', tpStage = 'h';
  function tsel(id, v) {
    return '<button type="button" class="tbtn" id="b_' + id + '" data-a="tpsel" data-id="' + id + '">' + (v ? esc(v) : '--:--') + '</button><input type="hidden" id="' + id + '" value="' + esc(v || '') + '">';
  }
  function tpanel() { return ''; }
  function tpClose() { const p = document.getElementById('tpop'); if (p) p.remove(); }
  function tpRender() {
    let p = document.getElementById('tpop');
    if (!p) { p = document.createElement('div'); p.id = 'tpop'; p.style.cssText = 'position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:14px'; document.body.appendChild(p); }
    const cur = (draft && draft[tpTarget === 'tin' ? 'in' : 'out']) || '', [hh, mm] = cur.split(':');
    const who = tpTarget === 'tin' ? lg('පැමිණීම', 'Arrival') : lg('පිටවීම', 'Departure');
    let o = '<div style="background:var(--card);color:var(--ink);border-radius:18px;padding:14px;width:100%;max-width:380px;max-height:90vh;overflow:auto"><div class="row sb" style="margin-bottom:8px"><b>' + who + ' – ' + (tpStage === 'h' ? lg('පැය තෝරන්න', 'Select hour') : (hh || '--') + ' : ' + lg('විනාඩි තෝරන්න', 'Select minutes')) + '</b><button type="button" class="btn alt sm" data-a="tpclose">✕</button></div>';
    if (tpStage === 'h') {
      o += '<div class="tg h">';
      for (let i = 0; i < 24; i++) o += '<button type="button" data-a="tph" data-v="' + pad(i) + '" class="' + (hh === pad(i) ? 'on' : '') + '">' + pad(i) + '</button>';
      o += '</div>';
    } else {
      o += '<div class="tg m6">';
      for (let i = 0; i < 60; i++) o += '<button type="button" data-a="tpm" data-v="' + pad(i) + '" class="' + (mm === pad(i) ? 'on' : '') + '">' + pad(i) + '</button>';
      o += '</div><div style="margin-top:8px"><button type="button" class="btn alt sm" data-a="tpback">‹ ' + lg('පැය', 'Hour') + '</button></div>';
    }
    p.innerHTML = o + '<div style="margin-top:8px"><button type="button" class="btn alt sm" data-a="tpclear">' + lg('මෙම වේලාව මකන්න', 'Clear this time') + '</button></div></div>';
  }
  function tpRefresh() { if (document.getElementById('tpop')) tpRender(); }
  function setT(id, v) {
    $('#' + id).value = v; $('#b_' + id).textContent = v || '--:--';
    if (draft) { if (id === 'tin') draft.in = v; else draft.out = v; refreshPreview(); }
  }
  function tpCur(id) { const v = $('#' + id).value; return v ? v.split(':') : ['', '']; }
  function openEditor(ds) {
    const sm = OT.summarize(ds.slice(0, 7), DB.entries, DB.settings, H());
    const row = sm.rows.find((r) => r.date === ds);
    draftDate = ds; tpTarget = 'tin'; tpClose();
    if (row.res.kind === 'cont') {
      sheetHTML('<h3>' + esc(longDate(ds)) + '</h3><div class="pv ok">මෙම දවස ' + esc(longDate(row.res.from)) + ' දින ආරම්භ වූ රාත්‍රි සේවයේ දිගුවකි. එහි ගණනය ඒ දවසේ සටහනට ඇතුළත්ය.</div>' +
        '<button class="btn block" data-a="edit" data-d="' + row.res.from + '">ඒ දවස සංස්කරණය කරන්න</button>');
      return;
    }
    const cur = DB.entries[ds];
    draft = cur ? JSON.parse(JSON.stringify(cur)) : { status: 'worked', in: '', out: '' };
    renderSheet();
  }
  function sheetHTML(html) { $('#sheet').innerHTML = html; $('#sheet').classList.add('on'); $('#scrim').classList.add('on'); }
  function closeSheet() { $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on'); }
  function renderSheet() {
    const ds = draftDate, S = DB.settings, hol = H();
    const type = OT.dayTypeOf(ds, hol);
    const wdy = type === 'weekday';
    const off = wdy ? 'leave' : 'off';
    const d = S.duty[type];
    let h = '<h3>' + esc(longDate(ds)) + '</h3><div class="mute" style="margin-bottom:10px">' + TYPE_NAME[type] + (hol[ds] ? ' · ' + esc(hol[ds]) : '') + ' · රාජකාරි ' + d.s + '–' + d.e + ' · OT ' + OT.fmtTime(OT.cutoffFor(ds, S)) + ' දක්වා</div>';
    h += '<div class="seg"><button data-a="st" data-s="worked" class="' + (draft.status === 'worked' ? 'on' : '') + '">සේවය කළා</button>' +
      '<button data-a="st" data-s="' + off + '" class="' + (draft.status === off ? 'on' : '') + '">' + (wdy ? 'නිවාඩු' : 'off day') + '</button></div>';
    if (draft.status === 'worked') {
      h += '<div class="grid2"><label class="f"><span>පැමිණීම</span>' + tsel('tin', draft.in) + '</label>' +
        '<label class="f"><span>පිටවීම' + (draft.overnight ? ' (ඊළඟ දවසේ)' : '') + '</span>' + tsel('tout', draft.out) + '</label></div>' +
        '<div class="row" style="margin:-4px 0 6px"><button class="btn alt sm" data-a="now" data-f="in">පැමිණීම = දැන්</button><button class="btn alt sm" data-a="now" data-f="out">පිටවීම = දැන්</button></div>' + tpanel() +
        '<label class="sw"><input type="checkbox" id="ovn" ' + (draft.overnight ? 'checked' : '') + '><span>රාත්‍රිය පුරා සේවය (පිටවීම ඊළඟ දවසේ)</span></label>' +
        '<label class="sw"><input type="checkbox" id="nol" ' + (draft.noLimit || draft.overnight ? 'checked' : '') + (draft.overnight ? ' disabled' : '') + '><span>අද OT වේලාව සීමාවක් නැත</span></label>' +
        '<div class="pv" id="pv"></div>';
    }
    h += '<div class="row" style="margin-top:6px"><button class="btn" style="flex:1" data-a="savedraft">සුරකින්න</button>' +
      (DB.entries[ds] ? '<button class="btn alt" data-a="cleardraft">මකන්න</button>' : '') + '<button class="btn alt" data-a="closeSheet">වසන්න</button></div>';
    sheetHTML(h);
    if (draft.status === 'worked') refreshPreview();
  }
  function refreshPreview() {
    const pv = $('#pv'); if (!pv) return;
    const ds = draftDate, hol = H();
    const type = OT.dayTypeOf(ds, hol);
    const r = OT.calcDay(draft, type, DB.settings, { cutoff: OT.cutoffFor(ds, DB.settings), nextType: OT.dayTypeOf(OT.addDays(ds, 1), hol) });
    if (r.kind === 'incomplete') { pv.className = 'pv'; pv.innerHTML = '<span class="mute">' + (draft.in || draft.out ? 'දැනට එක් වේලාවක් පමණයි. සුරකින්න, අනෙක් වේලාව පසුව ඇතුළත් කරන්න පුළුවන්.' : 'පැමිණීම සහ/හෝ පිටවීම ඇතුළත් කරන්න') + '</span>'; return; }
    const e = explain(r, type);
    pv.className = 'pv ' + e.cls;
    let extra = '';
    if (draft.overnight) extra += '<br><span class="mute">රාත්‍රි/දිගු කාලය: ' + dur(r.night) + ' (ඊළඟ දවස: ' + OT.dayTypeOf(OT.addDays(ds, 1), hol) .replace('weekday', 'සතියේ දිනය').replace('sat', 'සෙනසුරාදා').replace('sun', 'ඉරිදා').replace('holiday', 'නිවාඩු දිනය') + ')</span>';
    if (r.limited) extra += '<br><span class="mute">' + OT.fmtTime(OT.cutoffFor(ds, DB.settings)) + ' ට පසු කාලය ගණන් නොගනී.</span>';
    pv.innerHTML = e.t + extra;
  }
  function checkCapAlert(mk) {
    const sm = OT.summarize(mk, DB.entries, DB.settings, H());
    if (sm.dayCap != null && sm.allowDays > sm.dayCap) notify('විවේක දින සීමාව ඉක්මවා ඇත', 'අනුමත දින ' + sm.dayCap + ' ඉක්මවූ ' + sm.excessDays + ' දිනක් නොගෙවේ.', true);
    if (sm.capMin == null) return;
    if (sm.otMin >= sm.capMin) notify('අතිකාල සීමාව සම්පූර්ණයි', 'අනුමත ' + sm.capH + ' පැය ඉක්මවා ඇත. ඉක්මවූ ' + dur(sm.excessMin) + ' නොගෙවේ.', true);
    else if (sm.otMin >= sm.capMin * 0.9) notify('අතිකාල සීමාවට ආසන්නයි', 'ඉතිරි ' + dur(sm.capMin - sm.otMin) + ' පමණි.', true);
  }
  /* Native (APK built with Capacitor): real daily reminder, works even when the app is closed. */
  function nativeLN() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications; }
  function scheduleNative() {
    const LN = nativeLN(); if (!LN) return;
    try {
      LN.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
      if (!DB.settings.reminderOn) return;
      const t = OT.toMin(DB.settings.reminderTime);
      LN.requestPermissions().then(() => LN.schedule({ notifications: [{ id: 1, title: tr('OT ගණකය'), body: tr('අද පැමිණීම / පිටවීම සටහන් කරන්න.'), schedule: { on: { hour: Math.floor(t / 60), minute: t % 60 }, allowWhileIdle: true } }] })).catch(() => {});
    } catch (e) { /* ignore */ }
  }
  function notify(title, body, warn) {
    title = tr(title); body = tr(body);
    toast(title + ': ' + body, warn);
    const LN = nativeLN();
    if (LN) { try { LN.schedule({ notifications: [{ id: 100 + Math.floor(Math.random() * 9000), title, body, schedule: { at: new Date(Date.now() + 1000) } }] }); } catch (e) { /* ignore */ } return; }
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, icon: 'icons/icon-192.png', tag: 'ot-' + title }));
        else new Notification(title, { body });
      }
    } catch (e) { /* ignore */ }
  }

  /* ---------- vouchers ---------- */
  function snapshotFor(mk, live) {
    if (!live && DB.claims[mk]) return DB.claims[mk];
    const S = DB.settings;
    const sum = OT.summarize(mk, DB.entries, S, H());
    return { at: Date.now(), sum, profile: { name: S.name, designation: S.designation, division: S.division, station: S.station, payUnit: S.payUnit, workDesc: S.workDesc, subjectCode: S.subjectCode, salaryNo: S.salaryNo, print: JSON.parse(JSON.stringify(S.print || {})), baseSalary: S.baseSalary, otDivisor: S.otDivisor, allowanceDivisor: S.allowanceDivisor, cutoffs: S.defaultCutoff } };
  }
  function head(title, mk, p) {
    return '<h1>' + title + '</h1><h2>' + monthLabel(mk) + ' මාසය</h2><div class="meta"><b>නම:</b><span>' + esc(p.name || '………………………') + '</span><b>තනතුර:</b><span>' + esc(p.designation || '………………………') +
      '</span><b>සේවා ස්ථානය:</b><span>' + esc(p.station || p.division || '………………………') + '</span><b>මූලික වැටුප:</b><span>' + money(p.baseSalary) + '</span></div>';
  }
  function sigs() {
    return '<div class="sig"><div>අයදුම්කරුගේ අත්සන සහ දිනය</div><div>අනුමත කරන නිලධාරියාගේ අත්සන සහ දිනය</div></div>';
  }
  function otVoucher(c, mk) {
    const s = c.sum, p = c.profile;
    const rows = s.rows.filter((r) => r.res.valid && r.res.kind === 'worked' && r.res.ot > 0);
    let tb = rows.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + r.date.slice(5) + '</td><td>' + DAYS_S[wd(r.date)] + '</td><td>' + hm(r.entry.in) + '</td><td>' + hm(r.entry.out) + (r.entry.overnight ? ' (+1)' : '') +
      '</td><td>' + (r.res.morning ? dur(r.res.morning) : '–') + '</td><td>' + (r.res.evening ? dur(r.res.evening) : '–') + '</td><td><b>' + dur(r.res.ot) + '</b></td></tr>').join('');
    if (!rows.length) tb = '<tr><td colspan="8">අතිකාල සටහන් නැත</td></tr>';
    return '<div class="paper">' + head('අතිකාල දීමනා ඉල්ලුම් පත්‍රය', mk, p) +
      '<div class="scroll-x"><table><tr><th>#</th><th>දිනය</th><th>දිනය</th><th>පැමිණීම</th><th>පිටවීම</th><th>උදේ OT</th><th>හවස/රාත්‍රි OT</th><th>එකතුව</th></tr>' + tb +
      '<tr><td colspan="7" class="r"><b>මුළු අතිකාල පැය</b></td><td><b>' + dur(s.otMin) + '</b></td></tr></table></div>' +
      '<table><tr><td class="l">අනුමත මාසික උපරිම පැය</td><td class="r">' + (s.capH != null ? s.capH + ':00' : 'සීමාවක් නැත') + '</td></tr>' +
      (s.excessMin > 0 ? '<tr><td class="l">සීමාව ඉක්මවූ පැය (නොගෙවේ)</td><td class="r">' + dur(s.excessMin) + '</td></tr>' : '') +
      '<tr><td class="l"><b>ගෙවිය යුතු අතිකාල පැය</b></td><td class="r"><b>' + dur(s.payMin) + '</b></td></tr>' +
      '<tr><td class="l">පැයක අනුපාතය (' + money(p.baseSalary) + ' ÷ ' + p.otDivisor + ')</td><td class="r">' + money(s.hourly) + '</td></tr>' +
      '<tr><td class="l"><b>ගෙවිය යුතු අතිකාල මුදල</b></td><td class="r"><b>' + money(s.otAmount) + '</b></td></tr></table>' +
      '<div class="note">ඉහත අතිකාල පැය මා විසින් සේවය කරන ලද බවට සහතික කරමි.</div>' + sigs() + '</div>';
  }
  /* ---------- පොදු 35 (Gen 35) voucher: daily allowance for rest days ---------- */
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function below1000(n) {
    let s = '';
    if (n >= 100) { s += ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) s += ' and '; }
    if (n >= 20) { s += TENS[Math.floor(n / 10)]; if (n % 10) s += ' ' + ONES[n % 10]; } else if (n > 0) s += ONES[n];
    return s;
  }
  function numWords(n) {
    n = Math.floor(n);
    if (n === 0) return 'Nil';
    const parts = [];
    const m = Math.floor(n / 1e6), t = Math.floor((n % 1e6) / 1000), r = n % 1000;
    if (m) parts.push(below1000(m) + ' Million');
    if (t) parts.push(below1000(t) + ' Thousand');
    if (r) parts.push((m || t) && r < 100 ? 'and ' + below1000(r) : below1000(r));
    return parts.join(' ');
  }

  /* amount in Sinhala words */
  const SI1 = ['', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය', 'දහය', 'එකොළහ', 'දොළහ', 'දහතුන', 'දාහතර', 'පහළොව', 'දහසය', 'දාහත', 'දහඅට', 'දහනවය'];
  const SIt = ['', '', 'විස්ස', 'තිහ', 'හතළිහ', 'පනහ', 'හැට', 'හැත්තෑව', 'අසූව', 'අනූව'];
  const SIts = ['', '', 'විසි', 'තිස්', 'හතළිස්', 'පනස්', 'හැට', 'හැත්තෑ', 'අසූ', 'අනූ'];
  const SIu = ['', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය'];
  const SIh = ['', 'එක්සිය', 'දෙසිය', 'තුන්සිය', 'හාරසිය', 'පන්සිය', 'හයසිය', 'හත්සිය', 'අටසිය', 'නවසිය'];
  const SIm = ['', '', 'දෙ', 'තුන්', 'හාර', 'පන්', 'හය', 'හත්', 'අට', 'නව'];
  function siBelow100(n) {
    if (n < 20) return SI1[n];
    const t = Math.floor(n / 10), u = n % 10;
    return u ? SIts[t] + SIu[u] : SIt[t];
  }
  const SIpre = { 10: 'දස', 11: 'එකොළොස්', 12: 'දොළොස්', 13: 'දහතුන්', 14: 'දාහතර', 15: 'පහළොස්', 16: 'සොළොස්', 17: 'දාහත්', 18: 'දහඅට', 19: 'දහනව' };
  function siPre(n) { /* number as it combines before දහස් / ලක්ෂ */
    if (n < 10) return SIu[n];
    if (n < 20) return SIpre[n];
    const t = Math.floor(n / 10), u = n % 10;
    return SIts[t] + SIu[u];
  }
  function siBelow1000(n) {
    const h = Math.floor(n / 100), r = n % 100;
    if (!h) return siBelow100(r);
    if (!r) return h === 1 ? 'සියය' : SIh[h].replace('සිය', 'සිය');
    return SIh[h] + ' ' + siBelow100(r);
  }
  function siMult(n, unit) { // n of a unit (දහස / ලක්ෂ / මිලියන)
    if (n === 1) return unit === 'දහස' ? 'එක් දහස' : 'එක් ' + unit;
    if (n < 10) return (unit === 'දහස' ? SIm[n] : SIu[n] + ' ') + unit;
    return siBelow1000(n) + ' ' + unit;
  }
  function siWords(n) {
    n = Math.floor(n);
    if (n === 0) return 'ශූන්‍ය';
    const parts = [];
    const m = Math.floor(n / 1e6), l = Math.floor((n % 1e6) / 1e5), t = Math.floor((n % 1e5) / 1000), r = n % 1000;
    if (m) parts.push(siBelow1000(m) + ' මිලියන');
    if (l) parts.push((l === 1 ? 'එක්' : siPre(l)) + ' ලක්ෂ');
    if (t) parts.push(t < 10 ? (t === 1 ? 'එක් දහස' : SIm[t] + 'දහස') : siPre(t) + (r ? ' දහස්' : ' දහස'));
    if (r) parts.push(siBelow1000(r));
    let w = parts.join(' ');
    return w + 'යි';
  }
  const EDA = (css) => { const m = css && /--ed:([a-z0-9]+)/.exec(css); return m ? ' data-w="' + m[1] + '"' : ''; };
  /* saved edits of the amount-in-words text: DB.wordsOv[kind|month] = { amt, v:{key:text} } */
  const wOv = (kind, mk, key, amt, auto) => { const o = (DB.wordsOv || {})[kind + '|' + mk]; return o && o.amt === amt && o.v && o.v[key] != null ? o.v[key] : auto; };
  const g35 = { A: (x, top, txt, css) => '<div class="a"' + EDA(css) + ' style="left:' + x + 'pt;top:' + top + 'pt;' + (css || '') + '">' + esc(txt) + '</div>',
    R: (x0, x1, top, txt, css) => '<div class="a" style="left:' + x0 + 'pt;width:' + (x1 - x0) + 'pt;top:' + top + 'pt;text-align:right;' + (css || '') + '">' + esc(txt) + '</div>' };
  function g35Voucher(c, mk) {
    const s = c.sum, S = DB.settings, p = c.profile || {};
    const station = p.station != null ? p.station : S.station;
    const salNo = p.salaryNo != null ? p.salaryNo : S.salaryNo;
    const pr = Object.assign({ fx: 0, fy: 0, bx: 0, by: 0, rotBack: false }, S.print || {}, p.print || {});
    const [y, m] = mk.split('-').map(Number);
    const cd = new Date(c.at || Date.now());
    const dateTxt = cd.getFullYear() + '.' + pad(cd.getMonth() + 1) + '.';
    const days = s.allowPay != null ? s.allowPay : s.allowDays;
    const amount = OT.round2(days * s.daily);
    const rs = Math.floor(amount), cts = Math.round((amount - rs) * 100); curVoucher.amt = amount;
    const rsTxt = rs.toLocaleString('en-US'), ctsTxt = pad(cts);
    const A = g35.A, R = g35.R;
    const fmt2 = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const srows = s.allowRows || [];
    const isPHd = (ds) => { const w = new Date(ds + 'T00:00:00').getDay(); return w >= 1 && w <= 5 && !!H()[ds]; };
    const hasPH = srows.some((r) => isPHd(r.date)), hasWE = srows.some((r) => !isPHd(r.date)) || !hasPH;
    const kSi = hasPH && hasWE ? 'රජයේ ප්‍රසිද්ධ නිවාඩු දිනයන්හි හා සති අන්ත විවේක දිනයන්හි' : hasPH ? 'රජයේ ප්‍රසිද්ධ නිවාඩු දිනයන්හි' : 'සති අන්ත විවේක දිනයන්හි';
    const kEn = hasPH && hasWE ? 'public holidays and weekend off days' : hasPH ? 'public holidays' : 'weekend off days';
    const cSi = hasPH && hasWE ? 'සති විවේක හා ර.ප්‍ර.නි. දින' : hasPH ? 'ර.ප්‍ර.නි. දින' : 'සති විවේක දින';
    const desc = lg(y + ' ' + MONTHS[m - 1] + ' මස ' + kSi + ' මෙම ආයතනයේ සේවය කිරීම වෙනුවෙන්',
      'For services rendered at this institution on ' + kEn + ' in ' + MONTHS_EN[m - 1] + ' ' + y);
    /* front page (coordinates in pt, measured from the form) */
    const FSH = 108; /* form moved up so only 1.5in stays blank at the top */
    let f = '<img class="bg" src="forms/gen35-front.png" alt="" style="transform:translateY(-' + FSH + 'pt)">';
    f += '<div class="lay" style="transform:translateY(-' + FSH + 'pt)">';
    f += '<div class="a" style="left:0;width:595pt;top:186pt;text-align:center;font-size:11pt;font-weight:700">' + lg('වැටුප් අංකය - ', 'Salary No. - ') + esc(salNo || '') + '</div>';
    f += A(158, 272.3, station || '');
    f += A(118, 302.8, p.name != null ? p.name : S.name);
    f += A(76, 380, dateTxt);
    f += '<div class="a" style="left:124pt;top:378pt;width:199pt;white-space:normal;font-size:8.6pt;line-height:11.5pt">' + esc(desc) + '</div>';
    f += A(167.7, 423.5, lg('විස්තර පසු පිටේ දක්වා ඇත.', 'Details are given overleaf.'));
    f += R(185.8, 311.8, 448, lg('දින ගණන - ', 'No. of days - ') + pad(days));
    f += R(329, 380, 448, s.daily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    f += R(386, 456, 448, rsTxt) + R(462, 488, 448, ctsTxt);
    f += R(386, 456, 497, rsTxt, 'font-weight:700') + R(462, 488, 497, ctsTxt, 'font-weight:700');
    if (LANG() === 'en') f += A(140, 641, wOv('al', mk, 'ew1', amount, numWords(rs)), 'font-size:9pt;--ed:ew1') + A(202, 669, wOv('al', mk, 'ew2', amount, cts ? numWords(cts) : 'Nil'), 'font-size:9pt;--ed:ew2');
    else f += A(372, 526, wOv('al', mk, 'sw1', amount, siWords(rs)), 'font-size:9pt;--ed:sw1') + A(92, 553, wOv('al', mk, 'sw2', amount, cts ? siWords(cts) : '—'), 'font-size:9pt;--ed:sw2');
    f += '</div>';
    /* back page: table of eligible days, placed in the blank area at the top */
    const rows = (s.allowRows || []).slice(0, 32).map((r, i) => {
      let tin, tout;
      if (r.cont) { const pe = r.contEntry || (s.rows.find((x) => x.date === r.cont) || {}).entry || {}; tin = lg('පෙර දිනයෙන් දිගුව', 'Continued from previous day'); tout = hm(pe.out); }
      else { tin = hm(r.entry && r.entry.in); tout = hm(r.entry && r.entry.out); }
      return { n: i + 1, d: r.date.replace(/-/g, '.') + (isPHd(r.date) ? ' (PH)' : ''), tin, tout };
    });
    const exNote = s.excessDays > 0;
    const TTOP = 458;
    const budget = 822 - TTOP - 14 - 4 - 22 - 10;
    const ROW = 19.84; /* 7mm rows */
    const two = rows.length > 0 && Math.min(ROW, budget / (rows.length + 1)) < 16;
    const per = two ? Math.ceil(rows.length / 2) : rows.length;
    const w = two ? [22, 74, 52, 52] : [50, 120, 90, 90];
    /* 1.5in blank at the top, table below it, the printed clauses start right under the table (moved up as far as possible) */
    const rowH = Math.min(ROW, Math.floor((budget / (per + 1)) * 10) / 10);
    const fs = rowH >= 16 ? 9 : Math.max(6.2, Math.round(rowH * 0.5 * 10) / 10);
    const tblH = rows.length ? rowH * (per + 1) : 12;
    const HH = 14 + tblH + 4 + 22 + (exNote ? 10 : 0);
    const BDY = -198.4; /* printed clauses moved up 70mm; table and the two lines go below them */
    const tbl = (rs2) => '<table class="g35t" style="font-size:' + fs + 'pt;--lh:' + (rowH - 2) + 'pt"><colgroup>' + w.map((x) => '<col style="width:' + x + 'pt">').join('') + '</colgroup><tr><th>' + lg('අනු අංකය', 'Serial No.') + '</th><th>' + lg('දිනය', 'Date') + '</th><th>' + lg('පැමිණීම', 'Arrival') + '</th><th>' + lg('පිටවීම', 'Departure') + '</th></tr>' +
      rs2.map((r) => '<tr><td>' + r.n + '</td><td>' + r.d + '</td><td>' + esc(r.tin) + '</td><td>' + esc(r.tout) + '</td></tr>').join('') + '</table>';
    let b = '<img class="bg" src="forms/gen35-back.png" alt="" style="transform:translateY(' + BDY.toFixed(1) + 'pt)">';
    b += '<div class="lay"><div class="a" style="left:110pt;top:' + TTOP + 'pt;white-space:normal">' +
      '<div style="font-size:8.5pt;font-weight:700;margin-bottom:3pt">' + lg('සේවය කළ දින විස්තරය – ' + y + ' ' + MONTHS[m - 1], 'Details of days worked – ' + MONTHS_EN[m - 1] + ' ' + y) + '</div>' +
      (rows.length ? '<div style="display:flex;gap:10pt;align-items:flex-start">' + (two ? tbl(rows.slice(0, per)) + tbl(rows.slice(per)) : tbl(rows)) + '</div>' : '<div style="font-size:8.5pt">' + lg('දීමනා සඳහා සුදුසු දින නැත', 'No eligible days') + '</div>') +
      '<div style="font-size:8.5pt;line-height:11pt;margin-top:4pt;white-space:nowrap">' + lg('මූලික වැටුප - රු. ', 'Basic salary - Rs. ') + fmt2(p.baseSalary != null ? p.baseSalary : S.baseSalary) + '&emsp;' + lg('දිනක වැටුප - රු. ', 'Daily rate - Rs. ') + fmt2(s.daily) +
      '<br>' + lg('සේවය කල ' + cSi + ' ගණන - ', 'No. of ' + kEn + ' worked - ') + pad(days) + '&emsp;' + lg('ඉල්ලන මුදල - රු. ', 'Amount claimed - Rs. ') + fmt2(amount) + '</div>' +
      (exNote ? '<div style="font-size:7.5pt;margin-top:2pt">' + lg('සේවය කළ දින ', 'Days worked ') + s.allowDays + lg(' · අනුමත දින ', ' · Approved days ') + (s.dayCap != null ? s.dayCap : '') + lg(' (ගෙවන දින ', ' (Days payable ') + days + ')</div>' : '') + '</div></div>';
    return '<div class="pgw"><div class="pg35">' + f + '</div><div class="pg35' + '' + '">' + b + '</div></div>';
  }
  function scaleG35() {
    const z = Math.min(1, (window.innerWidth - 16) / (595.28 * 4 / 3));
    document.querySelectorAll('.pg35').forEach((e) => { e.style.zoom = z; });
  }
  window.addEventListener('resize', scaleG35);

  /* ---------- පොදු 35 අ (Gen 35a) overtime voucher: full form printed on blank A4 ---------- */
  function fmtHrs(min) { return String(Math.round(min / 60 * 100) / 100); }
  function otRows(s) {
    const out = [];
    for (const r of s.rows) {
      const res = r.res;
      if (!res || !res.valid) continue;
      if (res.kind === 'worked') {
        const e = r.entry || {};
        if (res.overnight) {
          const post = res.post || 0;
          const pre = res.splitNext != null ? res.ot : res.ot - post;
          if (pre > 0) out.push({ date: r.date, in: e.in, out: '24:00', min: pre });
          if (res.splitNext == null && post > 0) out.push({ date: OT.addDays(r.date, 1), in: '00:00', out: e.out, min: post });
        } else if (res.ot > 0) { const to = e.otTo && OT.toMin(e.otTo) < OT.toMin(e.out) ? e.otTo : e.out; out.push({ date: r.date, in: e.in, out: to, min: res.ot }); }
      } else if (res.kind === 'cont' && res.ot > 0) {
        out.push({ date: r.date, in: '00:00', out: (res.contEntry || {}).out, min: res.ot });
      }
    }
    return out;
  }
  const FM = { TS: 8.28, topcuts: [[164.88, 2.52], [177.12, 3.24], [189.36, 3.24], [324.0, 2.88], [338.76, 2.88]],
    botcuts: [[731.88, 1.8], [743.4, 1.44], [753.12, 1.08], [762.48, 2.52], [783.72, 1.08]], BT: 388.8, BH: 355.32, DBH: 53.64, topTotal: 14.76 };
  const mapTop = (y) => y - FM.TS - FM.topcuts.reduce((a, c) => a + (c[0] <= y ? c[1] : 0), 0);
  const mapBot = (y) => y - FM.TS - FM.topTotal + FM.DBH - FM.botcuts.reduce((a, c) => a + (c[0] <= y ? c[1] : 0), 0);
  function g35aVoucher(c, mk) {
    const s = c.sum, S = DB.settings, p = c.profile || {};
    const [y, m] = mk.split('-').map(Number);
    const hol = H();
    const rows = otRows(s);
    const BT = FM.BT, BH = FM.BH, PER = 31, MINL = 18;
    const A = g35.A;
    const fmt2 = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tag = (ds) => { const w = new Date(ds + 'T00:00:00').getDay(); return w === 6 ? 'SA' : w === 0 ? 'SU' : hol[ds] ? 'PH' : ''; };
    const station = p.station != null ? p.station : S.station;
    const wdesc = p.workDesc != null ? p.workDesc : S.workDesc;
    const scode = p.subjectCode != null ? p.subjectCode : S.subjectCode;
    const salNo = p.salaryNo != null ? p.salaryNo : S.salaryNo;
    const codeLine = scode ? lg(scode + ' විෂයයට අයත් රාජකාරි', 'Duties under subject ' + scode) : '';
    const payUnit = p.payUnit != null ? p.payUnit : S.payUnit;
    const lastDay = new Date(y, m, 0).getDate();
    const cd = new Date(c.at || Date.now());
    const dateTxt = cd.getFullYear() + '.' + pad(cd.getMonth() + 1) + '.';
    const amount = s.otAmount;
    const rs = Math.floor(amount), cts = Math.round((amount - rs) * 100); curVoucher.amt = amount;
    const C = (x0, x1, top, txt, css) => '<div class="a" style="left:' + x0 + 'pt;width:' + (x1 - x0) + 'pt;top:' + top.toFixed(2) + 'pt;text-align:center;' + (css || '') + '">' + esc(txt) + '</div>';
    const At = (x, y0, txt, css) => A(x, +mapTop(y0).toFixed(2), txt, css);
    const Ab = (x, y0, txt, css) => A(x, +mapBot(y0).toFixed(2), txt, css);
    const chunks = [];
    for (let i = 0; i < Math.max(rows.length, 1); i += PER) chunks.push(rows.slice(i, i + PER));
    const pages = chunks.map((ch, ci) => {
      const last = ci === chunks.length - 1;
      const L = Math.max(MINL, ch.length), pitch = BH / L;
      let f = '<img class="bg" src="forms/gen35a-1.png" alt="">';
      f += '<div class="lay">';
      f += C(0, 595, 15, lg('වැටුප් අංකය - ', 'Salary No. - ') + (salNo || ''), 'font-size:11pt');
      if (chunks.length > 1) f += '<div class="a" style="left:430pt;width:120pt;text-align:right;top:10pt;font-size:8pt">' + lg('පිටුව ', 'Page ') + (ci + 1) + ' / ' + chunks.length + '</div>';
      /* A. authorisation */
      f += At(166.5, 78, p.name != null ? p.name : S.name, 'width:165pt;overflow:hidden');
      { const dg = String(p.designation != null ? p.designation : S.designation || ''); const two = dg.length > 20;
        f += two ? At(430, 82, dg, 'width:124pt;white-space:normal;line-height:8.8pt;font-size:8pt;overflow:hidden;height:18pt') : At(430, 83, dg, 'width:122pt;overflow:hidden'); }
      f += At(158, 112, station || '', 'width:170pt;overflow:hidden');
      f += At(412, 110, LANG() === 'en' ? tr(payUnit || '') : (payUnit || ''), 'width:135pt;overflow:hidden');
      f += At(158, 142.5, fmt2(p.baseSalary != null ? p.baseSalary : S.baseSalary));
      f += At(446, 140.5, fmt2(s.hourly));
      const sm = pad(m);
      f += C(47.9, 73.1, mapTop(278), String(y), 'font-size:7.5pt') + C(47.9, 73.1, mapTop(295.5), sm + '.01', 'font-size:7.5pt');
      f += C(73.1, 100.4, mapTop(278), String(y), 'font-size:7.5pt') + C(73.1, 100.4, mapTop(295.5), sm + '.' + pad(lastDay), 'font-size:7.5pt');
      if (s.capH != null) f += C(100.4, 169.9, mapTop(279), String(s.capH));
      if (codeLine) f += C(169.9, 369.7, mapTop(287), codeLine, 'font-size:8.6pt');
      /* 7. table body */
      for (let i = 1; i < L; i++) f += '<div style="position:absolute;left:47.9pt;width:171pt;top:' + (BT + i * pitch).toFixed(2) + 'pt;border-top:.6pt dotted #000"></div>';
      const fs = Math.min(9, Math.round(pitch * 0.62 * 10) / 10);
      ch.forEach((r, i) => {
        const top = BT + i * pitch;
        const row = 'top:' + top.toFixed(2) + 'pt;height:' + pitch.toFixed(2) + 'pt;line-height:' + pitch.toFixed(2) + 'pt;font-size:' + fs + 'pt;';
        const cell = (x0, x1, tx) => '<div class="a" style="left:' + x0 + 'pt;width:' + (x1 - x0) + 'pt;text-align:center;' + row + '">' + esc(tx) + '</div>';
        const tg = tag(r.date);
        if (tg) f += '<div class="a" style="left:27pt;width:19.5pt;text-align:right;' + row + '">' + tg + '</div>';
        f += cell(47.9, 96.5, r.date.replace(/-/g, '.')) + cell(96.5, 132.8, hm(r.in)) + cell(132.8, 166.7, hm(r.out)) + cell(166.7, 218.9, fmtHrs(r.min));
      });
      /* (d) description once, with a brace spanning all the day rows */
      const dtxt = (codeLine ? '<b>' + esc(codeLine) + '</b>' + (wdesc ? '\n' : '') : '') + esc(wdesc || '');
      if (dtxt) {
        const bh = Math.max(ch.length, 1) * pitch - 2;
        f += '<svg style="position:absolute;left:220.5pt;top:' + (BT + 1).toFixed(2) + 'pt;width:6pt;height:' + bh.toFixed(2) + 'pt" viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M0.5 0.5 Q5 0.5 5 8 L5 42 Q5 50 9.5 50 Q5 50 5 58 L5 92 Q5 99.5 0.5 99.5" fill="none" stroke="#000" stroke-width="1.1" vector-effect="non-scaling-stroke"/></svg>';
        f += '<div class="a fitbox" data-fit="8.2" style="left:229pt;top:' + (BT + 2).toFixed(2) + 'pt;width:138pt;height:' + (BH - 6).toFixed(2) + 'pt;white-space:pre-wrap;font-size:8.2pt;line-height:1.25;overflow:hidden">' + dtxt + '</div>';
      }
      /* (e) units sentence, three lines */
      f += '<div class="a" style="left:371pt;width:69pt;top:' + (BT + 3).toFixed(2) + 'pt;text-align:center;font-size:7.2pt;line-height:9.4pt">' + lg('මාසයට අදාල<br>වැඩ ඒකක සියල්ල<br>අවසන් කර ඇත', 'All units of work<br>for the month have<br>been completed') + '</div>';
      /* total, 8, 9 */
      const sub = ch.reduce((a, r) => a + r.min, 0);
      f += C(166.7, 218.9, mapBot(717.5), fmtHrs(last ? s.otMin : sub), 'font-weight:700');
      if (!last) f += Ab(222, 717.5, lg('(ඉදිරියට – ඊළඟ පිටුව බලන්න)', '(continued – see next page)'), 'font-size:8pt');
      else {
        const words = LANG() === 'en' ? 'Rupees ' + numWords(rs) + (cts ? ' and cents ' + numWords(cts) : '') + ' only' : 'රුපියල් ' + siWords(rs) + (cts ? ' ශත ' + siWords(cts) : '');
        f += Ab(232, 740, wOv('ot', mk, 'aw', amount, words + '  (' + lg('රු. ', 'Rs. ') + fmt2(amount) + ')'), 'font-size:8.6pt;width:318pt;white-space:nowrap;overflow:hidden;--ed:aw');
        f += Ab(439, 780, dateTxt);
      }
      f += '</div>';
      return '<div class="pg35">' + f + '</div>';
    });
    pages.push('<div class="pg35"><img class="bg" src="forms/gen35a-2.png" alt=""></div>');
    return '<div class="pgw">' + pages.join('') + '</div>';
  }
  function fitAll() {
    document.querySelectorAll('[data-fit]').forEach((el) => {
      let fs = parseFloat(el.dataset.fit) || 8; el.style.fontSize = fs + 'pt';
      let n = 0;
      while (el.scrollHeight > el.clientHeight + 1 && fs > 4.5 && n++ < 40) { fs -= 0.3; el.style.fontSize = fs.toFixed(1) + 'pt'; }
    });
  }

  /* ---------- A4 PDF export (no print dialog needed) ---------- */
  async function toDataURL(url) {
    const r = await fetch(url); const b = await r.blob();
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
  }
  async function pageCss() {
    let css = '';
    for (const sh of Array.from(document.styleSheets)) { try { for (const r of Array.from(sh.cssRules)) if (r.type !== 7 || true) css += r.cssText + '\n'; } catch (e) {} }
    const urls = Array.from(new Set((css.match(/url\(["']?(?!data:)[^)"']+["']?\)/g) || [])));
    for (const u of urls) { const p = u.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''); try { css = css.split(u).join('url(' + await toDataURL(p) + ')'); } catch (e) {} }
    return css;
  }
  async function pageToJpeg(pg, css) {
    const cl = pg.cloneNode(true);
    cl.style.cssText = 'width:210mm;height:297mm;margin:0;box-shadow:none;transform:none;zoom:1;position:relative;overflow:hidden;background:#fff';
    cl.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
    for (const im of Array.from(cl.querySelectorAll('img'))) { const src = im.getAttribute('src'); if (src && !src.startsWith('data:')) im.setAttribute('src', await toDataURL(src)); }
    const W = 794, Hh = 1123;
    const xml = new XMLSerializer().serializeToString(cl);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + Hh + '"><foreignObject x="0" y="0" width="' + W + '" height="' + Hh + '"><div xmlns="http://www.w3.org/1999/xhtml"><style><![CDATA[' + css + ']]></style>' + xml + '</div></foreignObject></svg>';
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('render')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = Hh * 2;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
    const b64 = cv.toDataURL('image/jpeg', 0.92).split(',')[1];
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return { u8, w: cv.width, h: cv.height };
  }
  function buildPdf(imgs) {
    const enc = new TextEncoder(), parts = [], off = []; let len = 0;
    const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { off[n] = len; put(n + ' 0 obj\n'); put(body); put('\nendobj\n'); };
    put('%PDF-1.4\n');
    const N = imgs.length, kids = imgs.map((_, i) => (3 + i * 3) + ' 0 R').join(' ');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + N + ' >>');
    imgs.forEach((im, i) => {
      const p = 3 + i * 3, c = p + 1, x = p + 2;
      obj(p, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ' + x + ' 0 R >> >> /Contents ' + c + ' 0 R >>');
      const cs = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
      obj(c, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
      off[x] = len; put(x + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.u8.length + ' >>\nstream\n'); put(im.u8); put('\nendstream\nendobj\n');
    });
    const total = 3 + N * 3, xr = len;
    let t = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let i = 1; i < total; i++) t += String(off[i]).padStart(10, '0') + ' 00000 n \n';
    put(t + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }
  async function savePdf(name) {
    toast(lg('PDF සකසමින්… ටිකක් රැඳී සිටින්න', 'Preparing PDF… please wait'));
    try {
      const css = await pageCss();
      const pages = Array.from(document.querySelectorAll('#voucher .pg35')), imgs = [];
      for (const pg of pages) imgs.push(await pageToJpeg(pg, css));
      const blob = buildPdf(imgs), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast(lg('PDF එක සුරැකිණි (Downloads)', 'PDF saved (Downloads)'));
    } catch (e) { toast(lg('PDF සෑදීමට නොහැකි විය – "මුද්‍රණය" භාවිතා කරන්න', 'Could not create PDF – use "Print"'), true); }
  }

  let curVoucher = { kind: '', mk: '' };
  function showVoucher(kind, mk, live) {
    curVoucher = { kind, mk, live };
    const c = snapshotFor(mk, live);
    $('#voucher').innerHTML = '<div class="tb"><button class="btn gold sm" data-a="pdf">' + lg('📄 PDF සුරකින්න (A4)', '📄 Save PDF (A4)') + '</button><button class="btn alt sm" style="color:#fff;border-color:#fff" data-a="print">' + lg('🖨 මුද්‍රණය', '🖨 Print') + '</button>' +
            '<button class="btn alt sm" style="color:#fff;border-color:#fff" data-a="closeVoucher">වසන්න</button></div>' +
      '<div class="edhint"><button class="btn sm" data-a="chkwords">🔍 ' + lg('මුදල ඉලක්කමෙන් තිබෙන ආකාරය පරීක්‍ෂා කරන්න', 'Check how the amount is written') + '</button></div>' +
      (kind === 'ot' ? g35aVoucher(c, mk) : g35Voucher(c, mk));
    $('#voucher').classList.add('on');
    $('#voucher').classList.remove('nobg');
    scaleG35(); fitAll();
  }

  /* ---------- actions ---------- */
  function setPath(path, val) {
    const ks = path.split('.'); let o = DB.settings;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = val;
  }
  function shiftMonth(n) {
    const [y, m] = view.month.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    view.month = d.getFullYear() + '-' + pad(d.getMonth() + 1);
  }
  const A = {
    tpsel(el) { tpTarget = el.dataset.id; tpStage = 'h'; tpRender(); },
    tph(el) { const [, m] = tpCur(tpTarget); setT(tpTarget, el.dataset.v + ':' + (m || '00')); tpStage = 'm'; tpRender(); },
    tpm(el) { const [h] = tpCur(tpTarget); setT(tpTarget, (h || '08') + ':' + el.dataset.v); tpClose(); },
    tpback() { tpStage = 'h'; tpRender(); },
    tpclose() { tpClose(); },
    tpclear() { setT(tpTarget, ''); tpClose(); },
    tab(el) { if (view.tab === 'settings' && guardLeave()) return; view.tab = el.dataset.t; closeSheet(); render(); window.scrollTo(0, 0); },
    savenext() {
      if (capGuard()) return;
      const S = DB.settings;
      if (!Number(S.baseSalary) && !S.otRate) { view.st = 'me'; render(); return toast(lg('මූලික වැටුප ඇතුළත් කරන්න', 'Enter the basic salary'), true); }
      S.locked = true; view.dirty = false; save();
      view.tab = 'home'; render(); window.scrollTo(0, 0); toast(lg('සුරැකිණි – සැකසුම් ලොක් කළා', 'Saved – settings locked'));
    },
    snav(el) {
      if (guardLeave()) return;
      const i = STABS.findIndex((x) => x[0] === (view.st || 'me')) + Number(el.dataset.d);
      if (i >= 0 && i < STABS.length) { view.st = STABS[i][0]; render(); window.scrollTo(0, 0); }
    },
    viewsum() { view.tab = 'month'; render(); const e = document.getElementById('mSum'); if (e) e.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); },
    unlock() { DB.settings.locked = false; save(); render(); },
    stab(el) { if (guardLeave()) return; view.st = el.dataset.s; render(); window.scrollTo(0, 0); },
    helpna() { toast('සකස් කර අවසන් නැත, පසුව උත්සාහ කරන්න', true); view.tab = 'home'; render(); window.scrollTo(0, 0); },
    setlang(el) { if (!EN_ON) return; DB.settings.lang = el.dataset.l === 'en' ? 'en' : 'si'; save(); location.reload(); },
    prev() { shiftMonth(-1); render(); },
    next() { shiftMonth(1); render(); },
    edit(el) { openEditor(el.dataset.d); },
    closeSheet,
    togcal() { view.showCal = !view.showCal; render(); },
    gotoday() { view.month = todayStr().slice(0, 7); render(); },
    addcap() {
      const m = $('#capm').value, hv = $('#caph').value, dv = $('#capd').value;
      if (!/^\d{4}-\d{2}$/.test(m)) return toast('මාසයක් තෝරන්න', true);
      const S = DB.settings; S.monthCaps = S.monthCaps || {}; S.monthDayCaps = S.monthDayCaps || {};
      if (hv === '') delete S.monthCaps[m]; else S.monthCaps[m] = Number(hv) === 0 ? 'none' : Number(hv);
      if (dv === '') delete S.monthDayCaps[m]; else S.monthDayCaps[m] = Number(dv) === 0 ? 'none' : Number(dv);
      view.capDirty = false; save(); render(); toast('සීමාව සුරකිණි');
    },
    nocap(el) {
      const m = $('#capm').value;
      if (!/^\d{4}-\d{2}$/.test(m)) return toast('මාසයක් තෝරන්න', true);
      const S = DB.settings; S.monthCaps = S.monthCaps || {}; S.monthDayCaps = S.monthDayCaps || {};
      (el.dataset.t === 'h' ? S.monthCaps : S.monthDayCaps)[m] = 'none';
      view.capDirty = false; save(); render(); toast((el.dataset.t === 'h' ? 'OT පැය' : 'විවේක දින') + ' සීමාව ඉවත් කළා');
    },
    quick(el) {
      const t = todayStr(), n = new Date(), v = pad(n.getHours()) + ':' + pad(n.getMinutes());
      const e = DB.entries[t] || { status: 'worked', in: '', out: '' };
      e.status = 'worked'; e[el.dataset.f] = v;
      if (e.in && e.out) {
        const r = OT.calcDay(e, OT.dayTypeOf(t, H()), DB.settings, { cutoff: OT.cutoffFor(t, DB.settings), nextType: 'weekday' });
        if (!r.valid) return toast('පිටවීම පැමිණීමට පසු විය යුතුය. රාත්‍රි සේවයක් නම් "වෙනත් වේලාවක්" භාවිතා කරන්න', true);
      }
      DB.entries[t] = e; save(); render(); toast((el.dataset.f === 'in' ? 'පැමිණීම ' : 'පිටවීම ') + v + ' සුරකිණි');
      checkCapAlert(t.slice(0, 7));
    },
    delcap(el) { delete DB.settings.monthCaps[el.dataset.k]; delete DB.settings.monthDayCaps[el.dataset.k]; save(); render(); },
    st(el) { draft.status = el.dataset.s; if (draft.status !== 'worked') { delete draft.in; delete draft.out; delete draft.overnight; delete draft.noLimit; } renderSheet(); },
    now(el) {
      const n = new Date(); const v = pad(n.getHours()) + ':' + pad(n.getMinutes());
      draft[el.dataset.f] = v; setT(el.dataset.f === 'in' ? 'tin' : 'tout', v);
    },
    savedraft() {
      if (draft.status === 'worked') {
        if (!draft.in && !draft.out) return toast('පැමිණීම හෝ පිටවීම ඇතුළත් කරන්න', true);
        if (draft.in && draft.out) {
          const r = OT.calcDay(draft, OT.dayTypeOf(draftDate, H()), DB.settings, { cutoff: OT.cutoffFor(draftDate, DB.settings), nextType: 'weekday' });
          if (!r.valid) return toast('වේලාවන් නිවැරදි කරන්න', true);
        }
      }
      DB.entries[draftDate] = draft; save(); closeSheet(); render(); toast('සුරකිණි');
      checkCapAlert(draftDate.slice(0, 7));
    },
    cleardraft() { delete DB.entries[draftDate]; save(); closeSheet(); render(); },
    claim() { if (spRelevant(SUM())) spPopup(false); else A.claimgo(); },
    spmanual() { spPopup(true); },
    claimgo() {
      const p = document.getElementById('spop'); if (p) p.remove();
      const sm = SUM();
      const inc = sm.rows.filter((r) => r.res.kind === 'incomplete').length;
      if (!confirmT((inc ? '⚠ අසම්පූර්ණ දින ' + inc + ' ක් ඇත (පැමිණීම හෝ පිටවීම නැත). ඒවා ගණනයට ඇතුළත් නොවේ.\n\n' : '') + monthLabel(view.month) + ' සඳහා හිමිකම තහවුරු කර සුරකින්නද?\nOT ' + dur(sm.payMin) + ' (' + money(sm.otAmount) + '), දීමනා දින ' + sm.allowDays + ' (' + money(sm.allowAmount) + ')')) return;
      DB.claims[view.month] = snapshotFor(view.month, true); save(); toast('ඉල්ලීම සුරැකිණි'); view.tab = 'claims'; render();
    },
    voucher(el) {
      const k = el.dataset.m;
      if (!el.dataset.live && DB.claims[k] && claimStale(k)) {
        if (!confirmT('කලින් සැකසූ වවුචරයකි, යාවත්කාලීන කරන්නද?')) return;
        DB.claims[k] = snapshotFor(k, true); save(); render();
      }
      showVoucher(el.dataset.k, k, !!el.dataset.live);
    },
    spopen() { spPopup(true); },
    spclose() { const p = document.getElementById('spop'); if (p) p.remove(); },
    spset(el) {
      const v = el.dataset.v, ds = Array.from(document.querySelectorAll('#spop .spck:checked')).map((x) => x.value);
      if (!ds.length) return toast('දවස් ටික් කරන්න', true);
      const typ = (d) => OT.dayTypeOf(d, H());
      let skipped = 0;
      ds.forEach((d) => {
        const e = DB.entries[d]; if (!e) return;
        if ((v === 'comp' || v === 'allot') && typ(d) === 'weekday') { skipped++; return; }
        if ((v === 'am' || v === 'pm') && typ(d) !== 'weekday') { skipped++; return; }
        if (v) e.special = v; else delete e.special;
      });
      save(); render(); spPopup(true);
      if (skipped) toast('සතියේ දවස් වලට මේ විකල්පය අදාල නෑ (' + skipped + ')', true);
    },
    gotoclaim(el) {
      if (el && el.dataset && el.dataset.m) view.month = el.dataset.m;
      view.tab = 'month'; render();
      const b = document.querySelector('[data-a=claim]');
      if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.style.outline = '4px solid #e8b53a'; setTimeout(() => { b.style.outline = ''; }, 1800); }
    },
    closeVoucher() { $('#voucher').classList.remove('on'); },
    chkwords() {
      const els = Array.from(document.querySelectorAll('#voucher [data-w]'));
      let p = document.getElementById('wpop'); if (p) p.remove();
      p = document.createElement('div'); p.id = 'wpop';
      p.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px';
      const amt = curVoucher.amt || 0;
      let o = '<div style="background:#fff;color:#111;border-radius:18px;padding:16px;width:100%;max-width:420px;max-height:92vh;overflow:auto"><div style="opacity:.6">' + lg('ඉලක්කමෙන්', 'In figures') + '</div><div style="font-size:34px;font-weight:800;margin:2px 0 12px">' + lg('රු. ', 'Rs. ') + Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</div><div style="opacity:.6">' + lg('අකුරින්', 'In words') + '</div>';
      els.forEach((e) => { o += '<div class="wtx" data-k="' + e.dataset.w + '" style="font-size:21px;line-height:1.5;font-weight:600;margin:4px 0 8px;padding:8px;border:1px solid #ccc;border-radius:10px">' + e.innerText.replace(/\s+/g, ' ').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>'; });
      o += '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn gold" data-a="wok">✔ ' + lg('නිවැරදියි', 'Correct') + '</button><button class="btn alt" data-a="wedit">✎ ' + lg('වෙනස් කරන්න', 'Edit') + '</button></div></div>';
      p.innerHTML = o; document.body.appendChild(p);
    },
    wok() { const p = document.getElementById('wpop'); if (p) p.remove(); },
    wedit() {
      document.querySelectorAll('#wpop .wtx').forEach((d) => { const t = document.createElement('textarea'); t.dataset.k = d.dataset.k; t.rows = 2; t.style.cssText = 'width:100%;font-size:18px;margin:4px 0 8px'; t.value = d.textContent; d.replaceWith(t); });
      document.querySelector('#wpop .row').innerHTML = '<button class="btn gold" data-a="wsave">💾 ' + lg('සුරකින්න', 'Save') + '</button><button class="btn alt" data-a="wok">' + lg('අවලංගු', 'Cancel') + '</button>';
    },
    wsave() {
      const v = {}; document.querySelectorAll('#wpop textarea').forEach((t) => { v[t.dataset.k] = t.value.replace(/\s+/g, ' ').trim(); });
      DB.wordsOv = DB.wordsOv || {}; DB.wordsOv[curVoucher.kind + '|' + curVoucher.mk] = { amt: curVoucher.amt, v }; save();
      document.getElementById('wpop').remove(); showVoucher(curVoucher.kind, curVoucher.mk, curVoucher.live); toast(lg('සුරැකිණි', 'Saved'));
    },
    print() { window.print(); },
    pdf() { savePdf((curVoucher.kind === 'ot' ? 'Gen35A-' : 'Gen35-') + curVoucher.mk + '.pdf'); },
    togbg() { $('#voucher').classList.toggle('nobg'); },
    delclaim(el) { if (confirmT('මෙම සුරැකි වවුචරය ඉවත් කරන්නද?')) { delete DB.claims[el.dataset.m]; if (DB.wordsOv) { delete DB.wordsOv['ot|' + el.dataset.m]; delete DB.wordsOv['al|' + el.dataset.m]; } save(); render(); } },
    addlim() { DB.settings.limits.push({ from: view.month + '-01', to: view.month + '-28', time: '22:00' }); save(); render(); },
    dellim(el) { DB.settings.limits.splice(+el.dataset.i, 1); save(); render(); },
    hy(el) { view.hy = +el.dataset.y; render(); },
    addhol() {
      const d = $('#hd').value, n = $('#hn').value.trim() || 'විශේෂ නිවාඩු දිනය';
      if (!d) return toast('දිනයක් තෝරන්න', true);
      DB.settings.holidayExtra[d] = n; DB.settings.holidayRemoved = DB.settings.holidayRemoved.filter((x) => x !== d);
      save(); render(); toast('නිවාඩු දිනය එක් කළා');
    },
    delhol(el) { delete DB.settings.holidayExtra[el.dataset.d]; save(); render(); },
    remhol(el) { DB.settings.holidayRemoved.push(el.dataset.d); save(); render(); },
    resthol(el) { DB.settings.holidayRemoved = DB.settings.holidayRemoved.filter((x) => x !== el.dataset.d); save(); render(); },
    install() { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; } },
    notif() {
      if (!('Notification' in window)) return toast('මෙම බ්‍රවුසරය දැනුම්දීම් සඳහා සහාය නොදක්වයි', true);
      Notification.requestPermission().then((p) => toast(p === 'granted' ? 'දැනුම්දීම් සක්‍රියයි' : 'අවසරය ලැබුණේ නෑ', p !== 'granted'));
    },
    backup() {
      const a = document.createElement('a'); a.href = URL.createObjectURL(backupBlob());
      a.download = 'OT-backup-' + todayStr() + '.json'; document.body.appendChild(a); a.click(); a.remove();
      DB.settings.lastBackup = Date.now(); save();
      toast(lg('උපස්ථය Downloads වලට සුරැකිණි. පරණ උපස්ථ ගොනු අතින් මකන්න (අලුත්ම 5ක් පමණක් තබා ගන්න).', 'Backup saved to Downloads. Delete old backup files by hand (keep only the newest 5).'));
      render();
    },
    async backupshare() {
      const f = new File([backupBlob()], 'OT-backup-' + todayStr() + '.json', { type: 'application/json' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'OT backup' }); DB.settings.lastBackup = Date.now(); save(); render(); }
        else A.backup();
      } catch (e) { /* cancelled */ }
    },
    backuplater() { DB.settings.backupSnooze = todayStr(); save(); render(); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (el && A[el.dataset.a]) { e.preventDefault(); A[el.dataset.a](el); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.id === 'restore') {
      const f = el.files[0]; if (!f) return;
      f.text().then((t) => {
        try {
          const j = JSON.parse(t); const d = j.data || j;
          if (!d.entries && !d.settings) throw new Error('bad');
          if (!confirmT('දැනට ඇති දත්ත ප්‍රතිස්ථාපන ගොනුවෙන් ආදේශ කරන්නද?')) return;
          DB = { settings: OT.mergeSettings(d.settings), entries: d.entries || {}, claims: d.claims || {}, wordsOv: d.wordsOv || {} }; DB.settings.locked = false; view.dirty = true; view.capDirty = false; save(); render(); toast('ප්‍රතිස්ථාපනය සම්පූර්ණයි – SAVE කරන්න');
        } catch (err) { toast('ගොනුව වැරදියි', true); }
      });
      return;
    }
    if (el.id === 'capm') {
      const S = DB.settings, k = el.value;
      $('#caph').value = S.monthCaps && S.monthCaps[k] != null ? S.monthCaps[k] : '';
      $('#capd').value = S.monthDayCaps && S.monthDayCaps[k] != null ? (S.monthDayCaps[k] === 'none' ? 0 : S.monthDayCaps[k]) : '';
      view.capDirty = false;
      return;
    }
    const c = el.dataset.c;
    if (c === 'set') {
      let v = el.value;
      if (el.type === 'number') v = v === '' ? 0 : Number(v);
      if (el.type === 'checkbox') v = el.checked;
      setPath(el.dataset.p, v);
      if (el.dataset.p === 'otRate') {
        const S = DB.settings, dv = document.querySelector('[data-p=otDivisor]');
        if (v > 0) { if (S.otDivisor) S.otDivisorPrev = S.otDivisor; S.otDivisor = 0; } else if (!S.otDivisor) S.otDivisor = S.otDivisorPrev || 240;
        if (dv) dv.value = S.otDivisor;
      }
      view.dirty = true; save();
      if (el.dataset.p === 'reminderTime') scheduleNative();
    } else if (c === 'desig') {
      const o = el.value === '__o'; document.getElementById('desOther').style.display = o ? 'block' : 'none';
      if (!o) setPath('designation', el.value); else if (DESIGS.indexOf(DB.settings.designation) >= 0) { setPath('designation', ''); const i = document.querySelector('[data-p=designation]'); if (i) i.value = ''; }
      view.dirty = true; save();
    } else if (c === 'lim') { DB.settings.limits[+el.dataset.i][el.dataset.f] = el.value; view.dirty = true; save(); }
    else if (c === 'spot' || c === 'splv') { const e = DB.entries[el.dataset.d]; if (e) { const k = c === 'spot' ? 'otTo' : 'lvOverride'; if (el.value) e[k] = el.value; else delete e[k]; save(); render(); spPopup(true); } }
    else if (c === 'rem') { DB.settings.reminderOn = el.checked; view.dirty = true; save(); scheduleNative(); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.id === 'caph' || el.id === 'capd') view.capDirty = true;
    if (!draft) return;
    if (el.dataset && el.dataset.tp) {
      const w = el.parentNode, hv = w.querySelector('[data-tp=h]').value, mv = w.querySelector('[data-tp=m]').value;
      const v = hv ? hv + ':' + mv : '';
      w.querySelector('input[type=hidden]').value = v;
      if (el.dataset.f === 'tin') draft.in = v; else draft.out = v;
      refreshPreview(); return;
    }
    if (el.id === 'tin') { draft.in = el.value; refreshPreview(); }
    else if (el.id === 'tout') { draft.out = el.value; refreshPreview(); }
    else if (el.id === 'ovn') { draft.overnight = el.checked; if (el.checked) draft.noLimit = true; renderSheet(); }
    else if (el.id === 'nol') { draft.noLimit = el.checked; refreshPreview(); }
  });

  /* ---------- reminders (while app is open) ---------- */
  let lastRem = '';
  function reminderTick() {
    const S = DB.settings;
    if (!S.reminderOn) return;
    const n = new Date(); const t = todayStr();
    if (DB.entries[t]) return;
    if (n.getHours() * 60 + n.getMinutes() >= OT.toMin(S.reminderTime) && lastRem !== t) {
      lastRem = t;
      notify('OT ගණකය', 'අද පැමිණීම / පිටවීම සටහන් කරන්න.');
      if (view.tab === 'home') render();
    }
  }
  setInterval(reminderTick, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { reminderTick(); if (view.tab === 'home') render(); } });


  /* ---------- English UI: translate rendered text (vouchers are generated in the chosen language directly) ---------- */
  if (LANG() === 'en') {
    document.documentElement.lang = 'en';
    const ATTRS = ['placeholder', 'title', 'aria-label'];
    const skip = (n) => { for (let e = n.nodeType === 3 ? n.parentNode : n; e; e = e.parentNode) { if (e.nodeType === 1 && (e.classList.contains('pg35') || e.tagName === 'SCRIPT' || e.tagName === 'STYLE' || e.tagName === 'TEXTAREA')) return true; } return false; };
    const attrFix = (e) => ATTRS.forEach((a) => { if (e.hasAttribute && e.hasAttribute(a)) { const v = e.getAttribute(a), w = tr(v); if (w !== v) e.setAttribute(a, w); } });
    const doTree = (root) => {
      if (root.nodeType === 3) { if (!skip(root)) { const v = root.nodeValue, w = tr(v); if (w !== v) root.nodeValue = w; } return; }
      if (root.nodeType !== 1 || skip(root)) return;
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const arr = []; let n;
      while ((n = tw.nextNode())) arr.push(n);
      arr.forEach((x) => { if (!skip(x)) { const v = x.nodeValue, w = tr(v); if (w !== v) x.nodeValue = w; } });
      attrFix(root); root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(attrFix);
    };
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') doTree(m.target); else m.addedNodes.forEach(doTree); } }).observe(document.body, { childList: true, subtree: true, characterData: true });
    doTree(document.body);
    document.title = tr(document.title);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  /* ---- install + welcome flow (after the language is chosen) ---- */
  let deferredInstall = null;
  const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; window.__bip = e; });
  const BS = 'width:90%;max-width:320px;padding:15px;font-size:17px;border-radius:12px;border:0;background:#e8b53a;color:#0f172a;font-weight:700;';
  function fullScreen(id, html) {
    const old = document.getElementById(id); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;z-index:98;background:#0f172a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;overflow:auto';
    ov.innerHTML = html; document.body.appendChild(ov); return ov;
  }
  function toDetails() { DB.settings.welcomed = true; save(); view.tab = 'settings'; view.st = 'me'; render(); window.scrollTo(0, 0); }
  function showDetails() {
    const S = DB.settings;
    if (S.welcomed) return;
    const ov = fullScreen('detailsScreen', '<div style="font-size:42px">✍️</div><div style="font-size:22px;font-weight:700">' + lg('ඔබේ තොරතුරු ඇතුළත් කරන්න', 'Enter your details') + '</div>' +
      '<button id="wOk" style="' + BS + 'font-size:28px">➜</button>');
    ov.querySelector('#wOk').onclick = () => { ov.remove(); toDetails(); };
  }
  function showWelcome() {
    const S = DB.settings;
    const ov = fullScreen('welcomeScreen', '<div style="font-size:42px">👋</div>' +
      '<div style="font-size:24px;font-weight:700">' + lg('ආයුබෝවන්!', 'Welcome!') + '</div>' +
      '<div style="opacity:.9;font-size:16px;max-width:330px;line-height:1.6">' + lg('මෙය අතිකාල හා නිවාඩු දින වැටුප්  ගණනය කිරීම සහ වවුචර් මුද්‍රණය කිරීම පහසු කර ගැනීම සඳහා සකස් කල ඇප් එකකි. දැනට කාර්යාල නිලධාරීන්ගේ රාජකාරි වේලාවන් පදනම් කරගෙන සකසා ඇත.',
        'This app calculates overtime and holiday-duty allowances automatically and prepares the vouchers for printing. It is currently set up around office officers\' duty hours.') + '</div>' +
      '<button id="wNext" style="' + BS + '">' + lg('ඉදිරියට යන්න ➜', 'Continue ➜') + '</button>');
    ov.querySelector('#wNext').onclick = () => { S.welcomeSeen = true; save(); ov.remove(); startFlow(); };
  }
  function showInstallScreen() {
    const bs = BS;
    const ov = fullScreen('instScreen', '<div style="font-size:42px">📲</div>' +
      '<button id="instBtn" style="' + bs + '">' + lg('📲 Install කරන්න', '📲 Install') + '</button>' +
      '<div id="instHelp" style="display:none;background:#1e293b;border-radius:12px;padding:12px;font-size:14px;max-width:320px;text-align:left">' +
        lg('Chrome වල උඩ දකුණු කෙළවරේ ⋮ (තිත් තුන) ඔබන්න → <b>"Install app"</b> (හෝ "Add to Home screen") තෝරන්න.', 'In Chrome tap ⋮ (top right) → choose <b>"Install app"</b> (or "Add to Home screen").') + '</div>' +
      '<button id="instSkip" style="' + bs + 'background:transparent;color:#cbd5e1;border:1px solid #475569;font-size:15px;font-weight:400">' + lg('Browser එකෙන් ඉදිරියට යන්න', 'Continue in the browser') + '</button>');
    let finished = false;
    const success = () => {
      if (finished) return; finished = true;
      DB.settings.onboarded = true; DB.settings.installed = true; save();
      ov.innerHTML = '<div style="font-size:42px">✅</div><div style="font-size:19px;font-weight:700;max-width:320px;line-height:1.6">' +
        lg('සාර්ථක ලෙස ඇප් එක install විය. පහත Close බොත්තම ඔබා, ෆෝන් එකේ ඇප් අයිකනය ඔබා ඇප් එක විවෘත කරන්න.', 'The app was installed successfully. Tap Close below, then open the app from its icon on your phone.') + '</div>' +
        '<button id="instClose" style="' + bs + '">' + lg('Close', 'Close') + '</button><div id="instNote" style="display:none;opacity:.85;font-size:14px;max-width:300px">' +
        lg('Chrome ස්වයංක්‍රීයව වැසෙන්නේ නැත්නම් Chrome වසා, ෆෝන් එකේ "OT ගණකය" අයිකනය ඔබා ඇප් එක විවෘත කරන්න.', 'If Chrome does not close by itself, close it and open the "OT" icon on your phone.') + '</div>';
      ov.querySelector('#instClose').onclick = () => { try { window.close(); } catch (e) {} setTimeout(() => { const n = document.getElementById('instNote'); if (n) n.style.display = 'block'; }, 400); };
    };
    ov.querySelector('#instSkip').onclick = () => { DB.settings.onboarded = true; save(); ov.remove(); showDetails(); };
    ov.querySelector('#instBtn').onclick = async () => {
      let bip = deferredInstall || window.__bip;
      if (!bip) { await new Promise((r) => setTimeout(r, 1500)); bip = deferredInstall || window.__bip; }
      if (bip) { bip.prompt(); let r = null; try { r = await bip.userChoice; } catch (e) {} deferredInstall = window.__bip = null; if (r && r.outcome === 'accepted') success(); }
      else ov.querySelector('#instHelp').style.display = 'block';
    };
    window.addEventListener('appinstalled', success, { once: true });
  }
  function startFlow() {
    const S = DB.settings;
    if (!S.lang) return;
    if (!S.welcomed && (Number(S.baseSalary) > 0 || S.name)) { S.welcomed = S.welcomeSeen = S.onboarded = true; save(); return; } /* existing user */
    if (S.welcomed) return;
    if (!S.welcomeSeen) return showWelcome();
    if (!S.onboarded && !S.installed && !isStandalone()) return showInstallScreen();
    showDetails();
  }
  if (!DB.settings.lang) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99;background:#0f172a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center';
    ov.innerHTML = '<div style="font-size:20px;font-weight:700">භාෂාව තෝරන්න<br>Choose your language</div><button data-l="si" style="width:80%;max-width:300px;padding:16px;font-size:18px;border-radius:12px;border:0;background:#e8b53a;color:#0f172a;font-weight:700">සිංහල</button><button data-l="en" style="width:80%;max-width:300px;padding:16px;font-size:18px;border-radius:12px;border:0;background:#e8b53a;color:#0f172a;font-weight:700">English</button>';
    ov.onclick = (e) => { const l = e.target.dataset && e.target.dataset.l; if (!l) return; if (l === 'en' && !EN_ON) { let m = ov.querySelector('#enMsg'); if (!m) { m = document.createElement('div'); m.id = 'enMsg'; m.style.cssText = 'background:#7c2d12;border-radius:12px;padding:12px;max-width:300px;font-size:15px'; ov.appendChild(m); } m.textContent = 'Currently being prepared; please select the Sinhala language.'; return; } DB.settings.lang = l; save(); location.reload(); };
    document.body.appendChild(ov);
  }
  startFlow();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
  { const hd = document.querySelector('header.top'); if (hd) document.documentElement.style.setProperty('--hh', hd.offsetHeight + 'px'); }
  render();
  scheduleNative();
  setTimeout(reminderTick, 1500);
})();
