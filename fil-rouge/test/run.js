// Tests rapides : node fil-rouge/test/run.js
const assert = require('assert');
const path = require('path');
const P = require(path.join(__dirname, '../js/parsers.js'));
const analyze = require(path.join(__dirname, '../js/analyze.js'));
const demo = require(path.join(__dirname, '../js/demo.js'));

// WhatsApp iOS (FR)
const ios = `[12/03/2021, 21:45:12] Léa: ‎Les messages et les appels sont chiffrés de bout en bout. Personne en dehors de ce chat ne peut les lire.
[12/03/2021, 21:45:12] Léa: Coucou toi
[12/03/2021, 21:46:01] Hugo: Salut ! je t'aime déjà haha
sur deux lignes
[13/03/2021, 08:02:00] Hugo: ‎image absente
[14/03/2021, 22:10:00] Léa: Je t’aime aussi bébé ❤️`;
let th = P.parseWhatsApp(ios, 'Discussion WhatsApp avec Léa.txt');
assert.strictEqual(th.messages.length, 4, 'ios count');
assert.strictEqual(th.messages[1].x, "Salut ! je t'aime déjà haha\nsur deux lignes");
assert.strictEqual(th.messages[2].m, true);
assert.strictEqual(new Date(th.messages[0].t).getMonth(), 2);
assert.strictEqual(th.title, 'Léa');

// WhatsApp Android (EN, mm/dd, AM/PM)
const android = `3/12/21, 9:45 PM - Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
3/12/21, 9:45 PM - Lea: hey
3/13/21, 12:05 AM - Hugo: <Media omitted>
3/14/21, 1:10 PM - Lea: love you`;
th = P.parseWhatsApp(android, '_chat.txt');
assert.strictEqual(th.messages.length, 3);
const d0 = new Date(th.messages[1].t);
assert.deepStrictEqual([d0.getMonth(), d0.getDate(), d0.getHours()], [2, 13, 0]);
assert.strictEqual(new Date(th.messages[2].t).getHours(), 13);

// Android FR 24h
th = P.parseWhatsApp(`12/03/2021 21:45 - Léa: salut\n12/03/2021 21:46 - Hugo: yo`, 'x.txt');
assert.strictEqual(th.messages.length, 2);

// Instagram JSON avec mojibake
const ig = { participants: [{ name: 'LÃ©a' }, { name: 'Hugo' }], title: 'LÃ©a',
  messages: [
    { sender_name: 'LÃ©a', timestamp_ms: 1615582000000, content: 'Je tâ\u0080\u0099aime ð\u009f\u0098\u008d', is_geoblocked_for_viewer: false },
    { sender_name: 'Hugo', timestamp_ms: 1615581000000, content: 'Reacted â\u009d¤ to your message', is_geoblocked_for_viewer: false },
    { sender_name: 'Hugo', timestamp_ms: 1615580000000, photos: [{ uri: 'x' }], is_geoblocked_for_viewer: false },
  ] };
const threads = P.collectThreads([{ path: 'messages/inbox/lea_1/message_1.json', text: JSON.stringify(ig) }]);
assert.strictEqual(threads.length, 1);
assert.strictEqual(threads[0].source, 'instagram');
assert.strictEqual(threads[0].messages.length, 2);
assert.strictEqual(threads[0].messages[1].x, 'Je t’aime 😍');
assert.strictEqual(threads[0].messages[1].s, 'Léa');

// Nouveau format Messenger
const ms = { participants: ['Léa', 'Hugo'], threadName: 'Léa', messages: [
  { senderName: 'Léa', timestamp: 1700000000000, text: 'coucou', media: [] },
  { senderName: 'Hugo', timestamp: 1700000100000, text: 'jtm', media: [] } ] };
const t2 = P.collectThreads([{ path: 'Léa_1.json', text: JSON.stringify(ms) }]);
assert.strictEqual(t2[0].source, 'messenger');
assert.strictEqual(analyze(t2[0]).loveTotal, 1);

// Analyse sur la démo
let t0 = Date.now();
const D = demo.generate();
const s = analyze(D);
const ms_ = Date.now() - t0;
assert.deepStrictEqual(s.names, ['Hugo', 'Léa']);
assert.strictEqual(s.firstLove.s, 'Hugo');
assert(s.silence.days > 5, 'silence');
assert(s.awards.length >= 8, 'awards');
console.log('demo:', s.total, 'messages,', s.loveTotal, "je t'aime,", s.years.length, 'années, analyse+génération', ms_, 'ms');
console.log('love:', s.people.map(p => p.name + '=' + p.love).join(' '), '| streak', s.streak.len, '| silence', s.silence.days.toFixed(1), 'j');
console.log('top words', s.people[0].topWords.slice(0, 5), s.people[1].topNick);
console.log('OK — tous les tests passent');
