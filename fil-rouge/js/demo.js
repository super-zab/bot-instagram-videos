/* Fil Rouge — conversation fictive (Hugo & Léa) pour montrer le livre avant tout import. */
(function (root) {
  'use strict';
  const FR = (root.FR = root.FR || {});

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const POOL = {
    chat: [
      'Tu fais quoi ce soir ?', 'Je sors du boulot, journée interminable', 'Tu as vu le dernier épisode ?', 'On se fait un resto vendredi ?',
      'J’ai pensé à toi toute la journée', 'Ma mère te passe le bonjour', 'Il pleut encore, Paris en novembre…', 'Tu rentres à quelle heure ?',
      'J’ai acheté du pain et des tomates', 'On regarde un film ce soir ?', 'Ce midi j’ai mangé une salade triste', 'Tu me racontes ta réunion ?',
      'J’ai trouvé un appart trop bien sur le site', 'Le chat a encore cassé un verre', 'On part où cet été ?', 'J’ai réservé pour samedi 20 h',
      'Tu as pensé à appeler le proprio ?', 'Trop hâte d’être ce week-end', 'Le train a 40 minutes de retard', 'On fait des pâtes ?',
      'Tu veux que je passe te chercher ?', 'J’ai réussi mon entretien !!', 'Je suis tellement fier de toi', 'Je suis tellement fière de toi',
      'On devrait refaire la soirée crêpes', 'J’ai réécouté notre chanson', 'Ta playlist tourne en boucle au bureau', 'Tu m’envoies la photo d’hier ?',
      'Je finis mon livre et je dors', 'On invite Sarah et Tom dimanche ?', 'J’ai oublié mes clés chez toi', 'Je t’attends en bas',
    ],
    morning: ['Bonjour toi ☀️', 'Bien dormi ?', 'Coucou, réveillé·e ?', 'Bon courage pour aujourd’hui', 'Hello, café ?', 'Bonjour mon cœur', 'Debout la marmotte'],
    night: ['Bonne nuit ❤️', 'Bonne nuit, fais de beaux rêves', 'Dors bien', 'Je m’endors, bonne nuit bébé', 'Bonne nuit mon cœur 🌙', 'Bonne nuit 😘'],
    love: ['Je t’aime', 'Je t’aime ❤️', 'Je t’aime fort', 'Jtm', 'Je t’aime tellement', 'Je t’aime plus que tout', 'Moi aussi je t’aime 🥰', 'Je t’aime mon amour'],
    miss: ['Tu me manques', 'Tu me manques déjà 🥺', 'Vivement que tu rentres, tu me manques', 'Tu me manques trop'],
    laugh: ['Hahaha', 'MDR', 'Ptdr t’es bête 😂', 'Ahahah non', 'Je suis morte de rire 😂', 'Je suis mort 🤣', 'Hahaha arrête'],
    emoji: ['❤️', '😘', '🥰', '😂', '🙈', '😍', '🫶', '🌙', '😴'],
  };
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  function generate() {
    const r = rng(20230212);
    const A = 'Hugo', B = 'Léa';
    const msgs = [];
    const add = (d, s, x, m) => msgs.push({ t: d.getTime(), s, x: x || '', m: !!m });
    const D = (y, mo, da, h, mi) => new Date(y, mo, da, h, mi, Math.floor(r() * 60));

    // La toute première conversation
    add(D(2023, 1, 12, 23, 47), A, 'Salut Léa ! C’était vraiment cool de te rencontrer à l’anniversaire de Sarah 😊');
    add(D(2023, 1, 12, 23, 52), B, 'Coucou Hugo ! Oui trop, merci de m’avoir raccompagnée');
    add(D(2023, 1, 12, 23, 53), B, 'Tu rentres bien ?');
    add(D(2023, 1, 12, 23, 58), A, 'Oui ! Dis, ça te dirait un verre cette semaine ?');
    add(D(2023, 1, 13, 0, 4), B, 'Avec plaisir 🙈');

    const start = new Date(2023, 1, 13);
    const end = new Date(2026, 9, 28);
    const FIRST_LOVE = 74, NICK = 92;
    for (let day = 1, d = new Date(start); d <= end; day++, d.setDate(d.getDate() + 1)) {
      if (day >= 251 && day <= 256) continue; // une semaine de silence (dispute ou voyage sans réseau)
      let base = day < 25 ? 14 + day * 1.4 : day < 140 ? 52 : 34 + 9 * Math.sin(day / 47);
      if (day >= 520 && day <= 532) base = 4; // vacances ensemble
      if (day === 300) base = 190; // la grande soirée débat
      const n = Math.max(2, Math.round(base * (0.45 + r())));
      const times = [];
      for (let j = 0; j < n; j++) {
        const u = r();
        const h = u < 0.06 ? 7 + r() * 2 : u < 0.35 ? 9 + r() * 8 : u < 0.9 ? 17 + r() * 6 : 23 + r() * 3;
        times.push(h);
      }
      times.sort((a, b) => a - b);
      let who = r() < 0.55 ? B : A;
      times.forEach((h, j) => {
        if (r() < 0.42) who = who === A ? B : A;
        const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        t.setMinutes(Math.floor(h * 60), Math.floor(r() * 60));
        const love = day > FIRST_LOVE;
        const u = r();
        let x;
        let m = false;
        if (j === 0 && h < 11) x = pick(r, POOL.morning);
        else if (j === times.length - 1 && h >= 22) x = love ? pick(r, POOL.night) : 'Bonne nuit !';
        else if (love && u < (who === B ? 0.075 : 0.06)) x = pick(r, POOL.love);
        else if (u < 0.1 && day > 30) x = pick(r, POOL.miss);
        else if (u < 0.2) x = pick(r, POOL.laugh);
        else if (u < 0.25) x = pick(r, POOL.emoji);
        else if (u < 0.3) m = true;
        else x = pick(r, POOL.chat);
        if (x && day > NICK && r() < 0.08) x += who === A ? ' mon cœur' : ' bébé';
        add(t, who, x, m);
      });
      if (day === FIRST_LOVE) {
        add(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 41), B, 'Je crois que je suis en train de tomber amoureuse de toi…');
        add(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 43), A, 'Moi ça fait un moment que c’est fait. Je t’aime Léa ❤️');
        add(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 44), B, 'Je t’aime aussi 🥹');
      }
    }
    msgs.sort((a, b) => a.t - b.t);
    return { source: 'whatsapp', title: 'Hugo & Léa', participants: [A, B], messages: msgs, demo: true };
  }

  FR.demo = { generate };
  if (typeof module !== 'undefined' && module.exports) module.exports = FR.demo;
})(typeof window !== 'undefined' ? window : globalThis);
