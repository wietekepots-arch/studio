"use client";

import React, { useState } from 'react';
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
  DEFAULT_CONFIG, 
  CostRange,
  Origin
} from '@/app/lib/radar-types';
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Wand2,
  Leaf,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aiItemCategorization } from '@/ai/flows/ai-item-categorization-flow';
import { aiShortDescriptionDrafting } from '@/ai/flows/ai-short-description-drafting';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function NewItemPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    shortDesc: '',
    notes: '',
    quadrantId: '0',
    ringId: '2',
    team: '',
    costRange: 'Low' as CostRange,
    origin: 'European' as Origin,
    sustainabilityNotes: '',
    securityNotes: '',
    links: [''],
    tags: '',
  });

  const handleAiCategorize = async () => {
    if (!formData.name || !formData.notes) {
      toast({ title: "Error", description: "Name and notes are required for AI suggestions.", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiItemCategorization({
        itemName: formData.name,
        itemDescription: formData.notes,
        availableQuadrants: DEFAULT_CONFIG.quadrants,
        availableTags: ['Sustainable', 'European', 'Privacy-First', 'GDPR']
      });

      const quadIdx = DEFAULT_CONFIG.quadrants.indexOf(result.suggestedQuadrant);
      
      setFormData(prev => ({
        ...prev,
        quadrantId: quadIdx >= 0 ? quadIdx.toString() : prev.quadrantId,
        tags: result.suggestedTags.join(', ')
      }));

      toast({ title: "AI Pulse", description: "Updated focus area and suggested tags." });
    } catch (e) {
      toast({ title: "AI Pulse Error", description: "Failed to categorize item.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!formData.notes) {
      toast({ title: "Error", description: "Notes are required for summarizing.", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiShortDescriptionDrafting({
        detailedNotes: formData.notes,
        links: formData.links.filter(l => !!l)
      });
      
      setFormData(prev => ({ ...prev, shortDesc: result }));
      toast({ title: "AI Pulse", description: "Drafted a concise summary." });
    } catch (e) {
      toast({ title: "AI Pulse Error", description: "Failed to generate summary.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Proposal Logged", description: "Your tool is now awaiting review." });
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-10">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground font-bold hover:text-primary">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
              Return to Pulse
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase leading-none">Propose <br/><span className="text-primary">New Tool</span></h1>
              <p className="text-xl text-muted-foreground font-medium">Contribute to our collective digital craft.</p>
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="rounded-full px-10 h-14 font-bold text-lg border-2" onClick={() => router.push('/')}>
                Discard
              </Button>
              <Button type="submit" className="gap-2 rounded-full px-12 h-14 font-bold text-lg shadow-lg hover:shadow-primary/20" disabled={loading}>
                <Save className="w-5 h-5" />
                Submit Proposal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-8 space-y-10">
              <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none overflow-hidden">
                <CardHeader className="p-10 pb-2">
                  <div className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">Identity & Context</div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="font-bold text-sm tracking-tight text-foreground/70">Tool Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Cursor AI" 
                      className="h-16 border-2 border-border focus:border-primary rounded-2xl text-xl bg-white/50"
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="notes" className="font-bold text-sm tracking-tight text-foreground/70">Strategic Context</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-primary gap-1.5 font-bold rounded-full hover:bg-primary/10"
                        onClick={handleAiCategorize}
                        disabled={aiLoading}
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Pulse
                      </Button>
                    </div>
                    <Textarea 
                      id="notes" 
                      placeholder="Why should this be on our radar? What progress does it enable?" 
                      className="min-h-[220px] border-2 border-border focus:border-primary rounded-2xl text-lg font-medium bg-white/50 p-6"
                      required
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="shortDesc" className="font-bold text-sm tracking-tight text-foreground/70">Concise Summary</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-primary gap-1.5 font-bold rounded-full hover:bg-primary/10"
                        onClick={handleAiSummarize}
                        disabled={aiLoading}
                      >
                        <Wand2 className="w-4 h-4" />
                        AI Draft
                      </Button>
                    </div>
                    <Input 
                      id="shortDesc" 
                      placeholder="The essence in one powerful sentence..." 
                      className="h-16 border-2 border-border focus:border-primary rounded-2xl text-xl bg-white/50"
                      required
                      value={formData.shortDesc}
                      onChange={e => setFormData({...formData, shortDesc: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none overflow-hidden">
                <CardHeader className="p-10 pb-2">
                  <div className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">Responsibility Review</div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground/70">
                        <Leaf className="w-4 h-4 text-primary" /> Sustainability Impact
                      </Label>
                      <Textarea 
                        placeholder="Environmental impact or efficiency." 
                        className="border-2 border-border focus:border-primary rounded-2xl font-medium h-32 bg-white/50"
                        value={formData.sustainabilityNotes}
                        onChange={e => setFormData({...formData, sustainabilityNotes: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground/70">
                        <Shield className="w-4 h-4 text-primary" /> Security & GDPR
                      </Label>
                      <Textarea 
                        placeholder="Compliance and data isolation." 
                        className="border-2 border-border focus:border-primary rounded-2xl font-medium h-32 bg-white/50"
                        value={formData.securityNotes}
                        onChange={e => setFormData({...formData, securityNotes: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-10">
              <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 p-4">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-[0.2em] text-[10px] text-muted-foreground">Pulse Placement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Strategic Focus</Label>
                    <Select value={formData.quadrantId} onValueChange={val => setFormData({...formData, quadrantId: val})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all hover:bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {DEFAULT_CONFIG.quadrants.map((q, i) => (
                          <SelectItem key={i} value={i.toString()} className="font-bold p-3">{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Maturity Trial</Label>
                    <Select value={formData.ringId} onValueChange={val => setFormData({...formData, ringId: val})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all hover:bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {DEFAULT_CONFIG.rings.map((r, i) => (
                          <SelectItem key={i} value={i.toString()} className="font-bold p-3">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Origin
                    </Label>
                    <Select value={formData.origin} onValueChange={val => setFormData({...formData, origin: val as Origin})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all hover:bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="European" className="font-bold p-3">European</SelectItem>
                        <SelectItem value="American" className="font-bold p-3">American</SelectItem>
                        <SelectItem value="Other" className="font-bold p-3">Global / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 p-4">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-[0.2em] text-[10px] text-muted-foreground">Commercials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Investment</Label>
                    <Select value={formData.costRange} onValueChange={val => setFormData({...formData, costRange: val as CostRange})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all hover:bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Free" className="font-bold p-3">Progress First (Free)</SelectItem>
                        <SelectItem value="Low" className="font-bold p-3">Low Cost</SelectItem>
                        <SelectItem value="Medium" className="font-bold p-3">Standard Agency Tier</SelectItem>
                        <SelectItem value="High" className="font-bold p-3">Enterprise Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">Responsible Guild</Label>
                    <Input 
                      placeholder="e.g. Design Strategy" 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      value={formData.team}
                      onChange={e => setFormData({...formData, team: e.target.value})}
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