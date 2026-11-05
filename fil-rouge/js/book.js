/* Fil Rouge — mise en page du livre (A5, 148 × 210 mm). Renvoie du HTML ; le CSS est dans index.html. */
(function (root) {
  'use strict';
  const FR = (root.FR = root.FR || {});

  const THEMES = {
    bordeaux: { label: 'Bordeaux', paper: '#fbf8f7', ink: '#2b1519', a: '#9b1c35', b: '#d98a98', soft: '#f2e6e7', cover: '#7d1129', coverInk: '#fbeef0' },
    nuit: { label: 'Nuit bleue', paper: '#f8f8fa', ink: '#131a2e', a: '#23397e', b: '#c9982f', soft: '#e7e9f1', cover: '#141d3d', coverInk: '#f2e7c8' },
    sauge: { label: 'Sauge', paper: '#f8f9f5', ink: '#1b2a21', a: '#3c6a4e', b: '#c09c62', soft: '#e5ebe1', cover: '#2c4b39', coverInk: '#f1ead9' },
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('fr-FR');
  const n = (v) => nf.format(Math.round(v || 0));
  const dLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  const dMonthOnly = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
  const dTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
  const date = (t) => dLong.format(new Date(t)).replace(/^1 /, '1er ');
  const WD = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const pl = (v, one, many) => (Math.round(v) > 1 ? many : one);
  const clip = (s, max = 200) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s; };
  const delay = (ms) => {
    if (ms == null) return '—';
    const m = ms / 60000;
    if (m < 1) return '< 1 min';
    if (m < 60) return Math.round(m) + ' min';
    const h = Math.floor(m / 60), r = Math.round(m % 60);
    return h + ' h' + (r ? ' ' + String(r).padStart(2, '0') : '');
  };
  const daysBetween = (a, b) => Math.round((b - a) / 864e5);

  /* ---------- petits graphiques SVG (couleurs = variables du thème) ---------- */
  function chartMonths(months) {
    const W = 300, H = 150, L = 6, R = 294, T = 14, B = 122;
    const max = Math.max(1, ...months.map((m) => m.a + m.b));
    const bw = (R - L) / months.length;
    const y = (v) => B - (v / max) * (B - T);
    let bars = '', ticks = '';
    months.forEach((m, i) => {
      const x = L + i * bw;
      const w = Math.max(0.6, bw - (bw > 3 ? 1 : 0.3));
      bars += `<rect x="${x.toFixed(2)}" y="${y(m.a).toFixed(2)}" width="${w.toFixed(2)}" height="${(B - y(m.a)).toFixed(2)}" fill="var(--a)"/>`;
      bars += `<rect x="${x.toFixed(2)}" y="${y(m.a + m.b).toFixed(2)}" width="${w.toFixed(2)}" height="${(y(m.a) - y(m.a + m.b)).toFixed(2)}" fill="var(--b)"/>`;
      if (m.k.endsWith('-01') || i === 0) {
        ticks += `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${B}" y2="${B + 4}" stroke="var(--ink)" stroke-width=".5"/>`;
        ticks += `<text x="${(x + 1).toFixed(2)}" y="${B + 13}" font-size="8" fill="var(--ink)">${m.k.slice(0, 4)}</text>`;
      }
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Messages par mois">
      <line x1="${L}" x2="${R}" y1="${T}" y2="${T}" stroke="var(--ink)" stroke-opacity=".15" stroke-dasharray="2 2"/>
      <text x="${L}" y="${T - 4}" font-size="7.5" fill="var(--ink)" fill-opacity=".7">${n(max)} messages / mois</text>
      ${bars}<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--ink)" stroke-width=".6"/>${ticks}</svg>`;
  }

  function chartLove(months) {
    const W = 300, H = 90, L = 6, R = 294, T = 12, B = 76;
    const max = Math.max(1, ...months.map((m) => m.love));
    const step = months.length > 1 ? (R - L) / (months.length - 1) : 0;
    const pts = months.map((m, i) => [L + i * step, B - (m.love / max) * (B - T)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
    const area = line + ` L${R} ${B} L${L} ${B} Z`;
    const peak = months.reduce((b, m, i) => (m.love > months[b].love ? i : b), 0);
    const pp = pts[peak];
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="« Je t'aime » par mois">
      <path d="${area}" fill="var(--b)" fill-opacity=".35"/>
      <path d="${line}" fill="none" stroke="var(--a)" stroke-width="1.4" stroke-linejoin="round"/>
      <line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--ink)" stroke-width=".6"/>
      <circle cx="${pp[0].toFixed(2)}" cy="${pp[1].toFixed(2)}" r="2.6" fill="var(--a)"/>
      <text x="${Math.min(Math.max(pp[0], 40), 260).toFixed(2)}" y="${Math.max(pp[1] - 5, 8).toFixed(2)}" font-size="7.5" text-anchor="middle" fill="var(--ink)">${n(max)} en ${esc(dMonth.format(new Date(months[peak].t)))}</text>
      <text x="${L}" y="${B + 11}" font-size="7.5" fill="var(--ink)" fill-opacity=".7">${esc(dMonth.format(new Date(months[0].t)))}</text>
      <text x="${R}" y="${B + 11}" font-size="7.5" text-anchor="end" fill="var(--ink)" fill-opacity=".7">${esc(dMonth.format(new Date(months[months.length - 1].t)))}</text></svg>`;
  }

  function chartClock(hours) {
    const cx = 100, cy = 100, r0 = 30, r1 = 86;
    const tot = hours.map((h) => h[0] + h[1]);
    const max = Math.max(1, ...tot);
    let s = '';
    const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    tot.forEach((v, h) => {
      const a0 = (h / 24) * Math.PI * 2 - Math.PI / 2 + 0.02;
      const a1 = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2 - 0.02;
      const r = r0 + (r1 - r0) * Math.sqrt(v / max);
      const [x0, y0] = pt(r0, a0), [x1, y1] = pt(r, a0), [x2, y2] = pt(r, a1), [x3, y3] = pt(r0, a1);
      const fill = h < 6 ? 'var(--ink)' : v === max ? 'var(--a)' : 'var(--b)';
      s += `<path d="M${x0.toFixed(2)} ${y0.toFixed(2)} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${r0} ${r0} 0 0 0 ${x0.toFixed(2)} ${y0.toFixed(2)} Z" fill="${fill}" fill-opacity="${h < 6 ? 0.55 : 1}"/>`;
    });
    const lab = [[0, 'minuit'], [6, '6 h'], [12, 'midi'], [18, '18 h']].map(([h, t]) => {
      const [x, y] = pt(r1 + 9, (h / 24) * Math.PI * 2 - Math.PI / 2);
      return `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" font-size="8" text-anchor="middle" fill="var(--ink)">${t}</text>`;
    }).join('');
    return `<svg class="chart clock" viewBox="0 0 200 200" role="img" aria-label="Messages selon l'heure">
      <circle cx="${cx}" cy="${cy}" r="${r0 - 3}" fill="none" stroke="var(--ink)" stroke-opacity=".2"/>${s}${lab}</svg>`;
  }

  function chartWeek(wdays) {
    const tot = wdays.map((d) => d[0] + d[1]);
    const max = Math.max(1, ...tot);
    return `<div class="week">${tot.map((v, i) => `<div class="wk"><span class="wk-bar" style="height:${((v / max) * 100).toFixed(1)}%;${v === max ? 'background:var(--a)' : ''}"></span><span class="wk-l">${WD[i].slice(0, 3)}</span></div>`).join('')}</div>`;
  }

  /* ---------- pages ---------- */
  function page(cls, inner, folio) {
    return `<section class="pg ${cls}"><div class="pg-in">${inner}</div>${folio ? `<div class="folio">${folio}</div>` : ''}</section>`;
  }
  const chapter = (num, title) => `<header class="ch"><span class="ch-n">Chapitre ${num}</span><h2>${title}</h2></header>`;
  const quote = (m, names, extra = '') => m ? `<blockquote class="q"><p>${esc(clip(m.x, 230))}</p><cite>${esc(names(m.s))}, ${esc(date(m.t))}${extra}</cite></blockquote>` : '';

  function renderBook(s, opts = {}) {
    const disp = { [s.names[0]]: opts.nameA || s.names[0], [s.names[1]]: opts.nameB || s.names[1] };
    const nm = (raw) => disp[raw] || raw;
    const A = nm(s.names[0]), B = nm(s.names[1]);
    const [pa, pb] = s.people;
    const theme = THEMES[opts.theme] || THEMES.bordeaux;
    const pages = [];
    let ch = 0;
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
    const nextCh = () => roman[ch++] || String(ch);
    const folio = () => pages.length + 1;

    // Couverture
    pages.push(`<section class="pg pg-cover"><div class="pg-in">
      <svg class="cv-thread" viewBox="0 0 200 284" preserveAspectRatio="none" aria-hidden="true"><path d="M-6 40 C 60 10, 150 70, 120 120 S 20 170, 70 210 S 190 230, 206 262" fill="none" stroke="var(--b)" stroke-width="1.6" stroke-linecap="round"/></svg>
      <p class="cv-kicker">${esc(n(s.total))} messages</p>
      <h1 class="cv-names"><span>${esc(A)}</span><em>&amp;</em><span>${esc(B)}</span></h1>
      <p class="cv-title">${esc(opts.title || 'Notre histoire, message après message')}</p>
      <p class="cv-dates">${esc(date(s.first.t))} — ${esc(date(s.last.t))}</p>
    </div></section>`);

    // Dédicace
    const dedi = opts.dedication || `Pour ${B}, parce que chaque message de ce livre a compté.`;
    pages.push(page('pg-dedi', `<p class="dedi">${esc(dedi).replace(/\n/g, '<br>')}</p><p class="dedi-sig">— ${esc(opts.from || A)}</p>`, folio()));

    // I. Le début
    const firstMsgs = [s.first];
    pages.push(page('', `${chapter(nextCh(), 'Le tout premier message')}
      <p class="lead">Tout a commencé un ${esc(dWeekday.format(new Date(s.first.t)))}, le ${esc(date(s.first.t))}, à ${esc(dTime.format(new Date(s.first.t)))}. C’est ${esc(nm(s.first.s))} qui a écrit en premier.</p>
      ${firstMsgs.map((m) => (m.x ? quote(m, nm) : `<p class="muted">(une photo, pour commencer)</p>`)).join('')}
      <div class="kpis two"><div><b>${n(s.spanDays)}</b><span>jours depuis</span></div><div><b>${n(s.activeDays)}</b><span>jours à se parler</span></div></div>
      <p class="small">Vous vous êtes écrit ${Math.floor((s.activeDays / s.spanDays) * 100)} % des jours de votre histoire.</p>`, folio()));

    // II. En chiffres
    const shareA = (pa.msgs / s.total) * 100;
    pages.push(page('', `${chapter(nextCh(), 'Vous deux, en chiffres')}
      <div class="kpis"><div><b>${n(s.total)}</b><span>messages</span></div><div><b>${n(s.words)}</b><span>mots</span></div>
      <div><b>${n(s.avgPerDay)}</b><span>messages par jour</span></div><div><b>${n(s.media)}</b><span>photos, vidéos, vocaux</span></div></div>
      <div class="share"><div class="share-bar"><span style="width:${shareA.toFixed(1)}%"></span></div>
      <div class="share-l"><span><i class="dot a"></i>${esc(A)} · ${Math.round(shareA)} %</span><span><i class="dot b"></i>${esc(B)} · ${100 - Math.round(shareA)} %</span></div></div>
      <table class="duel"><tbody>
        <tr><td>${n(pa.msgs)}</td><th>messages envoyés</th><td>${n(pb.msgs)}</td></tr>
        <tr><td>${n(pa.words)}</td><th>mots écrits</th><td>${n(pb.words)}</td></tr>
        <tr><td>${n(pa.avgLen)}</td><th>caractères par message</th><td>${n(pb.avgLen)}</td></tr>
        <tr><td>${delay(pa.replyMedian)}</td><th>temps de réponse médian</th><td>${delay(pb.replyMedian)}</td></tr>
      </tbody><tfoot><tr><td>${esc(A)}</td><th></th><td>${esc(B)}</td></tr></tfoot></table>`, folio()));

    // III. Je t'aime
    if (s.loveTotal > 0 && s.firstLove) {
      const fl = s.firstLove;
      const after = daysBetween(s.first.t, fl.t);
      const second = s.people.find((p) => p.name !== fl.s && p.firstLove);
      pages.push(page('', `${chapter(nextCh(), '« Je t’aime »')}
        <div class="kpis two love"><div><b>${n(pa.love)}</b><span>fois pour ${esc(A)}</span></div><div><b>${n(pb.love)}</b><span>fois pour ${esc(B)}</span></div></div>
        <p class="lead">${esc(nm(fl.s))} l’a écrit en premier, le ${esc(date(fl.t))}, ${after} ${pl(after, 'jour', 'jours')} après votre premier message.${second ? ` ${esc(nm(second.name))} a répondu ${(() => { const dd = second.firstLove.t - fl.t; return dd < 3600e3 ? 'dans la minute' : dd < 864e5 ? 'le jour même' : daysBetween(fl.t, second.firstLove.t) + ' jours plus tard'; })()}.` : ''}</p>
        ${quote(fl, nm, ' à ' + dTime.format(new Date(fl.t)))}
        ${chartLove(s.months)}
        ${s.loveDay.k ? `<p class="small">Record : ${n(s.loveDay.n)} « je t’aime » le ${esc(date(s.loveDay.t))}.</p>` : ''}`, folio()));
    } else {
      pages.push(page('', `${chapter(nextCh(), '« Je t’aime »')}
        <p class="lead">Vous ne l’écrivez pas, vous le dites autrement.</p>
        <div class="kpis two"><div><b>${n(s.missTotal)}</b><span>« tu me manques »</span></div><div><b>${n(pa.night + pb.night)}</b><span>« bonne nuit »</span></div></div>`, folio()));
    }

    // IV. Le fil du temps
    const tm = s.topMonth;
    pages.push(page('', `${chapter(nextCh(), 'Le fil du temps')}
      ${chartMonths(s.months)}
      <div class="legend"><span><i class="dot a"></i>${esc(A)}</span><span><i class="dot b"></i>${esc(B)}</span></div>
      <ul class="facts">
        <li><b>Le mois le plus bavard</b>${esc(dMonth.format(new Date(tm.t)))}, avec ${n(tm.a + tm.b)} messages.</li>
        <li><b>La journée record</b>le ${esc(date(s.busiest.t))} : ${n(s.busiest.n)} messages en une journée.</li>
        <li><b>La plus longue série</b>${n(s.streak.len)} jours d’affilée, du ${esc(date(s.streak.fromT))} au ${esc(date(s.streak.toT))}.</li>
        ${s.silence.days >= 1 ? `<li><b>Le plus long silence</b>${n(s.silence.days)} ${pl(s.silence.days, 'jour', 'jours')}, jusqu’au ${esc(date(s.silence.to))}.</li>` : ''}
      </ul>`, folio()));

    // Une page par année
    const maxYear = s.years.reduce((b, y) => (y.total > b.total ? y : b), s.years[0]);
    const maxLoveYear = s.years.reduce((b, y) => (y.loveTotal > b.loveTotal ? y : b), s.years[0]);
    s.years.forEach((y, i) => {
      let tag;
      if (i === 0) tag = 'L’année de la rencontre';
      else if (i === s.years.length - 1 && new Date(s.last.t).getMonth() < 11) tag = 'L’année en cours';
      else if (y === maxLoveYear && y.loveTotal > 0) tag = 'L’année des « je t’aime »';
      else if (y === maxYear) tag = 'L’année où vous vous êtes le plus écrit';
      else tag = `${n(y.activeDays)} jours ensemble, au fil des messages`;
      const prevY = s.years[i - 1];
      const evo = prevY ? Math.round(((y.total - prevY.total) / Math.max(1, prevY.total)) * 100) : null;
      pages.push(page('pg-year', `<header class="yr"><span class="ch-n">${esc(tag)}</span><h2>${y.year}</h2></header>
        <div class="kpis"><div><b>${n(y.total)}</b><span>messages${evo != null ? ` · ${evo >= 0 ? '+' : ''}${evo} %` : ''}</span></div>
        <div><b>${n(y.loveTotal)}</b><span>« je t’aime »</span></div>
        <div><b>${y.topMonth != null ? esc(MONTHS[y.topMonth]) : '—'}</b><span>mois le plus intense</span></div>
        <div><b class="emo">${y.topEmoji.map((e) => esc(e[0])).join(' ') || '—'}</b><span>emojis de l’année</span></div></div>
        ${y.topWords.length ? `<p class="small">Vos mots de ${y.year} : ${y.topWords.slice(0, 4).map((w) => `<em>${esc(w[0])}</em>`).join(', ')}.</p>` : ''}
        ${quote(y.quote, nm)}
        <p class="small">${esc(A)} ${n(y.n[0])} messages · ${esc(B)} ${n(y.n[1])} messages${y.busiest ? ` · record le ${esc(date(y.busiest.t))}` : ''}</p>`, folio()));
    });

    // Vos heures
    const peakH = s.hours.map((h) => h[0] + h[1]).reduce((b, v, i, arr) => (v > arr[b] ? i : b), 0);
    const peakD = s.wdays.map((d) => d[0] + d[1]).reduce((b, v, i, arr) => (v > arr[b] ? i : b), 0);
    const owl = pa.owl === pb.owl ? null : pa.owl > pb.owl ? [A, pa.owl] : [B, pb.owl];
    pages.push(page('', `${chapter(nextCh(), 'Vos heures')}
      ${chartClock(s.hours)}
      <p class="lead">Votre heure préférée : ${peakH} h. ${owl ? `${esc(owl[0])} est le cœur de la nuit, avec ${n(owl[1])} messages envoyés entre minuit et 5 h.` : ''}</p>
      ${chartWeek(s.wdays)}
      <p class="small">Le ${WD[peakD]} est le jour où vous vous écrivez le plus.</p>`, folio()));

    // Vos mots
    const col = (p, who) => `<div class="col"><h3>${esc(who)}</h3>
      <ol class="words">${p.topWords.slice(0, 7).map((w) => `<li><span>${esc(w[0])}</span><i>${n(w[1])}</i></li>`).join('')}</ol>
      <p class="emo big">${p.topEmojis.slice(0, 5).map((e) => esc(e[0])).join(' ')}</p>
      ${p.topNick.length ? `<p class="small">Surnom préféré : <em>« ${esc(p.topNick[0][0])} »</em> (${n(p.topNick[0][1])} fois)</p>` : ''}</div>`;
    pages.push(page('', `${chapter(nextCh(), 'Vos mots')}<div class="cols">${col(pa, A)}${col(pb, B)}</div>`, folio()));

    // Les prix
    const AWL = {
      bavard: ['Prix de la conversation', (v) => n(v) + ' messages'],
      romantique: ['Prix du romantisme', (v) => n(v) + ' « je t’aime »'],
      manque: ['Prix du « tu me manques »', (v) => n(v) + ' fois'],
      premierpas: ['Prix du premier pas', (v) => n(v) + ' conversations lancées'],
      matin: ['Prix du premier « bonjour »', (v) => n(v) + ' matins'],
      bonnenuit: ['Prix de la bonne nuit', (v) => n(v) + ' « bonne nuit »'],
      eclair: ['Prix de la réponse éclair', (v) => delay(v) + ' en médiane'],
      nuit: ['Prix de la nuit blanche', (v) => n(v) + ' messages après minuit'],
      rire: ['Prix du fou rire', (v) => n(v) + ' « haha » et « mdr »'],
      emoji: ['Prix de l’emoji', (v) => (v * 100).toFixed(0) + ' emojis / 100 messages'],
      roman: ['Prix du roman-fleuve', (v) => n(v) + ' caractères / message'],
      pardon: ['Prix du pardon', (v) => n(v) + ' « désolé·e »'],
    };
    const aw = s.awards.slice(0, 8);
    pages.push(page('pg-awards', `${chapter(nextCh(), 'La cérémonie des prix')}
      <ul class="awards">${aw.map((a) => {
        const [label, fmt] = AWL[a.key];
        const w = a.winner === 0 ? A : B;
        return `<li><span class="aw-t">${label}</span><span class="aw-w"><i class="dot ${a.winner === 0 ? 'a' : 'b'}"></i>${esc(w)}</span><span class="aw-v">${esc(fmt(a.values[a.winner]))} · contre ${esc(fmt(a.values[1 - a.winner]).replace(/ .*/, ''))}</span></li>`;
      }).join('')}</ul>`, folio()));

    // Moments clés (sur une ou deux pages)
    const ML = (m) => {
      switch (m.kind) {
        case 'first': return `Premier message de ${esc(nm(m.s))}`;
        case 'love': return `Premier « je t’aime » de ${esc(nm(m.s))}`;
        case 'miss': return `Premier « tu me manques », par ${esc(nm(m.s))}`;
        case 'nick': return `${esc(nm(m.s))} écrit « ${esc(m.label)} » pour la première fois`;
        case 'count': return `Votre ${n(m.k)}<sup>e</sup> message, signé ${esc(nm(m.s))}`;
        case 'busiest': return `Journée record : ${n(m.n)} messages`;
        case 'silence': return `Fin de ${n(m.days)} jours de silence : ${esc(nm(m.s))} écrit à nouveau`;
        case 'anniv': return `${m.years} ${pl(m.years, 'an', 'ans')} depuis le premier message`;
        default: return '';
      }
    };
    const items = s.milestones;
    for (let i = 0; i < items.length; i += 9) {
      const chunk = items.slice(i, i + 9);
      pages.push(page('', `${i === 0 ? chapter(nextCh(), 'Les moments clés') : '<header class="ch"><span class="ch-n">Les moments clés, suite</span></header>'}
        <ol class="tl">${chunk.map((m) => `<li class="tl-${m.kind}"><time>${esc(date(m.t))}</time><span>${ML(m)}</span></li>`).join('')}</ol>`, folio()));
    }

    // Fin
    pages.push(page('pg-end', `<p class="end-k">À suivre…</p>
      <p class="end-big">${n(s.spanDays)} jours.<br>${n(s.total)} messages.<br>Et ce n’est que le début.</p>
      ${s.last.x ? `<p class="small">Le dernier message de ce livre, signé ${esc(nm(s.last.s))} le ${esc(date(s.last.t))} :</p><blockquote class="q"><p>${esc(clip(s.last.x, 160))}</p></blockquote>` : ''}`, folio()));

    const style = `--paper:${theme.paper};--ink:${theme.ink};--a:${theme.a};--b:${theme.b};--soft:${theme.soft};--cover:${theme.cover};--cover-ink:${theme.coverInk}`;
    return { html: `<div class="book" style="${style}">${pages.join('')}</div>`, pageCount: pages.length };
  }

  FR.book = { renderBook, THEMES, helpers: { n, date, delay } };
  if (typeof module !== 'undefined' && module.exports) module.exports = FR.book;
})(typeof window !== 'undefined' ? window : globalThis);
