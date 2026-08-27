// Pushes the study content JSON files (public/content/<examId>/**) into Firestore
// under exams/{examId}/... . Safe to re-run any time: every write is a full
// document overwrite (set), so this is how content gets updated without an app
// redeploy — edit the JSON, run this script, done.
//
// Usage:
//   node scripts/push-content.mjs path/to/serviceAccountKey.json
//
// The service account key is never committed — see .gitignore.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAM_ID = 'fiscal-sanitario-sao-roque-2026';
const CONTENT_DIR = path.join(__dirname, '..', 'public', 'content', EXAM_ID);

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Uso: node scripts/push-content.mjs <caminho-da-chave-de-servico.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(CONTENT_DIR, relativePath), 'utf8'));
}

async function main() {
  let writes = 0;

  const exam = readJson('exam.json');
  await db.doc(`exams/${EXAM_ID}`).set(exam);
  writes++;

  const subjects = readJson('subjects.json');
  for (const subject of subjects) {
    await db.doc(`exams/${EXAM_ID}/subjects/${subject.id}`).set(subject);
    writes++;
  }

  const topics = readJson('topics.json');
  for (const topic of topics) {
    await db.doc(`exams/${EXAM_ID}/topics/${topic.id}`).set(topic);
    writes++;

    const pagesPath = path.join(CONTENT_DIR, 'pages', `${topic.id}.json`);
    if (existsSync(pagesPath)) {
      const pages = JSON.parse(readFileSync(pagesPath, 'utf8'));
      for (const page of pages) {
        await db.doc(`exams/${EXAM_ID}/topics/${topic.id}/pages/${page.id}`).set(page);
        writes++;
      }
    }

    const questionsPath = path.join(CONTENT_DIR, 'questions', `${topic.id}.json`);
    if (existsSync(questionsPath)) {
      const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));
      for (const question of questions) {
        await db.doc(`exams/${EXAM_ID}/topics/${topic.id}/questions/${question.id}`).set(question);
        writes++;
      }
    }
  }

  console.log(`Concluído: ${writes} documentos escritos em exams/${EXAM_ID}.`);
}

main().catch((err) => {
  console.error('Falha ao enviar conteúdo para o Firestore:', err);
  process.exit(1);
});
