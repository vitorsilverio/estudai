export interface EssayCorrection {
  text: string;
  reviewedAt: string; // ISO
}

export interface EssaySubmission {
  id: string;
  createdAt: string; // ISO
  note: string;
  images: string[]; // data URLs (base64 JPEG), one per page
  status: 'pending' | 'reviewed';
  correction: EssayCorrection | null;
}
