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
  CostRange 
} from '@/app/lib/radar-types';
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Wand2,
  HelpCircle
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
        availableTags: ['Frontend', 'Backend', 'Design', 'AI', 'DevOps']
      });

      const quadIdx = DEFAULT_CONFIG.quadrants.indexOf(result.suggestedQuadrant);
      
      setFormData(prev => ({
        ...prev,
        quadrantId: quadIdx >= 0 ? quadIdx.toString() : prev.quadrantId,
        tags: result.suggestedTags.join(', ')
      }));

      toast({ title: "AI Success", description: "Updated quadrant and tags based on your description." });
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
      toast({ title: "AI Success", description: "Generated short description." });
    } catch (e) {
      toast({ title: "AI Error", description: "Failed to generate summary.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation of save
    setTimeout(() => {
      toast({ title: "Success", description: "Radar item created as Draft." });
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Radar
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Propose New Item</h1>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={loading}>
                <Save className="w-4 h-4" />
                Save as Draft
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Core Information</CardTitle>
                  <CardDescription>Tell us about the technology or process.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Next.js" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="notes">Detailed Notes</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-accent gap-1"
                        onClick={handleAiCategorize}
                        disabled={aiLoading}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Suggest
                      </Button>
                    </div>
                    <Textarea 
                      id="notes" 
                      placeholder="Describe what it is, why we should care, and any relevant experience." 
                      className="min-h-[150px]"
                      required
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="shortDesc">Short Description</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-accent gap-1"
                        onClick={handleAiSummarize}
                        disabled={aiLoading}
                      >
                        <Wand2 className="w-3 h-3" />
                        AI Draft
                      </Button>
                    </div>
                    <Input 
                      id="shortDesc" 
                      placeholder="One sentence summary for list views" 
                      required
                      value={formData.shortDesc}
                      onChange={e => setFormData({...formData, shortDesc: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resources & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>External Links (Docs, Vendor, Repo)</Label>
                    {formData.links.map((link, idx) => (
                      <Input 
                        key={idx} 
                        placeholder="https://..." 
                        value={link}
                        onChange={e => {
                          const newLinks = [...formData.links];
                          newLinks[idx] = e.target.value;
                          setFormData({...formData, links: newLinks});
                        }}
                      />
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFormData({...formData, links: [...formData.links, '']})}
                    >
                      Add Another Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Placement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quadrant</Label>
                    <Select value={formData.quadrantId} onValueChange={val => setFormData({...formData, quadrantId: val})}>
                      <SelectTrigger>
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
                    <div className="flex items-center gap-1">
                      <Label>Ring</Label>
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <Select value={formData.ringId} onValueChange={val => setFormData({...formData, ringId: val})}>
                      <SelectTrigger>
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
                    <Label>Tags (Comma separated)</Label>
                    <Input 
                      placeholder="e.g. AI, React, Design" 
                      value={formData.tags}
                      onChange={e => setFormData({...formData, tags: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cost Range</Label>
                    <Select value={formData.costRange} onValueChange={val => setFormData({...formData, costRange: val as CostRange})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free">Free / Open Source</SelectItem>
                        <SelectItem value="Low">Low Cost</SelectItem>
                        <SelectItem value="Medium">Medium Cost</SelectItem>
                        <SelectItem value="High">Enterprise / High Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Relevant Team / Discipline</Label>
                    <Input 
                      placeholder="e.g. Frontend Engineering" 
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