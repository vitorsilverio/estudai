// Lists essay submissions (pending first) so it's easy to see what needs correction.
//
// Usage:
//   node scripts/list-essays.mjs path/to/serviceAccountKey.json <uid>

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, uid] = process.argv;
if (!keyPath || !uid) {
  console.error('Uso: node scripts/list-essays.mjs <caminho-da-chave-de-servico.json> <uid>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.collection(`users/${uid}/essays`).orderBy('createdAt', 'desc').get();
  if (snap.empty) {
    console.log('Nenhuma redação enviada ainda.');
    return;
  }
  for (const doc of snap.docs) {
    const e = doc.data();
    const status = e.status === 'reviewed' ? '✅ corrigida' : '⏳ pendente';
    console.log(`${e.id} — ${e.createdAt} — ${status} — ${e.images.length} página(s) — nota: "${e.note || '(sem nota)'}"`);
  }
}

main().catch((err) => {
  console.error('Falha ao listar redações:', err);
  process.exit(1);
});
