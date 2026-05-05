'use server';
/**
 * @fileOverview An AI agent for summarizing service requests and communication threads.
 *
 * - summarizeServiceRequest - A function that generates a concise summary of the provided text.
 * - SummarizeServiceRequestInput - The input type for the summarizeServiceRequest function.
 * - SummarizeServiceRequestOutput - The return type for the summarizeServiceRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeServiceRequestInputSchema = z.object({
  textToSummarize: z
    .string()
    .describe('The lengthy service request description or communication thread to summarize.'),
});
export type SummarizeServiceRequestInput = z.infer<
  typeof SummarizeServiceRequestInputSchema
>;

const SummarizeServiceRequestOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided text.'),
});
export type SummarizeServiceRequestOutput = z.infer<
  typeof SummarizeServiceRequestOutputSchema
>;

export async function summarizeServiceRequest(
  input: SummarizeServiceRequestInput
): Promise<SummarizeServiceRequestOutput> {
  return summarizeServiceRequestFlow(input);
}

const summarizeServiceRequestPrompt = ai.definePrompt({
  name: 'summarizeServiceRequestPrompt',
  input: {schema: SummarizeServiceRequestInputSchema},
  output: {schema: SummarizeServiceRequestOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing customer service interactions.
Your task is to provide a concise and clear summary of the provided text, highlighting the key details, issues, and resolutions. The summary should allow a service agent to quickly understand the core of the request or conversation without reading the full original text.

Text to summarize: {{{textToSummarize}}}`,
});

const summarizeServiceRequestFlow = ai.defineFlow(
  {
    name: 'summarizeServiceRequestFlow',
    inputSchema: SummarizeServiceRequestInputSchema,
    outputSchema: SummarizeServiceRequestOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeServiceRequestPrompt(input);
    return output!;
  }
);
