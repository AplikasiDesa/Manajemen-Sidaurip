import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-complaint-feedback-flow.ts';
import '@/ai/flows/summarize-village-document-flow.ts';
import '@/ai/flows/generate-document-number-flow.ts';
