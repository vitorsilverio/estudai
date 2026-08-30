export type ErrorType = 'NAO_SABIA' | 'LEU_ERRADO' | 'PEGADINHA' | 'CHUTE_CERTO';

export interface ErrorLogEntry {
  id: string;
  date: string; // yyyy-mm-dd
  topicLabel: string;
  questionRef: string;
  type: ErrorType;
  note: string;
}
