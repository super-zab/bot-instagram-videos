/* Fil Rouge — analyse d'une conversation de couple. Pur calcul, aucun DOM. */
(function (root) {
  'use strict';
  const FR = (root.FR = root.FR || {});

  // Bornes de mot compatibles avec les accents (\b de JS ne connaît que l'ASCII).
  const W = (src) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, 'giu');
  const RX = {
    love: W("je\\s*t['’]?\\s*aime|j['’]?\\s*t['’]?\\s*aime|jtm|i\\s+love\\s+(?:you|u)|ily|love\\s+(?:you|u)|luv\\s+(?:you|u)|te\\s+quiero|ti\\s+amo|te\\s+amo|ich\\s+liebe\\s+dich"),
    miss: W("tu\\s+me\\s+manques?|tu\\s+m['’]\\s*manques?|tmm|i\\s+miss\\s+(?:you|u)|miss\\s+(?:you|u)"),
    night: W("bonne\\s+nuit|bne\\s+nuit|good\\s*night|gn|nuit\\s+nuit|dors\\s+bien|fais\\s+de\\s+beaux\\s+r[êe]ves|sweet\\s+dreams"),
    laugh: W("a(?:ha)+h?|(?:ha){2,}h?|(?:hi){2,}|(?:he){3,}|mdr+|ptdr+|lol+|xd+|jpp+"),
    sorry: W("d[ée]sol[ée]e?s?|dsl|pardon|sorry|excuse[- ]moi"),
    url: /https?:\/\/\S+/g,
    emoji: /\p{Extended_Pictographic}/gu,
    laughEmoji: /[\u{1F602}\u{1F923}]/gu,
  };
  const NICKS = [
    ['bébé', W('b[ée]b[ée]|bb|b[ée]bou')],
    ['mon amour', W('mon\\s+amour|my\\s+love|mon\\s+love')],
    ['mon cœur', W('mon\\s+c(?:œ|oe)ur|sweetheart')],
    ['chéri·e', W('ch[ée]rie?')],
    ['ma puce', W('ma\\s+puce')],
    ['babe', W('babe|baby|bae')],
    ['mon ange', W('mon\\s+ange')],
    ['mon chat', W('mon\\s+chat|minou')],
    ['ma belle', W('ma\\s+belle')],
    ['mon beau', W('mon\\s+beau')],
    ['princesse', W('princesse|princess')],
    ['loulou', W('loulou|mon\\s+loup|ma\\s+louve')],
    ['honey', W('honey')],
  ];
  const EMOJI_SKIP = new Set(['©', '®', '™', '‼', '⁉', '↔', '↩', '↪']);
  const STOP = new Set((
    'les des une est pour dans avec mais tout tous toute toutes bien oui non moi toi lui elle elles ils nous vous que qui quoi pas plus ' +
    'suis es sommes êtes sont été était étais étaient être avoir ai as avait avais ont aura aurai serai sera fait fais faire vais vas va ' +
    'allez aller peux peut pouvoir veux veut vouloir dois doit faut bon bonne trop comme quand alors donc aussi juste encore déjà ouais ' +
    'okay oki dac daccord accord sur par ton ta tes mon ma mes son sa ses leur leurs ces cet cette ceux celle celui là ici très rien ' +
    'chez quel quelle quels quelles hein genre vraiment dit dis disait vois voir sais sait savoir crois pense après avant fois toujours ' +
    'jamais peu beaucoup même autre autres entre sans sous vers chose choses bah ben euh hmm ouai merci coucou salut bonjour bonsoir ' +
    'nuit demain aujourd hui hier heure heures min pourquoi comment combien puis car parce ceci cela ça elles aucun aucune vos votre ' +
    'nos notre the and you that for are with this have was not but what all can just your like too yes yeah get got its dont will one ' +
    'out about how know now then see want there they them their from would could should been were has had his her him she was who ' +
    'aime aimes aimer jtm love media médias omis omise omitted image absente pièce jointe attached null haha hahaha ahah ahahah hihi ' +
    'mdr ptdr lol jpp xptdr www com http https pas tkt jsp stp svp bcp mtn pcq pck dcp att attends oublie'
  ).split(/\s+/));

  const SESSION = 6 * 3600e3;
  const DAY = 864e5;

  const pad = (v) => String(v).padStart(2, '0');
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const keyToUTC = (k) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const keyToLocal = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };
  const inc = (map, k, v = 1) => map.set(k, (map.get(k) || 0) + v);
  const count = (x, re) => { const r = x.match(re); return r ? r.length : 0; };
  const topN = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const median = (arr) => {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b);
    const mid = s.length >> 1;
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  function analyze(thread) {
    const all = (thread.messages || []).filter((m) => m && m.s && Number.isFinite(m.t)).sort((a, b) => a.t - b.t);
    const senders = new Map();
    for (const m of all) inc(senders, m.s);
    const top = topN(senders, 2).map((e) => e[0]);
    if (top.length < 2) throw new Error('Cette conversation ne contient qu’une seule personne. Il faut une discussion à deux.');
    const msgs = all.filter((m) => m.s === top[0] || m.s === top[1]);
    const names = msgs[0].s === top[0] ? top : [top[1], top[0]]; // la personne qui a écrit en premier = A

    const P = names.map((name) => ({
      name, msgs: 0, text: 0, words: 0, chars: 0, media: 0,
      love: 0, miss: 0, night: 0, laugh: 0, sorry: 0, owl: 0, early: 0, emojiN: 0,
      starters: 0, morningFirst: 0, replies: [],
      emoji: new Map(), wordMap: new Map(), nick: new Map(),
      longest: null, firstLove: null, firstMiss: null,
    }));
    const months = new Map();
    const loveMonths = new Map();
    const days = new Map();
    const years = new Map();
    const hours = Array.from({ length: 24 }, () => [0, 0]);
    const wdays = Array.from({ length: 7 }, () => [0, 0]);
    const firstOfDay = new Map();
    const COUNT_MARKS = new Set([1000, 5000, 10000, 25000, 50000, 100000, 250000]);
    const countMarks = [];
    let firstNick = null;
    let maxGap = { ms: 0 };
    let prev = null;
    let k = 0;

    for (const m of msgs) {
      k++;
      const i = m.s === names[0] ? 0 : 1;
      const p = P[i];
      const d = new Date(m.t);
      const y = d.getFullYear();
      const mo = d.getMonth();
      const mk = y + '-' + pad(mo + 1);
      const dk = mk + '-' + pad(d.getDate());
      const h = d.getHours();
      p.msgs++;
      let mrow = months.get(mk);
      if (!mrow) months.set(mk, (mrow = [0, 0]));
      mrow[i]++;
      let day = days.get(dk);
      if (!day) days.set(dk, (day = { n: 0, love: 0 }));
      day.n++;
      hours[h][i]++;
      wdays[(d.getDay() + 6) % 7][i]++;
      if (h < 5) p.owl++;
      else if (h < 8) p.early++;
      let Y = years.get(y);
      if (!Y) years.set(y, (Y = { year: y, n: [0, 0], love: [0, 0], months: new Map(), emoji: new Map(), words: new Map(), days: new Map(), quote: null, qScore: -1, first: m.t, last: m.t }));
      Y.n[i]++;
      Y.last = m.t;
      inc(Y.months, mo);
      inc(Y.days, dk);
      const sk = dayKey(m.t - 5 * 3600e3); // une « journée » commence à 5 h du matin
      if (!firstOfDay.has(sk)) firstOfDay.set(sk, i);
      if (prev) {
        const gap = m.t - prev.t;
        if (gap > maxGap.ms) maxGap = { ms: gap, from: prev.t, to: m.t, breaker: i };
        if (gap >= SESSION) p.starters++;
        else if (prev.s !== m.s) p.replies.push(gap);
      } else {
        p.starters++;
      }
      if (COUNT_MARKS.has(k)) countMarks.push({ t: m.t, k, s: m.s });
      prev = m;

      if (m.m || !m.x) { p.media++; continue; }
      const x = m.x;
      p.text++;
      p.chars += x.length;
      if (!p.longest || x.length > p.longest.x.length) p.longest = m;
      const lv = count(x, RX.love);
      if (lv) {
        p.love += lv;
        Y.love[i] += lv;
        inc(loveMonths, mk, lv);
        day.love += lv;
        if (!p.firstLove) p.firstLove = m;
      }
      const ms = count(x, RX.miss);
      if (ms) { p.miss += ms; if (!p.firstMiss) p.firstMiss = m; }
      p.night += count(x, RX.night);
      p.laugh += count(x, RX.laugh) + count(x, RX.laughEmoji);
      p.sorry += count(x, RX.sorry);
      let nickHit = 0;
      for (const [label, re] of NICKS) {
        const c = count(x, re);
        if (c) { inc(p.nick, label, c); nickHit++; if (!firstNick) firstNick = { m, label }; }
      }
      const em = x.match(RX.emoji);
      if (em) for (const e of em) { if (EMOJI_SKIP.has(e)) continue; inc(p.emoji, e); inc(Y.emoji, e); p.emojiN++; }
      const toks = x.toLowerCase().replace(RX.url, ' ').match(/\p{L}+/gu) || [];
      p.words += toks.length;
      for (const w of toks) if (w.length >= 3 && !STOP.has(w)) { inc(p.wordMap, w); inc(Y.words, w); }
      if (x.length >= 25 && x.length <= 220 && !/https?:/.test(x)) {
        const sc = Math.min(lv, 1) * 2 + Math.min(ms, 1) * 1.5 + Math.min(nickHit, 1) + Math.min(x.length, 180) / 45 + (em ? 0.3 : 0);
        if (sc > Y.qScore) { Y.qScore = sc; Y.quote = m; }
      }
    }

    for (const v of firstOfDay.values()) P[v].morningFirst++;

    const first = msgs[0];
    const last = msgs[msgs.length - 1];
    const dayKeys = [...days.keys()].sort();
    const spanDays = Math.round((keyToUTC(dayKeys[dayKeys.length - 1]) - keyToUTC(dayKeys[0])) / DAY) + 1;

    // Plus longue série de jours consécutifs
    let streak = { len: 1, from: dayKeys[0], to: dayKeys[0] };
    let run = 1, runStart = dayKeys[0];
    for (let j = 1; j < dayKeys.length; j++) {
      if (keyToUTC(dayKeys[j]) - keyToUTC(dayKeys[j - 1]) === DAY) run++;
      else { run = 1; runStart = dayKeys[j]; }
      if (run > streak.len) streak = { len: run, from: runStart, to: dayKeys[j] };
    }
    streak.fromT = keyToLocal(streak.from);
    streak.toT = keyToLocal(streak.to);

    let busiest = { k: dayKeys[0], n: 0 };
    let loveDay = { k: null, n: 0 };
    for (const [dk, v] of days) {
      if (v.n > busiest.n) busiest = { k: dk, n: v.n };
      if (v.love > loveDay.n) loveDay = { k: dk, n: v.love };
    }
    busiest.t = keyToLocal(busiest.k);
    if (loveDay.k) loveDay.t = keyToLocal(loveDay.k);

    // Série mensuelle continue (mois vides inclus)
    const monthSeries = [];
    {
      const d = new Date(first.t); d.setDate(1);
      const end = new Date(last.t);
      while (d.getFullYear() < end.getFullYear() || (d.getFullYear() === end.getFullYear() && d.getMonth() <= end.getMonth())) {
        const mk = d.getFullYear() + '-' + pad(d.getMonth() + 1);
        const row = months.get(mk) || [0, 0];
        monthSeries.push({ k: mk, t: d.getTime(), a: row[0], b: row[1], love: loveMonths.get(mk) || 0 });
        d.setMonth(d.getMonth() + 1);
      }
    }
    const topMonth = monthSeries.reduce((b, m) => (m.a + m.b > b.a + b.b ? m : b), monthSeries[0]);

    const people = P.map((p) => {
      const med = median(p.replies);
      return {
        name: p.name, msgs: p.msgs, text: p.text, words: p.words, media: p.media,
        love: p.love, miss: p.miss, night: p.night, laugh: p.laugh, sorry: p.sorry,
        owl: p.owl, early: p.early, emojiN: p.emojiN, starters: p.starters, morningFirst: p.morningFirst,
        avgLen: p.text ? p.chars / p.text : 0,
        emojiPerMsg: p.text ? p.emojiN / p.text : 0,
        replyMedian: med,
        topEmojis: topN(p.emoji, 6),
        topWords: topN(p.wordMap, 10),
        topNick: topN(p.nick, 3),
        longest: p.longest,
        firstLove: p.firstLove,
        firstMiss: p.firstMiss,
      };
    });

    const yearList = [...years.values()].sort((a, b) => a.year - b.year).map((Y) => {
      const tm = topN(Y.months, 1)[0];
      const bd = topN(Y.days, 1)[0];
      return {
        year: Y.year, n: Y.n, total: Y.n[0] + Y.n[1], love: Y.love, loveTotal: Y.love[0] + Y.love[1],
        topMonth: tm ? tm[0] : null, topMonthN: tm ? tm[1] : 0,
        topEmoji: topN(Y.emoji, 3), topWords: topN(Y.words, 5),
        busiest: bd ? { t: keyToLocal(bd[0]), n: bd[1] } : null,
        activeDays: Y.days.size, quote: Y.quote, first: Y.first, last: Y.last,
      };
    });

    const loves = people.map((p) => p.firstLove).filter(Boolean).sort((a, b) => a.t - b.t);
    const firstLove = loves[0] || null;

    // Moments clés
    const ms = [];
    ms.push({ t: first.t, kind: 'first', s: first.s, x: first.x });
    people.forEach((p) => p.firstLove && ms.push({ t: p.firstLove.t, kind: 'love', s: p.name, x: p.firstLove.x }));
    const firstMiss = people.map((p) => p.firstMiss).filter(Boolean).sort((a, b) => a.t - b.t)[0];
    if (firstMiss) ms.push({ t: firstMiss.t, kind: 'miss', s: firstMiss.s, x: firstMiss.x });
    if (firstNick) ms.push({ t: firstNick.m.t, kind: 'nick', s: firstNick.m.s, label: firstNick.label });
    countMarks.forEach((c) => ms.push({ t: c.t, kind: 'count', k: c.k, s: c.s }));
    ms.push({ t: busiest.t, kind: 'busiest', n: busiest.n });
    const silenceDays = maxGap.ms / DAY;
    if (silenceDays >= 2) ms.push({ t: maxGap.to, kind: 'silence', days: silenceDays, from: maxGap.from, s: names[maxGap.breaker] });
    {
      const f = new Date(first.t);
      for (let yr = 1; yr < 60; yr++) {
        const t = new Date(f.getFullYear() + yr, f.getMonth(), f.getDate(), 12).getTime();
        if (t > last.t) break;
        ms.push({ t, kind: 'anniv', years: yr });
      }
    }
    ms.sort((a, b) => a.t - b.t);

    // Prix du couple : [clé, valeurs, plus petit = gagnant ?]
    const AW = [
      ['bavard', people.map((p) => p.msgs)],
      ['romantique', people.map((p) => p.love)],
      ['manque', people.map((p) => p.miss)],
      ['premierpas', people.map((p) => p.starters)],
      ['matin', people.map((p) => p.morningFirst)],
      ['bonnenuit', people.map((p) => p.night)],
      ['eclair', people.map((p) => p.replyMedian), true],
      ['nuit', people.map((p) => p.owl)],
      ['rire', people.map((p) => p.laugh)],
      ['emoji', people.map((p) => p.emojiPerMsg)],
      ['roman', people.map((p) => p.avgLen)],
      ['pardon', people.map((p) => p.sorry)],
    ];
    const awards = [];
    for (const [key, v, low] of AW) {
      if (v[0] == null || v[1] == null || v[0] === v[1]) continue;
      if (!low && Math.max(v[0], v[1]) <= 0) continue;
      const w = low ? (v[0] < v[1] ? 0 : 1) : (v[0] > v[1] ? 0 : 1);
      awards.push({ key, winner: w, values: v });
    }

    const total = msgs.length;
    return {
      source: thread.source || 'whatsapp',
      title: thread.title || '',
      names,
      people,
      total,
      words: people[0].words + people[1].words,
      media: people[0].media + people[1].media,
      first, last,
      spanDays,
      activeDays: dayKeys.length,
      avgPerDay: total / spanDays,
      months: monthSeries,
      topMonth,
      hours, wdays,
      busiest, loveDay, streak,
      silence: { days: silenceDays, from: maxGap.from, to: maxGap.to },
      years: yearList,
      firstLove,
      loveTotal: people[0].love + people[1].love,
      missTotal: people[0].miss + people[1].miss,
      milestones: ms,
      awards,
    };
  }

  FR.analyze = analyze;
  FR.analyzeInternals = { RX, NICKS, STOP };
  if (typeof module !== 'undefined' && module.exports) module.exports = analyze;
})(typeof window !== 'undefined' ? window : globalThis);
