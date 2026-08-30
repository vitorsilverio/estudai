// Writes a correction back to an essay submission and marks it as reviewed.
//
// Usage:
//   node scripts/correct-essay.mjs <chave.json> <uid> <essayId> <arquivo-com-a-correcao.txt>

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, uid, essayId, correctionFile] = process.argv;
if (!keyPath || !uid || !essayId || !correctionFile) {
  console.error('Uso: node scripts/correct-essay.mjs <chave.json> <uid> <essayId> <arquivo-com-a-correcao.txt>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const text = readFileSync(correctionFile, 'utf8');
  await db.doc(`users/${uid}/essays/${essayId}`).set(
    {
      status: 'reviewed',
      correction: { text, reviewedAt: new Date().toISOString() },
    },
    { merge: true },
  );
  console.log(`Correção salva em users/${uid}/essays/${essayId}.`);
}

main().catch((err) => {
  console.error('Falha ao salvar a correção:', err);
  process.exit(1);
});
