// Converts an Anki tab-separated export (#separator:tab, front<TAB>back per line)
// into this app's flashcard JSON format, saved under
// public/content/<examId>/flashcards/<topicId>.json (repo stays the source of truth;
// run push-content.mjs afterwards to sync into Firestore).
//
// Usage:
//   node scripts/import-anki-flashcards.mjs <arquivo.txt> <examId> <topicId>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [, , txtPath, examId, topicId] = process.argv;
if (!txtPath || !examId || !topicId) {
  console.error('Uso: node scripts/import-anki-flashcards.mjs <arquivo.txt> <examId> <topicId>');
  process.exit(1);
}

const raw = readFileSync(txtPath, 'utf8');
const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0 && !line.startsWith('#'));

const cards = lines.map((line, i) => {
  const [front, back] = line.split('\t');
  if (!front || !back) {
    throw new Error(`Linha ${i + 1} não tem o formato "frente<TAB>verso": ${JSON.stringify(line)}`);
  }
  return {
    id: `${topicId}-fc-${i + 1}`,
    topicId,
    front: front.trim(),
    back: back.trim(),
  };
});

const outDir = path.join(__dirname, '..', 'public', 'content', examId, 'flashcards');
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${topicId}.json`);
writeFileSync(outPath, JSON.stringify(cards, null, 2) + '\n', 'utf8');

console.log(`${cards.length} flashcards escritos em ${outPath}`);
