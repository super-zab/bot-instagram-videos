/* Fil Rouge — interface : import, personnalisation, aperçu et commande. */
(function () {
  'use strict';
  const FR = window.FR;
  const $ = (s) => document.querySelector(s);
  const { n, date } = FR.book.helpers;

  /* Liens de paiement (Stripe Payment Links, Lemon Squeezy…). Laisser vide = mode démo. */
  const CONFIG = {
    checkout: { pdf: '', souple: '', rigide: '' },
  };
  const FORMATS = [
    { id: 'pdf', name: 'Livre numérique', price: 19, ship: false, items: ['PDF haute définition', 'Prêt à imprimer ou à offrir par e-mail', 'Reçu en quelques minutes'] },
    { id: 'souple', name: 'Livre souple', price: 39, was: 49, ship: true, pop: 'Le plus choisi', items: ['Format A5, couverture souple mate', 'Papier 150 g, impression couleur', 'Livraison offerte en France'] },
    { id: 'rigide', name: 'Édition reliée', price: 69, was: 89, ship: true, items: ['Couverture rigide, dorure du titre', 'Papier 170 g, coffret cadeau', 'Carte manuscrite incluse'] },
  ];

  const state = { thread: null, stats: null, demo: true, format: 'souple', pageCount: 0, opts: { nameA: '', nameB: '', title: '', dedication: '', theme: 'bordeaux' } };

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  };

  function setStatus(msg, kind) {
    const el = $('#status');
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  function load(thread, isDemo) {
    const stats = FR.analyze(thread);
    state.thread = thread;
    state.stats = stats;
    state.demo = !!isDemo;
    state.opts.nameA = '';
    state.opts.nameB = '';
    $('#nameA').value = '';
    $('#nameB').value = '';
    $('#nameA').placeholder = stats.names[0];
    $('#nameB').placeholder = stats.names[1];
    $('#lblA').textContent = 'Prénom affiché pour ' + stats.names[0];
    $('#lblB').textContent = 'Prénom affiché pour ' + stats.names[1];
    render();
  }

  function render() {
    const s = state.stats;
    if (!s) return;
    const { html, pageCount } = FR.book.renderBook(s, state.opts);
    state.pageCount = pageCount;
    $('#book-root').innerHTML = html;

    // Deux pages en vitrine dans l'en-tête : couverture + « je t'aime »
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const book = tmp.firstElementChild;
    const pages = [...book.children];
    book.replaceChildren(pages[0], pages[4] || pages[1]);
    $('#hero-book').replaceChildren(book);

    const A = state.opts.nameA || s.names[0];
    const B = state.opts.nameB || s.names[1];
    const [pa, pb] = s.people;
    $('#live').innerHTML = `<span>${state.demo ? 'Exemple :' : 'Chez vous :'}</span><span><b>${esc(A)}</b> a écrit « je t’aime » ${n(pa.love)} fois, <b>${esc(B)}</b> ${n(pb.love)} fois.</span>`;

    const badge = $('#badge');
    badge.className = 'badge' + (state.demo ? '' : ' mine');
    badge.textContent = state.demo
      ? `Exemple : ${A} & ${B}, conversation fictive · ${pageCount} pages`
      : `Votre livre : ${A} & ${B} · ${n(s.total)} messages · ${pageCount} pages`;
    renderRecap();
  }

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Import ---------- */
  async function readFiles(files) {
    const entries = [];
    for (const f of files) {
      if (/\.zip$/i.test(f.name) || f.type === 'application/zip') {
        if (!window.JSZip) throw new Error('Lecture des .zip indisponible : décompressez le fichier et déposez le .txt ou les .json.');
        const zip = await window.JSZip.loadAsync(f);
        const jobs = [];
        zip.forEach((p, e) => {
          if (e.dir || /(^|\/)__MACOSX\//.test(p)) return;
          if (/\.txt$/i.test(p) || /\.json$/i.test(p)) jobs.push(e.async('string').then((text) => entries.push({ path: p, text })));
        });
        await Promise.all(jobs);
      } else {
        entries.push({ path: f.webkitRelativePath || f.name, text: await f.text() });
      }
    }
    return entries;
  }

  async function handleFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    $('#threads').hidden = true;
    setStatus('Lecture de ' + (files.length > 1 ? files.length + ' fichiers' : '« ' + files[0].name + ' »') + '…');
    try {
      const entries = await readFiles(files);
      await new Promise((r) => setTimeout(r, 20));
      const threads = FR.parsers.collectThreads(entries);
      if (!threads.length) {
        setStatus('Aucune conversation reconnue. Déposez le .zip exporté par WhatsApp, ou le dossier messages d’Instagram ou Messenger au format JSON.', 'err');
        return;
      }
      if (threads.length === 1) return pick(threads[0]);
      setStatus(threads.length + ' conversations trouvées. Laquelle raconte votre histoire ?');
      const box = $('#threads');
      box.replaceChildren(...threads.slice(0, 12).map((th) => {
        const b = document.createElement('button');
        b.type = 'button';
        const who = th.participants && th.participants.length ? th.participants.join(', ') : th.title;
        b.innerHTML = `<span>${esc(th.title || who)}</span><span>${n(th.messages.length)} messages</span>`;
        b.addEventListener('click', () => pick(th));
        return b;
      }));
      box.hidden = false;
    } catch (e) {
      console.error(e);
      setStatus(e.message || 'Le fichier n’a pas pu être lu. Réessayez avec l’export d’origine.', 'err');
    }
  }

  function pick(thread) {
    try {
      load(thread, false);
      $('#threads').hidden = true;
      const s = state.stats;
      setStatus(`${n(s.total)} messages entre ${s.names[0]} et ${s.names[1]}, du ${date(s.first.t)} au ${date(s.last.t)}. Votre livre est prêt.`, 'ok');
      setTimeout(() => $('#apercu').scrollIntoView({ behavior: 'smooth' }), 500);
    } catch (e) {
      setStatus(e.message, 'err');
    }
  }

  /* ---------- Commande ---------- */
  function renderFormats() {
    $('#formats').innerHTML = FORMATS.map((f) => `<label class="fmt">
        <input type="radio" name="format" value="${f.id}" id="fmt-${f.id}" ${f.id === state.format ? 'checked' : ''}>
        ${f.pop ? `<span class="pop">${f.pop}</span>` : ''}
        <h3>${f.name}</h3>
        <p class="price">${f.price} €${f.was ? `<s>${f.was} €</s>` : ''}</p>
        <ul>${f.items.map((i) => `<li>${i}</li>`).join('')}</ul>
      </label>`).join('');
    $('#formats').addEventListener('change', (e) => {
      if (e.target.name === 'format') { state.format = e.target.value; renderRecap(); }
    });
  }

  function renderRecap() {
    const f = FORMATS.find((x) => x.id === state.format);
    const qty = +$('#qty').value || 1;
    const s = state.stats;
    const A = state.opts.nameA || s.names[0];
    const B = state.opts.nameB || s.names[1];
    $('#recap').innerHTML = `<div><span>${esc(f.name)} · ${esc(A)} & ${esc(B)}</span><span>${f.price} €</span></div>
      <div class="muted"><span>${state.pageCount} pages · ${n(s.total)} messages</span><span>× ${qty}</span></div>
      <div class="muted"><span>Livraison</span><span>${f.ship ? 'offerte' : 'par e-mail'}</span></div>
      <div class="tot"><span>Total</span><span>${f.price * qty} €</span></div>`;
    $('#ship-fields').hidden = !f.ship;
    $('#co-btn').textContent = `Commander · ${f.price * qty} €`;
  }

  function submitOrder(e) {
    e.preventDefault();
    const f = FORMATS.find((x) => x.id === state.format);
    const err = $('#co-err');
    const email = $('#email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Indiquez une adresse e-mail valide pour recevoir la confirmation.'; $('#email').focus(); return; }
    if (f.ship) {
      for (const id of ['fullname', 'address', 'zip', 'city']) {
        if (!$('#' + id).value.trim()) { err.textContent = 'Complétez l’adresse de livraison.'; $('#' + id).focus(); return; }
      }
    }
    if (state.demo) { err.textContent = 'Importez d’abord votre conversation : l’aperçu affiche pour l’instant l’exemple de Hugo et Léa.'; return; }
    err.textContent = '';
    const s = state.stats;
    const qty = +$('#qty').value || 1;
    const order = {
      id: 'FR-' + Date.now().toString(36).toUpperCase().slice(-6),
      at: new Date().toISOString(),
      format: f.id, qty, total: f.price * qty, email,
      ship: f.ship ? { name: $('#fullname').value.trim(), address: $('#address').value.trim(), zip: $('#zip').value.trim(), city: $('#city').value.trim() } : null,
      book: { names: [state.opts.nameA || s.names[0], state.opts.nameB || s.names[1]], pages: state.pageCount, theme: state.opts.theme, title: state.opts.title },
    };
    const list = store.get('fr-orders') || [];
    list.push(order);
    store.set('fr-orders', list);
    const done = $('#co-done');
    const pay = CONFIG.checkout[f.id];
    done.innerHTML = pay
      ? `<div class="confirm"><b>Commande ${order.id} prête</b><span>Dernière étape : le paiement sécurisé.</span><a class="btn btn-primary" href="${esc(pay)}?prefilled_email=${encodeURIComponent(email)}&client_reference_id=${order.id}" target="_blank" rel="noopener">Payer ${order.total} €</a></div>`
      : `<div class="confirm"><b>Précommande ${order.id} enregistrée</b><span>${esc(f.name)} × ${qty} · ${order.total} €. Le paiement en ligne n’est pas encore branché sur cette version de démonstration.</span></div>`;
    done.hidden = false;
  }

  /* ---------- Démarrage ---------- */
  function bind() {
    const drop = $('#drop');
    $('#file').addEventListener('change', (e) => { handleFiles(e.target.files); e.target.value = ''; });
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

    const tabs = [...document.querySelectorAll('[role="tab"]')];
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((o) => { o.setAttribute('aria-selected', String(o === t)); $('#' + o.getAttribute('aria-controls')).hidden = o !== t; });
    }));

    let raf = 0;
    const onInput = () => {
      state.opts.nameA = $('#nameA').value.trim();
      state.opts.nameB = $('#nameB').value.trim();
      state.opts.title = $('#title').value.trim();
      state.opts.dedication = $('#dedication').value.trim();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    };
    $('#custom').addEventListener('input', onInput);
    $('#custom').addEventListener('submit', (e) => e.preventDefault());

    $('#swatches').innerHTML = Object.entries(FR.book.THEMES).map(([id, t]) =>
      `<button type="button" class="sw" data-theme-id="${id}" aria-pressed="${id === state.opts.theme}"><i style="background:linear-gradient(135deg, ${t.cover} 55%, ${t.b} 55%)"></i>${t.label}</button>`).join('');
    $('#swatches').addEventListener('click', (e) => {
      const b = e.target.closest('.sw');
      if (!b) return;
      state.opts.theme = b.dataset.themeId;
      document.querySelectorAll('.sw').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });

    renderFormats();
    $('#qty').addEventListener('change', renderRecap);
    $('#checkout').addEventListener('submit', submitOrder);

    // L'impression n'est possible que hors cadre (site autonome)
    let framed = true;
    try { framed = window.self !== window.top; } catch (e) { framed = true; }
    if (!framed) {
      $('#print').hidden = false;
      $('#print').addEventListener('click', () => window.print());
    }
  }

  bind();
  load(FR.demo.generate(), true);
})();
