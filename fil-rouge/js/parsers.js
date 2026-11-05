/* Fil Rouge — lecture des exports WhatsApp (.txt), Instagram et Messenger (.json).
 * Tout tourne dans le navigateur : aucune conversation n'est envoyée sur un serveur.
 * Format de sortie commun : { source, title, participants, messages: [{ t, s, x, m }] }
 *   t = timestamp (ms), s = expéditeur, x = texte, m = true si média sans texte. */
(function (root) {
  'use strict';
  const FR = (root.FR = root.FR || {});

  const INVIS = /[‎‏‪-‮⁦-⁩﻿]/g;
  // [12/03/2021, 21:45:12] Léa: …   |   12/03/2021 21:45 - Léa: …   |   3/12/21, 9:45 PM - Léa: …
  const WA_HEAD = /^\[?(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4})[,.]?\s+(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?(?:\s*([AaPp])\.?\s?[Mm]\.?)?\]?\s*(?:[-–—]\s+)?/;
  const WA_SENDER = /^([^:]{1,80}?):\s?([\s\S]*)$/;
  const MEDIA_RE = /^(?:<[^>]*(?:omitted|omis|omise|absent|attached|joint)[^>]*>|(?:image|photo|vid[ée]o|audio|sticker|autocollant|gif|document|contact card|carte de contact|message vocal)\s+(?:omitted|absente?|omise?s?|manquante?)|.*\((?:file attached|fichier joint)\)|null)$/i;
  const DELETED_RE = /^(?:Ce message a été supprimé|Vous avez supprimé ce message|This message was deleted|You deleted this message)\.?$/i;
  const EDITED_RE = /\s*<(?:This message was edited|Ce message a été modifié)>\s*$/i;
  const ENCRYPT_RE = /chiffrés de bout en bout|end-to-end encrypted|cifrados de extremo a extremo/i;
  const REACT_RE = /^(?:Reacted\s.+\sto (?:your|a) message|A réagi\s.+|a réagi\s.+|Liked a message|A aimé un message|a aimé un message)\s*$/i;
  const ATTACH_RE = /^(?:.*\s)?(?:sent an attachment|a envoyé une pièce jointe|sent a photo|a envoyé une photo|sent a voice message|a envoyé un message vocal|sent a video|a envoyé une vidéo)\.?$/i;

  /* Les exports Meta encodent l'UTF-8 octet par octet (« Ã© » au lieu de « é »). */
  function fixMojibake(s) {
    if (typeof s !== 'string' || !s) return s || '';
    if (!/[\u00c2-\u00f4][\u0080-\u00bf]/.test(s)) return s;
    for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 255) return s;
    try {
      const bytes = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      return s;
    }
  }

  function parseWhatsApp(text, fileName) {
    const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    const entries = [];
    let cur = null;
    for (const raw of lines) {
      const line = raw.replace(INVIS, '');
      const h = WA_HEAD.exec(line);
      if (h) {
        const rest = line.slice(h[0].length);
        const sm = WA_SENDER.exec(rest);
        cur = { d: h, s: sm ? sm[1].replace(/^~\s*/, '').trim() : null, x: sm ? sm[2] : rest };
        entries.push(cur);
      } else if (cur) {
        cur.x += '\n' + line;
      }
    }
    // Ordre de la date : jour/mois (FR) par défaut, mois/jour si le 2e champ dépasse 12.
    let order = 'dmy';
    let aOver = false, bOver = false;
    for (const e of entries) {
      if (e.d[1].length === 4) { order = 'ymd'; break; }
      if (+e.d[1] > 12) aOver = true;
      if (+e.d[2] > 12) bOver = true;
    }
    if (order !== 'ymd' && bOver && !aOver) order = 'mdy';

    const messages = [];
    for (const e of entries) {
      if (!e.s) continue; // message système
      const [, a, b, c, hh, mi, ss, ap] = e.d;
      let y, mo, da;
      if (order === 'ymd') { y = +a; mo = +b; da = +c; }
      else if (order === 'mdy') { mo = +a; da = +b; y = +c; }
      else { da = +a; mo = +b; y = +c; }
      if (y < 100) y += 2000;
      let H = +hh;
      if (ap) {
        const p = ap.toLowerCase();
        if (p === 'p' && H < 12) H += 12;
        if (p === 'a' && H === 12) H = 0;
      }
      const t = new Date(y, mo - 1, da, H, +mi, +(ss || 0)).getTime();
      if (!Number.isFinite(t)) continue;
      const x = e.x.replace(EDITED_RE, '').trim();
      if (DELETED_RE.test(x)) continue;
      if (ENCRYPT_RE.test(x) && x.length < 260) continue;
      const media = MEDIA_RE.test(x);
      messages.push({ t, s: e.s, x: media ? '' : x, m: media });
    }
    const title = (fileName || '')
      .replace(/\.txt$/i, '')
      .replace(/^.*\//, '')
      .replace(/^(?:WhatsApp Chat with|Discussion WhatsApp avec|Chat de WhatsApp con)\s*/i, '')
      .replace(/^_chat$/, '');
    const participants = [...new Set(messages.map((m) => m.s))];
    return { source: 'whatsapp', title: title || participants.join(' & '), participants, messages };
  }

  function parseMeta(obj, path) {
    if (!obj || !Array.isArray(obj.messages)) return null;
    let instagram = /instagram/i.test(path || '');
    const messages = [];
    for (const m of obj.messages) {
      if (!m || typeof m !== 'object') continue;
      const s = fixMojibake(m.sender_name ?? m.senderName ?? '');
      let t = Number(m.timestamp_ms ?? m.timestamp);
      if (!s || !Number.isFinite(t) || t <= 0) continue;
      if (t < 1e12) t *= 1000;
      if ('is_geoblocked_for_viewer' in m) instagram = true;
      let x = fixMojibake(m.content ?? m.text ?? '');
      if (typeof x !== 'string') x = '';
      if (m.is_unsent) continue;
      if (REACT_RE.test(x)) continue;
      if (ATTACH_RE.test(x)) x = '';
      const hasMedia = !!(m.photos || m.videos || m.audio_files || m.gifs || m.sticker || m.files || m.share || (Array.isArray(m.media) && m.media.length));
      if (!x && !hasMedia) continue;
      messages.push({ t, s, x: x.trim(), m: !x });
    }
    const participants = (obj.participants || [])
      .map((p) => fixMojibake(typeof p === 'string' ? p : p && p.name))
      .filter(Boolean);
    const title = fixMojibake(obj.title || obj.threadName || '') || participants.join(' & ');
    return { source: instagram ? 'instagram' : 'messenger', title, participants, messages };
  }

  /* entries : [{ path, text }] issus de fichiers isolés ou d'un .zip. */
  function collectThreads(entries) {
    const threads = [];
    const groups = new Map();
    for (const { path, text } of entries) {
      const lower = String(path).toLowerCase();
      if (lower.endsWith('.txt')) {
        const th = parseWhatsApp(text, path);
        if (th.messages.length >= 2) threads.push(th);
      } else if (lower.endsWith('.json')) {
        let obj;
        try { obj = JSON.parse(text); } catch (e) { continue; }
        const th = parseMeta(obj, path);
        if (!th || !th.messages.length) continue;
        const key = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : 'title:' + th.title;
        const g = groups.get(key);
        if (g) { for (const m of th.messages) g.messages.push(m); }
        else groups.set(key, th);
      }
    }
    for (const g of groups.values()) {
      const seen = new Set();
      g.messages = g.messages.filter((m) => {
        const k = m.t + '|' + m.s + '|' + m.x;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      threads.push(g);
    }
    for (const th of threads) th.messages.sort((a, b) => a.t - b.t);
    return threads
      .filter((th) => new Set(th.messages.map((m) => m.s)).size >= 2)
      .sort((a, b) => b.messages.length - a.messages.length);
  }

  FR.parsers = { parseWhatsApp, parseMeta, collectThreads, fixMojibake };
  if (typeof module !== 'undefined' && module.exports) module.exports = FR.parsers;
})(typeof window !== 'undefined' ? window : globalThis);
