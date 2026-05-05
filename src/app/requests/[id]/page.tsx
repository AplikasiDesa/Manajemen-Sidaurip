
"use client"

import { useParams, useRouter } from "next/navigation";
import { MOCK_REQUESTS, ServiceStatus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Clock, User, Calendar, Paperclip, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { summarizeServiceRequest } from "@/ai/flows/summarize-service-request";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const request = MOCK_REQUESTS.find(r => r.id === id);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ServiceStatus>(request?.status || 'Pending');

  if (!request) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Request Not Found</h2>
        <Button asChild className="mt-4">
          <Link href="/requests">Back to List</Link>
        </Button>
      </div>
    );
  }

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await summarizeServiceRequest({ textToSummarize: request.description });
      setSummary(result.summary);
      toast({ title: "Summary generated", description: "AI has successfully summarized the request." });
    } catch (error) {
      toast({ variant: "destructive", title: "Summarization failed", description: "Please try again later." });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleStatusChange = (newStatus: ServiceStatus) => {
    setCurrentStatus(newStatus);
    toast({ title: "Status Updated", description: `Request ${request.id} is now ${newStatus}.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/requests"><ArrowLeft className="w-4 h-4" /> Back to Requests</Link>
        </Button>
        <div className="flex gap-2">
           <Badge variant={request.priority === 'High' ? 'destructive' : 'outline'}>{request.priority} Priority</Badge>
           <Badge className="bg-primary">{currentStatus}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-primary">{request.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3" /> {request.customer} • <Calendar className="w-3 h-3" /> {new Date(request.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleSummarize} 
                  disabled={isSummarizing}
                  variant="outline" 
                  className="gap-2 border-accent text-accent hover:bg-accent/10"
                >
                  {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Summary
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {summary && (
                <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-accent font-semibold text-sm">
                    <Sparkles className="w-4 h-4" /> AI Key Insights
                  </div>
                  <p className="text-sm leading-relaxed">{summary}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Description</h4>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attachments
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="relative group aspect-square rounded-lg overflow-hidden border">
                    <Image 
                      src="https://picsum.photos/seed/issue1/400/300" 
                      alt="Attachment" 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105"
                      data-ai-hint="broken computer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button size="sm" variant="secondary">View</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                {request.history.map((item, i) => (
                  <div key={i} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-9 h-9 bg-white border-2 border-muted rounded-full flex items-center justify-center z-10">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.action}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <User className="w-3 h-3" /> {item.user} • {new Date(item.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Update Status</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['Pending', 'In Progress', 'Completed', 'Urgent'] as ServiceStatus[]).map((status) => (
                    <Button 
                      key={status}
                      variant={currentStatus === status ? "default" : "outline"}
                      className={`justify-start gap-2 h-11 ${currentStatus === status ? 'bg-primary' : ''}`}
                      onClick={() => handleStatusChange(status)}
                    >
                      {status === 'Completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Assigned Personnel</label>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                    {request.assignedTo.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{request.assignedTo}</p>
                    <p className="text-xs text-muted-foreground">Lead Technician</p>
                  </div>
                </div>
                <Button variant="link" className="text-xs text-accent mt-2 p-0 h-auto">Reassign Personnel</Button>
              </div>

              <div className="pt-4 border-t space-y-4">
                <Button className="w-full bg-accent text-accent-foreground">Update Request</Button>
                <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10">Archive Request</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary text-primary-foreground shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-bold">Service Target</h4>
              </div>
              <p className="text-sm opacity-90 mb-4">This request is expected to be resolved within 48 hours of creation.</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>SLA Progress</span>
                  <span>75%</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-3/4 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
