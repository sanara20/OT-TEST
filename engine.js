/* OT / Daily-allowance rules engine. Times are minutes since midnight. */
(function (root) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');

  function toMin(t) {
    if (!t) return null;
    const m = /^(\d{1,2}):(\d{2})/.exec(t);
    if (!m) return null;
    return +m[1] * 60 + +m[2];
  }
  function fmtTime(min) {
    if (min == null) return '';
    return pad(Math.floor(min / 60)) + ':' + pad(min % 60);
  }
  function fmtDur(min) {
    min = Math.max(0, Math.round(min));
    return Math.floor(min / 60) + ':' + pad(min % 60);
  }
  const floorTo = (x, c) => Math.floor(x / c) * c;
  const ceilTo = (x, c) => Math.ceil(x / c) * c;

  const DEFAULTS = {
    name: '',
    designation: '',
    adjAfternoonFrom: '12:30', adjMorningTo: '12:00',
    shortLeaveMin: 90, halfLeaveMin: 210, shortLeavesPerMonth: 2, halfLateIn: '12:30', halfEarlyOut: '12:00', // short leave = 1.5 h, half-day = 3.5 h
    station: 'ශික්‍ෂණ රෝහල, පේරාදෙණිය', // service station (printed on Gen 35)
    payUnit: 'ගිණුම්', // pay unit (Gen 35a, item 3)
    subjectCode: '', // subject code, e.g. AA (Gen 35a)
    workDesc: '', // description of overtime work (Gen 35a, items 6/7)
    salaryNo: '', // salary number (printed on Gen 35)
    print: { fx: 0, fy: 0, bx: 0, by: 0, rotBack: false }, // print alignment offsets (mm)
    division: '',
    baseSalary: 0,
    otDivisor: 240,
    otRate: 0,
    allowanceDivisor: 30,
    duty: {
      weekday: { s: '08:30', e: '16:15' },
      sat: { s: '08:30', e: '16:15' },
      sun: { s: '08:30', e: '16:15' },
      holiday: { s: '08:30', e: '16:15' },
    },
    morningFrom: '07:00', // earliest time morning OT is counted from
    graceMin: 30, // latest arrival = duty start + grace
    chunk: 15, // rounding block (floor)
    minSide: 30, // min minutes on one side
    minDay: 60, // min minutes per day
    defaultCutoff: '18:00', // OT is paid only up to this time
    limits: [{ from: '2026-11-01', to: '2026-12-31', time: '22:00' }], // periods with a different cutoff
    monthCaps: { '2026-11': 100, '2026-12': 100 }, // approved max OT hours per month
    monthDayCaps: {}, // approved max paid rest days (weekend/holiday allowance days) per month
    reminderTime: '17:00',
    reminderOn: true,
    holidayExtra: {}, // 'YYYY-MM-DD': name
    holidayRemoved: [], // ['YYYY-MM-DD']
  };

  function mergeSettings(saved) {
    const s = JSON.parse(JSON.stringify(DEFAULTS));
    if (!saved) return s;
    for (const k of Object.keys(saved)) {
      if (k === 'duty') {
        for (const t of Object.keys(s.duty)) {
          if (saved.duty && saved.duty[t]) Object.assign(s.duty[t], saved.duty[t]);
        }
      } else {
        s[k] = saved[k];
      }
    }
    if (!s.station && s.division) s.station = s.division;
    return s;
  }

  function parseDate(ds) {
    const [y, m, d] = ds.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function dateStr(dt) {
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }
  function addDays(ds, n) {
    const d = parseDate(ds);
    d.setDate(d.getDate() + n);
    return dateStr(d);
  }
  function dayTypeOf(ds, holidays) {
    if (holidays && holidays[ds]) return 'holiday';
    const w = parseDate(ds).getDay();
    if (w === 6) return 'sat';
    if (w === 0) return 'sun';
    return 'weekday';
  }

  /* OT-paid-until time for a date (minutes) */
  function cutoffFor(ds, S) {
    let t = S.defaultCutoff;
    for (const p of S.limits || []) {
      if (p.from && p.to && ds >= p.from && ds <= p.to && p.time) t = p.time;
    }
    return toMin(t);
  }

  /* Approved cap lookup. value: number | 'none' (explicitly no limit) ; missing months inherit the latest earlier month. */
  function lookupCap(caps, monthKey) {
    caps = caps || {};
    const has = (k) => caps[k] !== '' && caps[k] != null;
    if (has(monthKey)) return caps[monthKey] === 'none' ? null : Number(caps[monthKey]);
    const keys = Object.keys(caps).filter((k) => k < monthKey && has(k)).sort();
    if (!keys.length) return null;
    const v = caps[keys[keys.length - 1]];
    return v === 'none' ? null : Number(v);
  }
  /* Approved monthly OT cap in hours (null = no limit). */
  function capFor(monthKey, S) { return lookupCap(S.monthCaps, monthKey); }
  /* Approved max number of paid rest days (null = no limit). */
  function dayCapFor(monthKey, S) { return lookupCap(S.monthDayCaps, monthKey); }

  function applyMin(m, e, S) {
    const sm = m >= S.minSide ? m : 0;
    const se = e >= S.minSide ? e : 0;
    const tot = sm + se;
    if (tot >= S.minDay) return { ot: tot, m: sm, e: se, ok: true };
    return { ot: 0, m: 0, e: 0, ok: false };
  }

  /*
   * entry: { status:'worked'|'leave'|'off', in, out, overnight:bool (out is next day), noLimit:bool }
   * ctx  : { cutoff: minutes, nextType: 'weekday'|'sat'|'sun'|'holiday' }
   */
  function calcDay(entry, type, S, ctx) {
    const res = calcDay0(entry, type, S, ctx);
    const sp = entry && entry.status === 'worked' ? entry.special : '';
    if (sp && res.valid && res.kind === 'worked') {
      if (sp === 'skip') { Object.assign(res, { ot: 0, morning: 0, evening: 0, night: 0, post: 0, allowance: false, allowNext: false, special: 'skip' }); }
      else if (sp === 'noot') { Object.assign(res, { ot: 0, morning: 0, evening: 0, night: 0, post: 0, special: 'noot' }); }
      else if (sp === 'comp' && type !== 'weekday') { res.allowance = false; res.allowNext = false; res.special = 'comp'; }
      else if (sp === 'allot' && type !== 'weekday') { res.special = 'allot'; }
      else if (sp === 'am') { const m = res.morning >= S.minDay ? res.morning : 0; Object.assign(res, { ot: m, morning: m, evening: 0, night: 0, post: 0, special: 'am' }); }
      else if (sp === 'pm') { const e = res.evening >= S.minDay ? res.evening : 0; Object.assign(res, { ot: e, morning: 0, evening: e, special: 'pm', post: e ? res.post : 0 }); }
    }
    return res;
  }
  function calcDay0(entry, type, S, ctx) {
    ctx = ctx || {};
    const res = {
      kind: 'none', type, ot: 0, morning: 0, evening: 0, night: 0, allowance: false, allowNext: false,
      late: 0, lateChunk: 0, code: '', valid: true, overnight: false, limited: false,
    };
    if (!entry || !entry.status) return res;
    if (entry.status === 'leave' || entry.status === 'off') { res.kind = entry.status; return res; }
    const tin = toMin(entry.in);
    let tout = toMin(entry.out);
    if (tin == null || tout == null) { res.kind = 'incomplete'; res.valid = false; return res; }
    const overnight = !!entry.overnight;
    if (overnight) tout += 1440;
    if (tout <= tin) { res.kind = 'worked'; res.valid = false; res.code = 'BAD_RANGE'; return res; }
    res.kind = 'worked';
    res.overnight = overnight;

    const D = S.duty[type];
    const st = toMin(D.s);
    const en = toMin(D.e);
    const capM = toMin(S.morningFrom);
    const effIn = Math.max(tin, capM);

    const late = Math.max(0, tin - st);
    const lateChunk = late > 0 ? ceilTo(late, S.chunk) : 0;
    res.late = late;
    res.lateChunk = lateChunk;
    const overGrace = late > S.graceMin;

    const cutoff = ctx.cutoff != null ? ctx.cutoff : toMin(S.defaultCutoff);
    let lim = entry.noLimit || overnight ? Infinity : cutoff;
    if (entry.otTo && !overnight && toMin(entry.otTo) != null) lim = Math.min(lim, toMin(entry.otTo));
    const rawM = floorTo(Math.max(0, st - effIn), S.chunk);

    // evening-side minutes (before late deduction), plus overnight pieces
    let eve = 0, night = 0, extra = 0, allowNext = false;
    if (!overnight) {
      eve = floorTo(Math.max(0, Math.min(tout, lim) - en), S.chunk);
      res.limited = tout > lim && lim !== Infinity;
    } else {
      const nt = ctx.nextType || 'weekday';
      const nd = S.duty[nt];
      const ns = toMin(nd.s), ne = toMin(nd.e);
      const outN = tout - 1440;
      eve = floorTo(Math.max(0, 1440 - en), S.chunk);
      night = floorTo(Math.min(outN, ns), S.chunk);
      if (outN > ns) {
        if (nt === 'weekday') {
          extra = floorTo(Math.max(0, outN - ne), S.chunk);
        } else if (outN >= ne) {
          allowNext = true;
          extra = floorTo(outN - ne, S.chunk);
        } else {
          extra = floorTo(outN - ns, S.chunk);
        }
      }
    }
    res.night = night + extra;
    res.allowNext = allowNext;

    const eveTotal = (lateDeduct, nightDeduct) => Math.max(0, eve - lateDeduct) + Math.max(0, night - (nightDeduct || 0)) + extra;

    if (type === 'weekday') {
      // short leave (1.5 h) / half-day (3.5 h): late arrival, or early departure, covered from that day's OT
      let lv = null, lvSide = '';
      const tlate = late > S.graceMin;
      const shortLast = st + (S.shortLeaveMin || 90), halfLast = toMin(S.halfLateIn || '12:30');
      if (tlate) {
        if (tin > halfLast) { res.code = 'W_LATE_OVER'; return res; }
        lv = tin <= shortLast ? 'short' : 'half'; lvSide = 'am';
      }
      // early departure (compare with the duty end of the day the shift finishes on)
      let exitT = null, endT = null;
      if (!overnight) { exitT = tout; endT = en; }
      else if ((ctx.nextType || 'weekday') === 'weekday' && tout - 1440 > toMin(S.duty.weekday.s)) { exitT = tout - 1440; endT = toMin(S.duty.weekday.e); }
      if (exitT != null && exitT < endT) {
        const shortFirst = endT - (S.shortLeaveMin || 90);
        const halfFirst = toMin(S.halfEarlyOut || '12:00');
        if (lv && !overnight) { res.leave = 'both'; res.code = 'W_LATE_AND_EARLY'; return res; }
        if (!lv) {
          if (exitT >= shortFirst) { lv = 'short'; lvSide = 'pm'; }
          else if (exitT >= halfFirst || overnight) { lv = 'half'; lvSide = 'pm'; }
          else { res.leave = 'half'; res.leaveSide = 'pm'; res.code = 'W_EARLY_OVER'; return res; }
        }
      }
      if (entry.lvOverride === 'short' || entry.lvOverride === 'half') { if (lv) lv = entry.lvOverride; }
      else if (lv === 'short' && ctx.slLeft != null && ctx.slLeft <= 0) lv = 'half';
      if (lv) { res.leave = lv; res.leaveSide = lvSide; }
      const ded = lv === 'short' ? (S.shortLeaveMin || 90) : lv === 'half' ? (S.halfLeaveMin || 210) : 0;
      let r;
      if (lv && lvSide === 'am') r = applyMin(0, eveTotal(ded, 0), S);
      else if (lv && lvSide === 'pm') {
        // morning OT cannot cover a leave on its own; only the overnight continuation is paid (less the deduction)
        r = applyMin(0, overnight ? eveTotal(0, ded) : 0, S);
      } else r = applyMin(rawM, eveTotal(tlate ? 0 : lateChunk, 0), S);
      res.morning = r.m; res.evening = r.e; res.ot = r.ot;
      if (lv && lvSide === 'pm' && overnight) res.night = Math.max(0, night - ded) + extra;
      res.post = overnight && r.e > 0 ? res.night : 0;
      res.code = lv ? (r.ok ? 'W_LEAVE_OK' : 'W_LEAVE_BELOW_MIN') : (r.ok ? 'W_OK' : 'W_BELOW_MIN');
      if (!r.ok) res.allowNext = false;
      return res;
    }

    // weekend / public holiday
    const stayed = overnight ? 1440 - en : tout - en;
    const forceAll = entry.special === 'allot';
    const covered = !forceAll && !overGrace && stayed >= 0 && floorTo(stayed, S.chunk) >= lateChunk;
    if (covered) {
      res.allowance = true;
      const r = applyMin(rawM, eveTotal(lateChunk), S);
      res.morning = r.m; res.evening = r.e; res.ot = r.ot;
      res.post = overnight && r.e > 0 ? night + extra : 0;
      res.code = r.ok ? 'H_ALLOW' : 'H_ALLOW_NO_OT';
    } else {
      // no allowance: every worked minute is OT (up to the cutoff), no minimum checks
      res.allowNext = false;
      const end = overnight ? tout : Math.min(tout, lim);
      res.ot = floorTo(Math.max(0, end - effIn), S.chunk);
      res.post = overnight ? floorTo(Math.max(0, tout - 1440), S.chunk) : 0;
      res.limited = !overnight && tout > lim && lim !== Infinity;
      res.code = forceAll ? 'H_ALL_OT' : overGrace ? 'H_NOALLOW_LATE' : tout < en ? 'H_NOALLOW_EARLY' : 'H_NOALLOW_UNCOVERED';
    }
    return res;
  }

  /* Fixed-date public holidays used for years that have no built-in list (Poya / lunar holidays are not computed). */
  const FIXED = [['02-04', 'ජාතික නිදහස් දිනය'], ['04-13', 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනයට පෙර දිනය'], ['04-14', 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනය'], ['05-01', 'මැයි දිනය'], ['12-25', 'නත්තල']];
  function builtinYears(builtin) { const ys = {}; for (const k of Object.keys(builtin || {})) ys[k.slice(0, 4)] = 1; return ys; }
  function holidayMap(builtin, S) {
    const m = Object.assign({}, builtin || {}, S.holidayExtra || {});
    const ys = builtinYears(builtin), maxY = Math.max(...Object.keys(ys).map(Number), 0);
    if (maxY) for (let y = maxY + 1; y <= maxY + 12; y++) for (const [md, n] of FIXED) m[y + '-' + md] = n;
    for (const d of S.holidayRemoved || []) delete m[d];
    return m;
  }

  const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

  function rates(S) {
    const base = Number(S.baseSalary) || 0;
    return {
      hourly: Number(S.otRate) > 0 ? Number(S.otRate) : (S.otDivisor ? base / S.otDivisor : 0),
      daily: S.allowanceDivisor ? base / S.allowanceDivisor : 0,
    };
  }

  /* Adjacent working-day rule: pay on a weekend / public-holiday run needs the nearest weekday before OR after to have been served
     (before: in by 12:30 and out at/after duty end; after: in by duty start + grace and out at/after 12:00). */
  function servedState(ds, side, entries, S) {
    const e = entries[ds];
    if (!e || !e.status) return 'unknown';
    if (e.status !== 'worked') return 'no';
    const tin = toMin(e.in); let tout = toMin(e.out);
    if (tin == null || tout == null) return 'unknown';
    if (e.overnight) tout += 1440;
    const D = S.duty.weekday;
    if (side === 'before') return tin <= toMin(S.adjAfternoonFrom || '12:30') && tout >= toMin(D.e) ? 'yes' : 'no';
    return tin <= toMin(D.s) + (S.graceMin || 0) && tout >= toMin(S.adjMorningTo || '12:00') ? 'yes' : 'no';
  }
  function adjacency(ds, entries, S, holidays) {
    let p = addDays(ds, -1), n = addDays(ds, 1), g = 0;
    while (dayTypeOf(p, holidays) !== 'weekday' && g++ < 15) p = addDays(p, -1);
    g = 0;
    while (dayTypeOf(n, holidays) !== 'weekday' && g++ < 15) n = addDays(n, 1);
    const a = servedState(p, 'before', entries, S), b = servedState(n, 'after', entries, S);
    if (a === 'yes' || b === 'yes') return { state: 'ok', p, n };
    if (a === 'unknown' || b === 'unknown') return { state: 'pending', p, n };
    return { state: 'fail', p, n };
  }

  function summarize(monthKey, entries, S, holidays) {
    const [y, m] = monthKey.split('-').map(Number);
    const n = new Date(y, m, 0).getDate();
    const rows = [];
    const allowRows = [];
    let otMin = 0, allowDays = 0, leaveDays = 0, offDays = 0, workedDays = 0;
    const contDates = {};
    let slUsed = 0, slTotal = 0, halfDays = 0;
    // an overnight entry on the last day of the previous month may continue into day 1
    const prev = addDays(monthKey + '-01', -1);
    const pe = entries[prev];
    let carry = null; // overnight from the last day of the previous month: its after-midnight part belongs to this month
    if (pe && pe.status === 'worked' && pe.overnight) {
      contDates[monthKey + '-01'] = prev;
      const pr = calcDay(pe, dayTypeOf(prev, holidays), S, { cutoff: cutoffFor(prev, S), nextType: dayTypeOf(monthKey + '-01', holidays) });
      if (pr.valid && pr.kind === 'worked' && pr.overnight) carry = { post: pr.post || 0, allow: !!pr.allowNext, entry: pe };
    }

    for (let d = 1; d <= n; d++) {
      const ds = y + '-' + pad(m) + '-' + pad(d);
      const type = dayTypeOf(ds, holidays);
      let entry = entries[ds];
      let res;
      if (contDates[ds]) {
        res = { kind: 'cont', type, ot: carry && ds === monthKey + '-01' ? carry.post : 0, morning: 0, evening: 0, night: 0, allowance: false, valid: true, code: 'CONT', from: contDates[ds], contEntry: carry && ds === monthKey + '-01' ? carry.entry : null };
        if (carry && ds === monthKey + '-01' && carry.allow) { res.allowance = true; }
        entry = entry || null;
      } else {
        const nextDs = addDays(ds, 1);
        res = calcDay(entry, type, S, { cutoff: cutoffFor(ds, S), nextType: dayTypeOf(nextDs, holidays), slLeft: (S.shortLeavesPerMonth == null ? 2 : S.shortLeavesPerMonth) - slUsed });
        if (res.leave === 'short') slUsed++;
        if (res.leave === 'half') halfDays++;
        if (type !== 'weekday' && res.valid && res.kind === 'worked') {
          const aj = adjacency(ds, entries, S, holidays);
          res.adj = aj.state;
          if (aj.state === 'fail') Object.assign(res, { ot: 0, morning: 0, evening: 0, night: 0, post: 0, allowance: false, allowNext: false, adjFail: true });
        }
        if (res.valid && res.overnight && res.kind === 'worked') contDates[nextDs] = ds;
        // last day of the month: everything after 00:00 (and the next day's allowance) belongs to the next month
        if (res.valid && res.overnight && res.kind === 'worked' && nextDs.slice(0, 7) !== monthKey) {
          const post = res.post || 0;
          res = Object.assign({}, res, { ot: res.ot - post, evening: Math.max(0, res.evening - post), night: 0, allowNext: false, splitNext: post, postFull: post });
        }
      }
      rows.push({ date: ds, type, holiday: holidays[ds] || '', entry: entry || null, res });
      if (res.kind === 'cont' && res.allowance) {
        allowDays++;
        allowRows.push({ date: ds, type, holiday: holidays[ds] || '', entry: null, cont: res.from, contEntry: carry.entry });
        res.allowance = false;
      }
      if (res.valid) {
        otMin += res.ot;
        if (res.allowance) { allowDays++; allowRows.push({ date: ds, type, holiday: holidays[ds] || '', entry }); }
        if (res.allowNext) {
          const nd = addDays(ds, 1);
          allowDays++;
          allowRows.push({ date: nd, type: dayTypeOf(nd, holidays), holiday: holidays[nd] || '', entry: null, cont: ds });
        }
      }
      if (res.kind === 'leave') leaveDays++;
      if (res.kind === 'off') offDays++;
      if (res.kind === 'worked' && res.valid) workedDays++;
    }
    const rt = rates(S);
    const capH = capFor(monthKey, S);
    const capMin = capH == null ? null : Math.round(capH * 60);
    const payMin = capMin == null ? otMin : Math.min(otMin, capMin);
    const dayCap = dayCapFor(monthKey, S);
    const allowPay = dayCap == null ? allowDays : Math.min(allowDays, dayCap);
    return {
      month: monthKey, rows, allowRows, otMin, payMin, excessMin: otMin - payMin, capH, capMin,
      allowDays, allowPay, excessDays: allowDays - allowPay, dayCap,
      shortLeaves: slUsed, halfDays, shortLeaveCap: S.shortLeavesPerMonth == null ? 2 : S.shortLeavesPerMonth,
      leaveDays, offDays, workedDays, hourly: rt.hourly, daily: rt.daily,
      otAmount: round2((payMin / 60) * rt.hourly),
      allowAmount: round2(allowPay * rt.daily),
    };
  }

  const api = {
    adjacency, builtinYears, DEFAULTS, mergeSettings, toMin, fmtTime, fmtDur, pad, parseDate, dateStr, addDays, dayTypeOf,
    cutoffFor, capFor, dayCapFor, calcDay, summarize, holidayMap, rates, round2, applyMin,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OT = api;
})(typeof window !== 'undefined' ? window : globalThis);
