// Reads progress documents from Firestore for inspection/analysis.
//
// Usage:
//   node scripts/read-progress.mjs path/to/serviceAccountKey.json           # lists everyone
//   node scripts/read-progress.mjs path/to/serviceAccountKey.json <uid>     # one person's full data

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, uid] = process.argv;
if (!keyPath) {
  console.error('Uso: node scripts/read-progress.mjs <caminho-da-chave-de-servico.json> [uid]');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  if (uid) {
    const snap = await db.doc(`progress/${uid}`).get();
    if (!snap.exists) {
      console.log('Nenhum progresso encontrado para esse UID.');
      return;
    }
    console.log(JSON.stringify(snap.data(), null, 2));
    return;
  }

  const snap = await db.collection('progress').get();
  if (snap.empty) {
    console.log('Nenhum documento de progresso ainda.');
    return;
  }
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(
      `${doc.id} — ${data._owner?.displayName ?? '?'} <${data._owner?.email ?? '?'}> — ${data.points} pts, streak ${data.streak?.count ?? 0}, ${data.completedTopicIds?.length ?? 0} tópicos concluídos, ${data.simuladoResults?.length ?? 0} simulados`,
    );
  }
}

main().catch((err) => {
  console.error('Falha ao ler progresso do Firestore:', err);
  process.exit(1);
});
