"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MessageSquare, 
  History, 
  Edit,
  MoreVertical,
  Circle,
  Leaf,
  Shield,
  Globe,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DEFAULT_CONFIG, RadarItem } from '@/app/lib/radar-types';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const getItem = (id: string): RadarItem => {
  const items: Record<string, RadarItem> = {
    '1': {
      id: '1',
      name: 'Claude 3.5 Sonnet',
      shortDesc: 'State-of-the-art LLM by Anthropic with high reasoning capabilities.',
      notes: 'Anthropic\'s most capable model to date. Demonstrates exceptional performance in coding and complex reasoning. Now surpassed by 4.6.',
      quadrantId: 0,
      ringId: 3, // HOLD
      previousRingId: 0,
      tags: ['LLM', 'Anthropic', 'Coding'],
      team: 'Creative Tech',
      ownerId: 'u1',
      ownerName: 'Jane Smith',
      scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
      costRange: 'Medium',
      origin: 'American',
      sustainabilityNotes: 'Anthropic is committed to safety but large training runs have high energy impact.',
      securityNotes: 'Enterprise Tier provides data isolation. SOC2 Type II.',
      links: ['https://claude.ai'],
      status: 'Approved',
      lastReviewedAt: Date.now() - 1000000,
      createdAt: Date.now() - 10000000,
      createdBy: 'u1',
      updatedAt: Date.now() - 500000,
      updatedBy: 'u1',
      history: [
        { id: 'h1', itemId: '1', action: 'Moved to Hold', note: 'Outdated model', createdAt: Date.now(), createdBy: 'Admin' },
        { id: 'h0', itemId: '1', action: 'Adopted', note: 'Initial implementation', createdAt: Date.now() - 10000000, createdBy: 'Jane Smith' }
      ]
    },
    '12': {
      id: '12',
      name: 'Claude 4.6 Sonnet',
      shortDesc: 'The latest flagship model from Anthropic, surpassing 3.5 in all benchmarks.',
      notes: 'Enhanced reasoning, vision, and coding efficiency. Replaces 3.5 as our primary focus.',
      quadrantId: 0,
      ringId: 0,
      tags: ['LLM', 'Anthropic', 'New'],
      team: 'Creative Tech',
      ownerId: 'u1',
      ownerName: 'Jane Smith',
      scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
      costRange: 'Medium',
      origin: 'American',
      sustainabilityNotes: 'More efficient compute usage than 3.5 Opus.',
      securityNotes: 'Standard Anthropic safety layer.',
      links: [],
      status: 'Approved',
      lastReviewedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: 'u1',
      updatedAt: Date.now(),
      updatedBy: 'u1',
      history: [
        { id: 'h2', itemId: '12', action: 'Adopted', note: 'New flagship release', createdAt: Date.now(), createdBy: 'Jane Smith' }
      ]
    },
    '3': {
      id: '3',
      name: 'Figma AI',
      shortDesc: 'Generative design and prototyping features directly in Figma.',
      notes: 'Figma\'s new AI suite allows for rapid layout generation, auto-naming of layers, and intelligent prototyping suggestions.',
      quadrantId: 0,
      ringId: 0,
      tags: ['Design', 'UI', 'Generative'],
      team: 'Product Design',
      ownerId: 'u2',
      ownerName: 'Dave Miller',
      scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
      costRange: 'Medium',
      origin: 'American',
      sustainabilityNotes: 'Cloud-based processing within Figma\'s infrastructure.',
      securityNotes: 'Enterprise plans allow turning off AI data training.',
      links: ['https://figma.com/ai'],
      status: 'Approved',
      lastReviewedAt: Date.now(),
      createdAt: Date.now() - 4000000,
      createdBy: 'u2',
      updatedAt: Date.now(),
      updatedBy: 'u2'
    }
  };
  
  return items[id] || items['1'];
};

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = getItem(params.id);
  const [comment, setComment] = useState('');

  const ScoreRow = ({ label, value }: { label: string, value: number }) => (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <Progress value={value * 20} className="h-4 rounded-full bg-secondary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 lg:px-12">
        <div className="flex items-center justify-between mb-16">
          <Button variant="ghost" asChild className="gap-3 -ml-4 text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
              Return to Pulse
            </Link>
          </Button>

          <div className="flex items-center gap-6">
            <Badge variant="outline" className={`gap-2 font-black uppercase py-2 px-6 rounded-full border-2 ${item.ringId === 3 ? 'text-muted-foreground border-muted' : 'text-primary border-primary animate-pulse'}`}>
              <Circle className={`w-2.5 h-2.5 ${item.ringId === 3 ? 'fill-muted-foreground' : 'fill-primary'}`} />
              {DEFAULT_CONFIG.rings[item.ringId]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-14 h-14 border-2">
                  <MoreVertical className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-3xl p-3 min-w-[200px] border-2">
                <DropdownMenuItem className="gap-3 font-bold p-4 rounded-2xl cursor-pointer">
                  <Edit className="w-4 h-4" /> Edit Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-8 space-y-16">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <Badge className="font-black uppercase text-[10px] tracking-[0.2em] px-6 py-2 rounded-full bg-primary/10 text-primary border-none">{DEFAULT_CONFIG.quadrants[item.quadrantId]}</Badge>
                {item.previousRingId !== undefined && item.previousRingId !== item.ringId && (
                  <Badge variant="secondary" className="gap-2 font-black uppercase text-[10px] tracking-[0.2em] px-6 py-2 rounded-full text-blue-500 border-none bg-blue-50">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Moved
                  </Badge>
                )}
              </div>
              <h1 className="text-8xl font-black text-foreground tracking-tighter leading-[0.85]">{item.name}</h1>
              <p className="text-4xl text-muted-foreground/90 font-medium leading-[1.1] max-w-3xl">{item.shortDesc}</p>
              
              <div className="flex flex-wrap gap-3 pt-4">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="px-6 py-2.5 font-bold text-base rounded-full border-2 bg-secondary/10">#{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none rounded-[3rem] bg-secondary/20 p-4 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                    <Leaf className="w-5 h-5" /> Sustainability
                  </div>
                </CardHeader>
                <CardContent className="text-lg font-bold text-foreground/80">
                  {item.sustainabilityNotes ? 'Critical Pulse' : 'Assessment Pending'}
                </CardContent>
              </Card>
              <Card className="border-none rounded-[3rem] bg-secondary/20 p-4 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                    <Shield className="w-5 h-5" /> Security
                  </div>
                </CardHeader>
                <CardContent className="text-lg font-bold text-foreground/80">
                  {item.securityNotes ? 'Governance Logged' : 'Review Required'}
                </CardContent>
              </Card>
              <Card className="border-none rounded-[3rem] bg-secondary/20 p-4 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                    <Globe className="w-5 h-5" /> Origin
                  </div>
                </CardHeader>
                <CardContent className="text-2xl font-black uppercase tracking-widest text-primary">
                  {item.origin}
                </CardContent>
              </Card>
            </div>

            <div className="pt-12">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-secondary/40 p-2 rounded-full h-16 w-full md:w-auto justify-start inline-flex">
                  <TabsTrigger value="overview" className="gap-3 rounded-full px-10 font-black uppercase tracking-widest text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="impact" className="gap-3 rounded-full px-10 font-black uppercase tracking-widest text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Impact</TabsTrigger>
                  <TabsTrigger value="history" className="gap-3 rounded-full px-10 font-black uppercase tracking-widest text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <History className="w-3.5 h-3.5" /> History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-16">
                  <div className="prose prose-2xl max-w-none text-foreground/90 leading-relaxed font-medium">
                    {item.notes}
                  </div>
                </TabsContent>

                <TabsContent value="impact" className="pt-16 space-y-12">
                  <div className="space-y-12">
                    <div className="p-10 rounded-[3rem] bg-secondary/10 border-none">
                      <h4 className="text-primary font-black uppercase tracking-[0.25em] text-xs mb-8 flex items-center gap-4">
                        <Leaf className="w-8 h-8" /> Sustainability Review
                      </h4>
                      <p className="text-3xl leading-snug font-medium text-foreground/80">{item.sustainabilityNotes}</p>
                    </div>
                    
                    <div className="p-10 rounded-[3rem] bg-secondary/10 border-none">
                      <h4 className="text-primary font-black uppercase tracking-[0.25em] text-xs mb-8 flex items-center gap-4">
                        <Shield className="w-8 h-8" /> Security & Privacy
                      </h4>
                      <p className="text-3xl leading-snug font-medium text-foreground/80">{item.securityNotes}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="pt-16">
                  <div className="space-y-8">
                    {item.history?.map((entry, idx) => (
                      <div key={entry.id} className="relative pl-12 pb-12 last:pb-0 border-l-2 border-secondary/40 last:border-transparent">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary" />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black uppercase tracking-tighter">{entry.action}</span>
                            <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">{new Date(entry.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xl text-muted-foreground/80 font-medium italic">"{entry.note}"</p>
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-50">By {entry.createdBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <Card className="sticky top-32 rounded-[3.5rem] border-none shadow-2xl shadow-primary/10 overflow-hidden bg-white">
              <CardHeader className="bg-primary text-primary-foreground p-12">
                <CardTitle className="uppercase font-black tracking-[0.3em] text-[10px] opacity-70">Strategic Pulse</CardTitle>
              </CardHeader>
              <CardContent className="p-12 space-y-12">
                <ScoreRow label="Tool Maturity" value={item.scores.maturity} />
                <ScoreRow label="Potential Impact" value={item.scores.impact} />
                <ScoreRow label="Effort to Build" value={item.scores.effort} />
                <ScoreRow label="Risk Profile" value={item.scores.risk} />
                
                <div className="pt-12 border-t-2 border-secondary/50 space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Investment</span>
                    <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-widest rounded-full px-6 py-2">{item.costRange}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Responsible Guild</span>
                    <span className="text-lg font-black text-primary uppercase tracking-tighter">{item.team}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="px-8 space-y-8">
              <div className="flex items-center gap-4 text-primary">
                <Info className="w-5 h-5" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Lifecycle Data</h4>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-secondary/20 space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Steward</div>
                  <div className="text-xl font-bold">{item.ownerName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Added to Radar</div>
                  <div className="text-xl font-bold">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
