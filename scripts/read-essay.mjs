// Downloads the page images of one essay submission to local files so they can be viewed
// (e.g. with Claude Code's Read tool) before writing a correction.
//
// Usage:
//   node scripts/read-essay.mjs path/to/serviceAccountKey.json <uid> <essayId> [outDir]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, uid, essayId, outDir = '.'] = process.argv;
if (!keyPath || !uid || !essayId) {
  console.error('Uso: node scripts/read-essay.mjs <chave.json> <uid> <essayId> [outDir]');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.doc(`users/${uid}/essays/${essayId}`).get();
  if (!snap.exists) {
    console.error('Redação não encontrada.');
    process.exit(1);
  }
  const essay = snap.data();
  mkdirSync(outDir, { recursive: true });

  essay.images.forEach((dataUrl, i) => {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const filePath = path.join(outDir, `${essayId}-p${i + 1}.jpg`);
    writeFileSync(filePath, Buffer.from(base64, 'base64'));
    console.log(`Salvo: ${filePath}`);
  });

  console.log(`\nNota do usuário: ${essay.note || '(sem nota)'}`);
}

main().catch((err) => {
  console.error('Falha ao baixar a redação:', err);
  process.exit(1);
});
