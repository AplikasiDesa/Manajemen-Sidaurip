'use server';
/**
 * @fileOverview A Genkit flow that generates placeholder content (text, image ideas, layouts) for a canvas based on a user prompt.
 *
 * - generateCanvasContentFromPrompt - A function that handles the content generation process.
 * - GenerateCanvasContentFromPromptInput - The input type for the generateCanvasContentFromPrompt function.
 * - GenerateCanvasContentFromPromptOutput - The return type for the generateCanvasContentFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCanvasContentFromPromptInputSchema = z.object({
  prompt: z.string().describe('A high-level prompt describing the desired canvas content (e.g., "landing page for a tech startup", "blog post about healthy eating").')
});
export type GenerateCanvasContentFromPromptInput = z.infer<typeof GenerateCanvasContentFromPromptInputSchema>;

const GenerateCanvasContentFromPromptOutputSchema = z.object({
  textBlocks: z.array(z.string()).describe('An array of placeholder text blocks or paragraphs suitable for the canvas.'),
  imageIdeas: z.array(z.string()).describe('An array of descriptive ideas for images that would fit the canvas content.'),
  layoutSuggestions: z.array(z.string()).describe('An array of suggested layout sections (e.g., "hero section with call to action", "three-column feature list", "contact form").')
});
export type GenerateCanvasContentFromPromptOutput = z.infer<typeof GenerateCanvasContentFromPromptOutputSchema>;

const generateContentPrompt = ai.definePrompt({
  name: 'generateCanvasContentFromPromptPrompt',
  input: {schema: GenerateCanvasContentFromPromptInputSchema},
  output: {schema: GenerateCanvasContentFromPromptOutputSchema},
  prompt: `You are an AI assistant specialized in generating placeholder content for design canvases.
Based on the user's high-level prompt, generate relevant placeholder text blocks, descriptive image ideas, and suggested section layouts.
The output should be a JSON object matching the provided schema.

User prompt: "{{{prompt}}}"

Generate diverse and creative ideas for the following:
- Text blocks: Provide 3-5 distinct paragraphs or sections of placeholder text.
- Image ideas: Suggest 3-5 image descriptions that complement the text.
- Layout suggestions: Propose 3-5 common layout sections that would be suitable.`
});

const generateCanvasContentFromPromptFlow = ai.defineFlow(
  {
    name: 'generateCanvasContentFromPromptFlow',
    inputSchema: GenerateCanvasContentFromPromptInputSchema,
    outputSchema: GenerateCanvasContentFromPromptOutputSchema
  },
  async (input) => {
    const {output} = await generateContentPrompt(input);
    return output!;
  }
);

export async function generateCanvasContentFromPrompt(input: GenerateCanvasContentFromPromptInput): Promise<GenerateCanvasContentFromPromptOutput> {
  return generateCanvasContentFromPromptFlow(input);
}
