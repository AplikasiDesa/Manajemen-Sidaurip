'use server';
/**
 * @fileOverview A Genkit flow for summarizing resident complaints or feedback.
 *
 * - summarizeComplaintFeedback - A function that summarizes a given complaint or feedback text.
 * - SummarizeComplaintFeedbackInput - The input type for the summarizeComplaintFeedback function.
 * - SummarizeComplaintFeedbackOutput - The return type for the summarizeComplaintFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeComplaintFeedbackInputSchema = z.object({
  complaintText: z
    .string()
    .describe('The full text of the resident\'s complaint or feedback.'),
});
export type SummarizeComplaintFeedbackInput = z.infer<
  typeof SummarizeComplaintFeedbackInputSchema
>;

const SummarizeComplaintFeedbackOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the complaint or feedback.'),
  sentiment: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('The overall sentiment of the complaint or feedback.'),
  keywords: z
    .array(z.string())
    .describe('A list of keywords or main topics mentioned in the complaint.'),
});
export type SummarizeComplaintFeedbackOutput = z.infer<
  typeof SummarizeComplaintFeedbackOutputSchema
>;

export async function summarizeComplaintFeedback(
  input: SummarizeComplaintFeedbackInput
): Promise<SummarizeComplaintFeedbackOutput> {
  return summarizeComplaintFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeComplaintFeedbackPrompt',
  input: {schema: SummarizeComplaintFeedbackInputSchema},
  output: {schema: SummarizeComplaintFeedbackOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing public feedback and complaints for village administrators.
Your goal is to provide a concise summary, identify the sentiment, and extract key topics from the given text.

Complaint/Feedback Text: {{{complaintText}}}`,
});

const summarizeComplaintFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeComplaintFeedbackFlow',
    inputSchema: SummarizeComplaintFeedbackInputSchema,
    outputSchema: SummarizeComplaintFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to summarize complaint or feedback.');
    }
    return output;
  }
);
