'use server';
/**
 * @fileOverview A Genkit flow for summarizing village reports and official letters.
 *
 * - summarizeVillageDocument - A function that handles the document summarization process.
 * - SummarizeVillageDocumentInput - The input type for the summarizeVillageDocument function.
 * - SummarizeVillageDocumentOutput - The return type for the summarizeVillageDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeVillageDocumentInputSchema = z.object({
  documentContent: z.string().describe('The content of the village report or official letter to be summarized.'),
});
export type SummarizeVillageDocumentInput = z.infer<typeof SummarizeVillageDocumentInputSchema>;

const SummarizeVillageDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key points from the provided document.'),
});
export type SummarizeVillageDocumentOutput = z.infer<typeof SummarizeVillageDocumentOutputSchema>;

export async function summarizeVillageDocument(input: SummarizeVillageDocumentInput): Promise<SummarizeVillageDocumentOutput> {
  return summarizeVillageDocumentFlow(input);
}

const summarizeVillageDocumentPrompt = ai.definePrompt({
  name: 'summarizeVillageDocumentPrompt',
  input: { schema: SummarizeVillageDocumentInputSchema },
  output: { schema: SummarizeVillageDocumentOutputSchema },
  prompt: `As an expert village administrator, you need to summarize the following report or official letter. Extract the key points and present them in a clear, concise, and human-readable format.

Document Content:
{{{documentContent}}}`,
});

const summarizeVillageDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeVillageDocumentFlow',
    inputSchema: SummarizeVillageDocumentInputSchema,
    outputSchema: SummarizeVillageDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeVillageDocumentPrompt(input);
    return output!;
  }
);
