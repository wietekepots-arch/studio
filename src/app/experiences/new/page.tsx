"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Experience,
  DataSensitivity,
  RadarItem
} from '@/app/lib/radar-types';
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Tool,
  Award,
  Clock,
  ShieldAlert,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

export default function NewExperiencePage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillToolId = searchParams.get('toolId');
  const { user } = useUser();
  const db = useFirestore();

  const [loading, setLoading] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  
  const toolsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'radarItems'), where('status', '==', 'Approved'));
  }, [db]);

  const { data: allTools } = useCollection<RadarItem>(toolsQuery);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    toolLinks: prefillToolId ? [prefillToolId] : [] as string[],
    howUsed: '',
    promptsOrTemplates: '',
    findings: '',
    recommendations: '',
    roleTitle: '',
    team: '',
    projectContext: '',
    dataSensitivity: 'Internal' as DataSensitivity,
    outcomeRating: 3,
    timeSavedHours: 0,
    tags: '',
  });

  const filteredTools = allTools?.filter(t => 
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) && 
    !formData.toolLinks.includes(t.id)
  ) || [];

  const handleAddTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      toolLinks: [...prev.toolLinks, toolId]
    }));
    setToolSearch('');
  };

  const handleRemoveTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      toolLinks: prev.toolLinks.filter(id => id !== toolId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (formData.toolLinks.length === 0) {
      toast({ title: "Validation Error", description: "Please link at least one tool.", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const experienceData: Partial<Experience> = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => !!t),
      status: 'Published',
      createdAt: Date.now(),
      createdBy: user.uid,
      creatorName: user.displayName || 'Greenberry Member',
      updatedAt: Date.now(),
      updatedBy: user.uid,
      viewsCount: 0,
      likesCount: 0,
    };

    try {
      addDocumentNonBlocking(collection(db, 'experiences'), experienceData);
      toast({ title: "Experience Logged", description: "Your strategic pulse has been added to the collective memory." });
      router.push('/experiences');
    } catch (e) {
      toast({ title: "Error", description: "Failed to save experience. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-10">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground font-bold hover:text-primary">
            <Link href="/experiences">
              <ArrowLeft className="w-5 h-5" />
              Return to Experiences
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase leading-none">Share <br/><span className="text-primary">Your Pulse</span></h1>
              <p className="text-xl text-muted-foreground font-medium">How are you using AI to drive progress?</p>
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="rounded-full px-10 h-14 font-bold text-lg border-2" onClick={() => router.push('/experiences')}>
                Discard
              </Button>
              <Button type="submit" className="gap-2 rounded-full px-12 h-14 font-bold text-lg shadow-lg hover:shadow-primary/20" disabled={loading}>
                <Save className="w-5 h-5" />
                {loading ? 'Logging...' : 'Log Experience'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-8 space-y-10">
              <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none overflow-hidden">
                <CardHeader className="p-10 pb-2">
                  <div className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">Strategic Context</div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="font-bold text-sm tracking-tight text-foreground/70">Experience Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Accelerating Creative Ideation with Claude" 
                      className="h-16 border-2 border-border focus:border-primary rounded-2xl text-xl bg-white/50"
                      required 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="summary" className="font-bold text-sm tracking-tight text-foreground/70">Concise Summary</Label>
                    <Input 
                      id="summary" 
                      placeholder="The essence in one powerful sentence..." 
                      className="h-16 border-2 border-border focus:border-primary rounded-2xl text-lg bg-white/50"
                      required
                      value={formData.summary}
                      onChange={e => setFormData({...formData, summary: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">Linked Tools</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.toolLinks.map(id => {
                        const tool = allTools?.find(t => t.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="gap-2 font-bold px-4 py-2 rounded-full bg-primary text-primary-foreground border-none">
                            {tool?.name || 'Loading...'}
                            <X className="w-4 h-4 cursor-pointer hover:opacity-70" onClick={() => handleRemoveTool(id)} />
                          </Badge>
                        );
                      })}
                      {formData.toolLinks.length === 0 && (
                        <div className="text-sm text-muted-foreground italic py-2">No tools linked yet. Search below.</div>
                      )}
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search Approved tools..." 
                        className="h-14 border-2 border-border focus:border-primary rounded-2xl bg-white/50 pl-12"
                        value={toolSearch}
                        onChange={e => setToolSearch(e.target.value)}
                      />
                      {toolSearch && filteredTools.length > 0 && (
                        <Card className="absolute z-20 w-full mt-2 rounded-2xl border-2 shadow-xl p-2 max-h-60 overflow-y-auto">
                          {filteredTools.map(tool => (
                            <Button 
                              key={tool.id} 
                              variant="ghost" 
                              className="w-full justify-start font-bold h-12 rounded-xl px-4 gap-3"
                              onClick={() => handleAddTool(tool.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {tool.name}
                            </Button>
                          ))}
                        </Card>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none overflow-hidden">
                <CardHeader className="p-10 pb-2">
                  <div className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">The Process</div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">Workflow & Steps</Label>
                    <Textarea 
                      placeholder="Describe the steps you took. Be as detailed as needed." 
                      className="min-h-[200px] border-2 border-border focus:border-primary rounded-2xl text-lg bg-white/50 p-6"
                      required
                      value={formData.howUsed}
                      onChange={e => setFormData({...formData, howUsed: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">Prompts or Templates (Optional)</Label>
                    <Textarea 
                      placeholder="Paste your prompts here for others to reuse." 
                      className="min-h-[150px] font-mono border-2 border-border focus:border-primary rounded-2xl text-base bg-white/50 p-6"
                      value={formData.promptsOrTemplates}
                      onChange={e => setFormData({...formData, promptsOrTemplates: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">Key Findings & Outcomes</Label>
                    <Textarea 
                      placeholder="What worked? What didn't? What were the surprises?" 
                      className="min-h-[200px] border-2 border-border focus:border-primary rounded-2xl text-lg bg-white/50 p-6"
                      required
                      value={formData.findings}
                      onChange={e => setFormData({...formData, findings: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-10">
              <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 p-4">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-[0.2em] text-[10px] text-muted-foreground">Pulse Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Your Role</Label>
                    <Input 
                      placeholder="e.g. Lead Designer" 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      required
                      value={formData.roleTitle}
                      onChange={e => setFormData({...formData, roleTitle: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Studio / Team</Label>
                    <Input 
                      placeholder="e.g. Amsterdam Studio" 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      required
                      value={formData.team}
                      onChange={e => setFormData({...formData, team: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Outcome Rating</Label>
                    <Select value={formData.outcomeRating.toString()} onValueChange={val => setFormData({...formData, outcomeRating: parseInt(val)})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {[5, 4, 3, 2, 1].map(v => (
                          <SelectItem key={v} value={v.toString()} className="font-bold p-3">
                            {v} Star{v > 1 ? 's' : ''} {v === 5 ? '(Game Changer)' : v === 1 ? '(Caution)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 p-4">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-[0.2em] text-[10px] text-muted-foreground">Governance & Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Data Sensitivity
                    </Label>
                    <Select value={formData.dataSensitivity} onValueChange={val => setFormData({...formData, dataSensitivity: val as DataSensitivity})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Public" className="font-bold p-3">Public</SelectItem>
                        <SelectItem value="Internal" className="font-bold p-3">Internal Use Only</SelectItem>
                        <SelectItem value="Client Confidential" className="font-bold p-3">Client Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Time Saved (Hours)
                    </Label>
                    <Input 
                      type="number"
                      placeholder="e.g. 4" 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      value={formData.timeSavedHours}
                      onChange={e => setFormData({...formData, timeSavedHours: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Tags</Label>
                    <Input 
                      placeholder="Comma separated tags..." 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      value={formData.tags}
                      onChange={e => setFormData({...formData, tags: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
