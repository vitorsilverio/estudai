// One-time migration of ../estudo-concurso/00-plano/mapa-de-erros.md into
// users/{uid}/errorLog/{entryId}. Data transcribed directly from that file.
//
// Usage:
//   node scripts/migrate-error-log.mjs path/to/serviceAccountKey.json <uid>

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, uid] = process.argv;
if (!keyPath || !uid) {
  console.error('Uso: node scripts/migrate-error-log.mjs <caminho-da-chave-de-servico.json> <uid>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Transcrito de 00-plano/mapa-de-erros.md
const entries = [
  { date: '2026-08-19', topicLabel: 'Lei 14.133/2021', questionRef: '1', type: 'NAO_SABIA', note: 'Não existe "supremacia do interesse privado"; celeridade é a questão de fazer algo de forma rápida.' },
  { date: '2026-08-19', topicLabel: 'Lei 14.133/2021', questionRef: '4', type: 'LEU_ERRADO', note: 'Inverti a ordem tanto da preparatória x divulgação do edital, quanto do julgamento x habilitação.' },
  { date: '2026-08-19', topicLabel: 'Lei 14.133/2021', questionRef: '8', type: 'NAO_SABIA', note: 'Ainda não sei outras leis só por número, só lembrava da 8.666/93 — não artigos específicos de outras.' },
  { date: '2026-08-19', topicLabel: 'Lei 14.133/2021', questionRef: '9', type: 'CHUTE_CERTO', note: 'Não fazer ETP caracteriza falta de planejamento; copiar especificação técnica de um único fabricante caracteriza falta de competitividade.' },
  { date: '2026-08-19', topicLabel: 'Lei 14.133/2021', questionRef: '10', type: 'CHUTE_CERTO', note: 'Quem planeja não deve julgar nem fiscalizar: princípio expresso.' },
  { date: '2026-08-20', topicLabel: 'Lei 14.133/2021', questionRef: '2', type: 'PEGADINHA', note: 'Decorar os 6 critérios para não cair em pegadinhas: menor preço, maior desconto, melhor técnica ou conteúdo artístico, técnica e preço, maior lance, maior retorno econômico.' },
  { date: '2026-08-20', topicLabel: 'Lei 14.133/2021', questionRef: '3', type: 'PEGADINHA', note: 'Maior retorno econômico é só para contrato de eficiência, no qual o contratado é remunerado por percentual de economia gerada.' },
  { date: '2026-08-21', topicLabel: 'Lei 14.133/2021', questionRef: '2', type: 'CHUTE_CERTO', note: 'Necessidade → ETP → (se viável) → TR → edital.' },
  { date: '2026-08-21', topicLabel: 'Lei 14.133/2021', questionRef: '8', type: 'CHUTE_CERTO', note: 'Contratação direta também tem fase preliminar; não sabia o conceito, mas a alternativa E fazia mais sentido.' },
  { date: '2026-08-22', topicLabel: 'Crase e Regência', questionRef: '2', type: 'NAO_SABIA', note: 'Obedecer exige "a"; proceder no sentido de "dar início" exige "a".' },
  { date: '2026-08-22', topicLabel: 'Crase e Regência', questionRef: '6', type: 'PEGADINHA', note: 'Achei que era "o relator deu assistência à sessão", mas era "assistiu a" no sentido de ver.' },
  { date: '2026-08-22', topicLabel: 'Crase e Regência', questionRef: '9', type: 'NAO_SABIA', note: 'Implicar no sentido de acarretar é transitivo direto — não tem "em".' },
];

async function main() {
  for (const entry of entries) {
    const id = `${entry.date}-${entry.topicLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${entry.questionRef}`;
    await db.doc(`users/${uid}/errorLog/${id}`).set({ id, ...entry });
    console.log(`OK ${id}`);
  }
  console.log(`Concluído: ${entries.length} entradas migradas para users/${uid}/errorLog.`);
}

main().catch((err) => {
  console.error('Falha na migração do mapa de erros:', err);
  process.exit(1);
});
