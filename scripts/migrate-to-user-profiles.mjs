// One-time migration: progress/{uid} -> users/{uid} (profile) + users/{uid}/examProgress/{examId}.
// Every existing progress document so far belongs to the fiscal-sanitario-sao-roque-2026 exam,
// so that's the examId used for the migrated copy. Deletes the old progress/{uid} doc only after
// the new copy is confirmed written.
//
// Usage:
//   node scripts/migrate-to-user-profiles.mjs path/to/serviceAccountKey.json

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const LEGACY_EXAM_ID = 'fiscal-sanitario-sao-roque-2026';

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Uso: node scripts/migrate-to-user-profiles.mjs <caminho-da-chave-de-servico.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.collection('progress').get();
  if (snap.empty) {
    console.log('Nenhum documento em progress/ para migrar.');
    return;
  }

  for (const legacyDoc of snap.docs) {
    const uid = legacyDoc.id;
    const data = legacyDoc.data();
    const owner = data._owner ?? {};

    await db.doc(`users/${uid}/examProgress/${LEGACY_EXAM_ID}`).set(data);

    await db.doc(`users/${uid}`).set(
      {
        activeExamId: LEGACY_EXAM_ID,
        email: owner.email ?? null,
        displayName: owner.displayName ?? null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    await legacyDoc.ref.delete();

    console.log(`Migrado: ${uid} (${owner.displayName ?? '?'}) -> users/${uid}/examProgress/${LEGACY_EXAM_ID}`);
  }

  console.log(`Concluído: ${snap.size} usuário(s) migrado(s).`);
}

main().catch((err) => {
  console.error('Falha na migração:', err);
  process.exit(1);
});
