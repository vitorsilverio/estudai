// Reads progress documents from Firestore for inspection/analysis.
//
// Usage:
//   node scripts/read-progress.mjs path/to/serviceAccountKey.json                # lists everyone + active exam
//   node scripts/read-progress.mjs path/to/serviceAccountKey.json <uid>          # one person, all exams
//   node scripts/read-progress.mjs path/to/serviceAccountKey.json <uid> <examId> # one person, one exam, full data

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, uid, examId] = process.argv;
if (!keyPath) {
  console.error('Uso: node scripts/read-progress.mjs <caminho-da-chave-de-servico.json> [uid] [examId]');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function summarize(data) {
  return `${data.points ?? 0} pts, streak ${data.streak?.count ?? 0}, ${data.completedTopicIds?.length ?? 0} tópicos concluídos, ${data.simuladoResults?.length ?? 0} simulados`;
}

async function main() {
  if (uid && examId) {
    const snap = await db.doc(`users/${uid}/examProgress/${examId}`).get();
    if (!snap.exists) {
      console.log('Nenhum progresso encontrado para esse UID/examId.');
      return;
    }
    console.log(JSON.stringify(snap.data(), null, 2));
    return;
  }

  if (uid) {
    const profileSnap = await db.doc(`users/${uid}`).get();
    const profile = profileSnap.exists ? profileSnap.data() : {};
    console.log(`${profile.displayName ?? '?'} <${profile.email ?? '?'}> — exame ativo: ${profile.activeExamId ?? '(nenhum)'}`);
    const examsSnap = await db.collection(`users/${uid}/examProgress`).get();
    for (const doc of examsSnap.docs) {
      console.log(`  ${doc.id}: ${summarize(doc.data())}`);
    }
    return;
  }

  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) {
    console.log('Nenhum usuário ainda.');
    return;
  }
  for (const userDoc of usersSnap.docs) {
    const profile = userDoc.data();
    console.log(`${userDoc.id} — ${profile.displayName ?? '?'} <${profile.email ?? '?'}> — exame ativo: ${profile.activeExamId ?? '(nenhum)'}`);
    const examsSnap = await db.collection(`users/${userDoc.id}/examProgress`).get();
    for (const doc of examsSnap.docs) {
      console.log(`  ${doc.id}: ${summarize(doc.data())}`);
    }
  }
}

main().catch((err) => {
  console.error('Falha ao ler progresso do Firestore:', err);
  process.exit(1);
});
