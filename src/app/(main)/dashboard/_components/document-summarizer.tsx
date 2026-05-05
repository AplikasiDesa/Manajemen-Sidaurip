'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { summarizeVillageDocument } from '@/ai/flows/summarize-village-document-flow';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DocumentSummarizer() {
  const [documentText, setDocumentText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!documentText.trim()) {
      toast({
        title: "Input Kosong",
        description: "Silakan masukkan teks dokumen untuk diringkas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary('');

    try {
      const result = await summarizeVillageDocument({ documentContent: documentText });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error summarizing document:', error);
      toast({
        title: "Gagal Meringkas",
        description: "Terjadi kesalahan saat meringkas dokumen. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkas Dokumen</CardTitle>
        <CardDescription>
          Gunakan AI untuk meringkas laporan atau surat resmi menjadi poin-poin penting yang mudah dibaca.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Salin dan tempel konten laporan atau surat di sini..."
          rows={8}
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleSummarize} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Ringkas dengan AI
        </Button>
        {summary && (
          <div className="mt-4 p-4 border rounded-md bg-secondary/50">
            <h3 className="font-semibold mb-2">Hasil Ringkasan:</h3>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
