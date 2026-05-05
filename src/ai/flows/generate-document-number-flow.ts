'use server';
/**
 * @fileOverview A Genkit flow for generating a formatted document number from a manual input.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateDocumentNumberInputSchema = z.object({
  manualNumber: z.number().positive('Nomor surat harus angka positif.'),
});
export type GenerateDocumentNumberInput = z.infer<typeof GenerateDocumentNumberInputSchema>;

const GenerateDocumentNumberOutputSchema = z.string();
export type GenerateDocumentNumberOutput = z.infer<typeof GenerateDocumentNumberOutputSchema>;

// Helper function to convert month to Roman numeral
function toRoman(num: number): string {
  const roman = {M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1};
  let str = '';
  for (const i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i as keyof typeof roman]);
    num -= q * roman[i as keyof typeof roman];
    str += i.repeat(q);
  }
  return str;
}


export async function generateDocumentNumber(
  input: GenerateDocumentNumberInput
): Promise<GenerateDocumentNumberOutput> {
  return generateDocumentNumberFlow(input);
}


const generateDocumentNumberFlow = ai.defineFlow(
  {
    name: 'generateDocumentNumberFlow',
    inputSchema: GenerateDocumentNumberInputSchema,
    outputSchema: GenerateDocumentNumberOutputSchema,
  },
  async (input) => {
    // 1. Use the manual number from input
    const newNumber = input.manualNumber;

    // 2. Format the number as requested
    const now = new Date();
    const monthInRoman = toRoman(now.getMonth() + 1);
    const year = now.getFullYear();
    const villageCode = '06';

    const formattedNumber = `${String(newNumber).padStart(3, '0')}/${monthInRoman}/${villageCode}/${year}`;

    return formattedNumber;
  }
);
