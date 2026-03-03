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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    ringId: '2', // Default to Assess
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

      toast({ title: "AI Success", description: "Updated focus area and tags." });
    } catch (e) {
      toast({ title: "AI Error", description: "Failed to categorize item.", variant: "destructive" });
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
      toast({ title: "AI Success", description: "Drafted summary." });
    } catch (e) {
      toast({ title: "AI Error", description: "Failed to generate summary.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Proposal Submitted", description: "Your tool is now in review." });
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground font-bold hover:text-primary">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Radar
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase">Propose New Tool</h1>
              <p className="text-muted-foreground font-medium">Help us evolve our digital craft.</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="rounded-full px-6 font-bold" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2 rounded-full px-8 font-bold" disabled={loading}>
                <Save className="w-4 h-4" />
                Submit Proposal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-8">
              <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
                <CardHeader className="bg-secondary/30">
                  <CardTitle className="uppercase font-black tracking-widest text-sm">Core Identity</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold text-xs uppercase tracking-widest">Tool Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Framer AI" 
                      className="h-12 border-2 rounded-xl focus:ring-primary"
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="notes" className="font-bold text-xs uppercase tracking-widest">Context & Experience</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-primary gap-1 font-bold rounded-full"
                        onClick={handleAiCategorize}
                        disabled={aiLoading}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Suggest
                      </Button>
                    </div>
                    <Textarea 
                      id="notes" 
                      placeholder="Why should this be on our radar? What progress does it enable?" 
                      className="min-h-[150px] border-2 rounded-xl font-medium"
                      required
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="shortDesc" className="font-bold text-xs uppercase tracking-widest">Progress Summary</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-primary gap-1 font-bold rounded-full"
                        onClick={handleAiSummarize}
                        disabled={aiLoading}
                      >
                        <Wand2 className="w-3 h-3" />
                        AI Draft
                      </Button>
                    </div>
                    <Input 
                      id="shortDesc" 
                      placeholder="One powerful sentence..." 
                      className="h-12 border-2 rounded-xl"
                      required
                      value={formData.shortDesc}
                      onChange={e => setFormData({...formData, shortDesc: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
                <CardHeader className="bg-secondary/30">
                  <CardTitle className="uppercase font-black tracking-widest text-sm">Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                        <Leaf className="w-4 h-4 text-primary" /> Sustainability Report
                      </Label>
                      <Textarea 
                        placeholder="Describe the environmental impact or energy efficiency." 
                        className="border-2 rounded-xl font-medium"
                        value={formData.sustainabilityNotes}
                        onChange={e => setFormData({...formData, sustainabilityNotes: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                        <Shield className="w-4 h-4 text-primary" /> Security & Privacy
                      </Label>
                      <Textarea 
                        placeholder="GDPR compliance, data isolation, certifications." 
                        className="border-2 rounded-xl font-medium"
                        value={formData.securityNotes}
                        onChange={e => setFormData({...formData, securityNotes: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-8">
              <Card className="rounded-3xl border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-widest text-xs">Placement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase">Focus Area</Label>
                    <Select value={formData.quadrantId} onValueChange={val => setFormData({...formData, quadrantId: val})}>
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CONFIG.quadrants.map((q, i) => (
                          <SelectItem key={i} value={i.toString()}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase">Trial Ring</Label>
                    <Select value={formData.ringId} onValueChange={val => setFormData({...formData, ringId: val})}>
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CONFIG.rings.map((r, i) => (
                          <SelectItem key={i} value={i.toString()}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Origin
                    </Label>
                    <Select value={formData.origin} onValueChange={val => setFormData({...formData, origin: val as Origin})}>
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="European">European</SelectItem>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-widest text-xs">Commercials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase">Investment Level</Label>
                    <Select value={formData.costRange} onValueChange={val => setFormData({...formData, costRange: val as CostRange})}>
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free">Free / Progress First</SelectItem>
                        <SelectItem value="Low">Low Cost</SelectItem>
                        <SelectItem value="Medium">Medium Cost</SelectItem>
                        <SelectItem value="High">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-[10px] uppercase">Responsible Team</Label>
                    <Input 
                      placeholder="e.g. Creative Strategy" 
                      className="rounded-xl border-2"
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
