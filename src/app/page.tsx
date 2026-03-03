"use client";

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { RadarChart } from '@/components/radar/RadarChart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  History, 
  Clock, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  RadarItem, 
  DEFAULT_CONFIG 
} from '@/app/lib/radar-types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MOCK_ITEMS: RadarItem[] = [
  {
    id: '1',
    name: 'Claude 3.5 Sonnet',
    shortDesc: 'State-of-the-art LLM by Anthropic with high reasoning capabilities.',
    notes: 'The current gold standard for coding assistance and complex reasoning tasks.',
    quadrantId: 0,
    ringId: 3, // Moved to HOLD
    previousRingId: 0,
    tags: ['LLM', 'Anthropic', 'Coding'],
    team: 'Creative Tech',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Anthropic is committed to safety but large training runs have high energy impact.',
    securityNotes: 'Enterprise Tier provides data isolation. SOC2 compliant.',
    links: ['https://claude.ai'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 10000000,
    createdBy: 'u1',
    updatedAt: Date.now(),
    updatedBy: 'u1',
    history: [
      { id: 'h1', itemId: '1', action: 'Moved to Hold', note: 'Outdated model', createdAt: Date.now(), createdBy: 'Admin' }
    ]
  },
  {
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
    createdAt: Date.now(), // NEW ITEM
    createdBy: 'u1',
    updatedAt: Date.now(),
    updatedBy: 'u1'
  },
  {
    id: '2',
    name: 'Claude 3 Opus',
    shortDesc: 'Anthropic\'s most powerful model for complex creative tasks.',
    notes: 'Exceptional for deep strategic analysis and long-form creative writing.',
    quadrantId: 1,
    ringId: 0,
    tags: ['LLM', 'Analysis', 'Strategy'],
    team: 'Strategy',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'High',
    origin: 'American',
    sustainabilityNotes: 'High compute requirements; recommend selective use.',
    securityNotes: 'Complies with Anthropic\'s safety guidelines.',
    links: ['https://claude.ai'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 8000000,
    createdBy: 'u1',
    updatedAt: Date.now(),
    updatedBy: 'u1'
  },
  {
    id: '3',
    name: 'Figma AI',
    shortDesc: 'Generative design and prototyping features directly in Figma.',
    notes: 'Significantly speeds up layout exploration and component generation.',
    quadrantId: 0,
    ringId: 0,
    tags: ['Design', 'UI', 'Generative'],
    team: 'Product Design',
    ownerId: 'u2',
    ownerName: 'Dave Miller',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Integrated into Figma\'s cloud infrastructure.',
    securityNotes: 'Standard Figma workspace permissions apply.',
    links: ['https://figma.com/ai'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 4000000,
    createdBy: 'u2',
    updatedAt: Date.now() - 100000,
    updatedBy: 'u2'
  },
  {
    id: '6',
    name: 'Lovable',
    shortDesc: 'AI-powered full-stack app builder for rapid web deployment.',
    notes: 'Great for building functional MVPs in hours instead of days.',
    quadrantId: 0,
    ringId: 1,
    previousRingId: 2, // MOVED
    tags: ['App Builder', 'Fullstack', 'MVP'],
    team: 'Strategy',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 3, impact: 4, effort: 2, risk: 2 },
    costRange: 'Medium',
    origin: 'European',
    sustainabilityNotes: 'Stockholm-based team, modern cloud infra.',
    securityNotes: 'Emerging platform; review data handling.',
    links: ['https://lovable.dev'],
    status: 'In Review',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1000000,
    createdBy: 'u1',
    updatedAt: Date.now(),
    updatedBy: 'u1'
  }
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeQuadrant, setActiveQuadrant] = useState<number | undefined>();
  const [activeRing, setActiveRing] = useState<number | undefined>();

  const filteredItems = useMemo(() => {
    return MOCK_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.shortDesc.toLowerCase().includes(search.toLowerCase());
      const matchesQuadrant = activeQuadrant === undefined || item.quadrantId === activeQuadrant;
      const matchesRing = activeRing === undefined || item.ringId === activeRing;
      return matchesSearch && matchesQuadrant && matchesRing;
    });
  }, [search, activeQuadrant, activeRing]);

  const quadrantItems = useMemo(() => {
    if (activeQuadrant === undefined) return [];
    return MOCK_ITEMS.filter(item => item.quadrantId === activeQuadrant);
  }, [activeQuadrant]);

  const recentItems = useMemo(() => {
    return [...MOCK_ITEMS].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, []);

  const isItemNew = (item: RadarItem) => {
    const twoWeeksAgo = Date.now() - 1000 * 60 * 60 * 24 * 14;
    return item.createdAt > twoWeeksAgo;
  };

  const hasItemMoved = (item: RadarItem) => {
    return item.previousRingId !== undefined && item.previousRingId !== item.ringId;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-8 space-y-12">
          <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-foreground tracking-tighter leading-none">Design for <br/><span className="text-primary">Progress</span></h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg">Tracking the pulse of AI tools that amplify our creative and ethical impact at Greenberry.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search the pulse..." 
                className="pl-12 border-2 border-border focus:border-primary rounded-full h-14 text-lg bg-secondary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={activeQuadrant === undefined ? "default" : "outline"} 
                className="cursor-pointer px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                onClick={() => setActiveQuadrant(undefined)}
              >
                Entire Network
              </Badge>
              {DEFAULT_CONFIG.quadrants.map((q, i) => (
                <Badge 
                  key={q}
                  variant={activeQuadrant === i ? "default" : "outline"} 
                  className="cursor-pointer px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                  onClick={() => setActiveQuadrant(i)}
                >
                  {q}
                </Badge>
              ))}
            </div>

            <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-primary/5 border-2 border-secondary/20 relative overflow-hidden group">
              <div className="absolute top-8 right-12 flex gap-4 z-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
                  <Sparkles className="w-3 h-3 text-primary" /> New Pulse
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
                  <ArrowUpRight className="w-3 h-3 text-blue-500" /> Changed
                </div>
              </div>
              <RadarChart 
                items={filteredItems} 
                config={DEFAULT_CONFIG} 
                activeFilters={{ quadrant: activeQuadrant, ring: activeRing }} 
              />
            </div>

            {activeQuadrant !== undefined && (
              <div className="space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">
                    Focus: <span className="text-primary">{DEFAULT_CONFIG.quadrants[activeQuadrant]}</span>
                  </h3>
                  <Badge variant="secondary" className="font-bold px-4 py-1.5 rounded-full">
                    {quadrantItems.length} Tools Tracked
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quadrantItems.map(item => (
                    <Link 
                      key={item.id} 
                      href={`/items/${item.id}`}
                      className="group p-6 bg-secondary/20 rounded-[2rem] border-2 border-transparent hover:border-primary/20 hover:bg-white transition-all flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold group-hover:text-primary transition-colors">{item.name}</span>
                          {isItemNew(item) && (
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          )}
                          {hasItemMoved(item) && (
                            <ArrowUpRight className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium line-clamp-1">{item.shortDesc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="font-bold uppercase text-[9px] tracking-widest h-6 rounded-full">
                          {DEFAULT_CONFIG.rings[item.ringId]}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2rem] border-none bg-secondary/30 overflow-hidden shadow-none">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
                <History className="w-6 h-6 text-primary" />
                Latest Pulses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between p-8 hover:bg-white/50 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xl group-hover:text-primary transition-colors">{item.name}</span>
                        {isItemNew(item) && <Badge className="text-[9px] h-4 font-black bg-primary/20 text-primary border-none">NEW</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updatedAt).toLocaleDateString()}
                        <div className="w-1 h-1 rounded-full bg-border" />
                        {DEFAULT_CONFIG.rings[item.ringId]}
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20 p-4">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Agency Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-xl leading-snug font-medium">
                We prioritize tools that align with our <span className="opacity-80">Progress</span> goals. 
                Always review sustainability for high-compute models.
              </p>
              <Button asChild variant="secondary" className="w-full gap-2 rounded-full font-bold h-16 text-lg group">
                <Link href="/items/new">
                  Propose a Tool
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="px-8 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Strategic Tags</h4>
            <div className="flex flex-wrap gap-2">
              {['Sustainable', 'European', 'Privacy-First', 'GDPR', 'Open Source'].map(tag => (
                <Badge key={tag} variant="outline" className="bg-white border-2 border-transparent hover:border-primary/30 cursor-pointer transition-all px-6 py-2.5 text-xs font-bold rounded-full uppercase tracking-widest">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
