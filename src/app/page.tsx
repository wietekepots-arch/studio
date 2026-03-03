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
  Tag,
  ChevronRight,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Globe
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
    quadrantId: 0, // Creation & Craft
    ringId: 0, // Adopt
    tags: ['LLM', 'Anthropic', 'Coding'],
    team: 'Creative Tech',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Anthropic is committed to safety but large training runs have high energy impact. No local hosting option.',
    securityNotes: 'Enterprise Tier provides data isolation. SOC2 compliant.',
    links: ['https://claude.ai'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 10000000,
    createdBy: 'u1',
    updatedAt: Date.now(),
    updatedBy: 'u1'
  },
  {
    id: '2',
    name: 'Cursor',
    shortDesc: 'AI-first code editor built on VS Code.',
    notes: 'Incredible DX for agentic coding. Most productive tool for our frontend engineers currently.',
    quadrantId: 0, // Creation & Craft
    ringId: 0, // Adopt
    tags: ['Editor', 'Agentic', 'IDE'],
    team: 'Engineering',
    ownerId: 'u2',
    ownerName: 'Bob Jones',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Lightweight client, but cloud features depend on large models.',
    securityNotes: 'Privacy mode available; does not use your code for training.',
    links: ['https://cursor.com'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 15000000,
    createdBy: 'u2',
    updatedAt: Date.now() - 500000,
    updatedBy: 'u2'
  },
  {
    id: '3',
    name: 'Transcriptor',
    shortDesc: 'High-accuracy AI transcription and meeting summarization tool.',
    notes: 'Used for automated client meeting minutes and stakeholder interviews.',
    quadrantId: 2, // Process & Flow
    ringId: 1, // Trial
    tags: ['Audio', 'Productivity'],
    team: 'Strategy',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 3, impact: 4, effort: 2, risk: 2 },
    costRange: 'Medium',
    origin: 'European',
    sustainabilityNotes: 'Uses European servers with 100% renewable energy commitments.',
    securityNotes: 'Fully GDPR compliant with data residency in the EU.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 5000000,
    createdBy: 'u1',
    updatedAt: Date.now() - 100000,
    updatedBy: 'u1'
  },
  {
    id: '4',
    name: 'Firebase Studio',
    shortDesc: 'Integrated prototyping and deployment suite for Firebase apps.',
    notes: 'Excellent for rapid prototyping with built-in Genkit support.',
    quadrantId: 0, // Creation & Craft
    ringId: 0, // Adopt
    tags: ['Platform', 'Firebase', 'Dev'],
    team: 'Engineering',
    ownerId: 'u3',
    ownerName: 'Alice Wong',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
    costRange: 'Free',
    origin: 'American',
    sustainabilityNotes: 'Google Cloud is carbon neutral since 2007.',
    securityNotes: 'Standard Firebase security rules and IAM integration.',
    links: ['https://firebase.google.com'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 2000000,
    createdBy: 'u3',
    updatedAt: Date.now(),
    updatedBy: 'u3'
  },
  {
    id: '5',
    name: 'Google Stitch',
    shortDesc: 'Experimental AI data-orchestration and linking layer.',
    notes: 'Potentially useful for stitching together disparate RAG sources.',
    quadrantId: 1, // Strategy & Intelligence
    ringId: 2, // Assess
    tags: ['Data', 'RAG', 'Google'],
    team: 'Data Science',
    ownerId: 'u4',
    ownerName: 'Kevin Chen',
    scores: { maturity: 2, impact: 4, effort: 3, risk: 3 },
    costRange: 'High',
    origin: 'American',
    sustainabilityNotes: 'Part of Google sustainable infrastructure.',
    securityNotes: 'Enterprise-grade encryption and access controls.',
    links: [],
    status: 'In Review',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1000000,
    createdBy: 'u4',
    updatedAt: Date.now(),
    updatedBy: 'u4'
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

  const recentItems = useMemo(() => {
    return [...MOCK_ITEMS].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visualization & Filters */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase">Design for Progress</h1>
              <p className="text-muted-foreground font-medium">Tracking tools that make an impact.</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search tools..." 
                className="pl-10 border-2 focus:border-primary rounded-full h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={activeQuadrant === undefined ? "default" : "outline"} 
              className="cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
              onClick={() => setActiveQuadrant(undefined)}
            >
              All Focus Areas
            </Badge>
            {DEFAULT_CONFIG.quadrants.map((q, i) => (
              <Badge 
                key={q}
                variant={activeQuadrant === i ? "default" : "outline"} 
                className="cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                onClick={() => setActiveQuadrant(i)}
              >
                {q}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={activeRing === undefined ? "secondary" : "outline"} 
              className="cursor-pointer px-4 py-1.5 rounded-full text-[10px] uppercase font-bold"
              onClick={() => setActiveRing(undefined)}
            >
              All Maturity
            </Badge>
            {DEFAULT_CONFIG.rings.map((r, i) => (
              <Badge 
                key={r}
                variant={activeRing === i ? "secondary" : "outline"} 
                className="cursor-pointer px-4 py-1.5 rounded-full text-[10px] uppercase font-bold"
                onClick={() => setActiveRing(i)}
              >
                {r}
              </Badge>
            ))}
          </div>

          <RadarChart 
            items={filteredItems} 
            config={DEFAULT_CONFIG} 
            activeFilters={{ quadrant: activeQuadrant, ring: activeRing }} 
          />
        </div>

        {/* Right Column: Activity & Lists */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-2 overflow-hidden shadow-sm">
            <CardHeader className="bg-secondary/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5 text-primary" />
                Latest Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm group-hover:text-primary">{item.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updatedAt).toLocaleDateString()}
                        <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 font-black">
                          {DEFAULT_CONFIG.rings[item.ringId]}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="w-5 h-5 text-primary" />
                Impact Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['Sustainability', 'Accessibility', 'AI Safety', 'Efficiency', 'European', 'GDPR'].map(tag => (
                  <Badge key={tag} variant="secondary" className="hover:bg-primary hover:text-white cursor-pointer transition-colors px-3 py-1 font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-primary text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Governance Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                We prioritize tools that align with our <span className="text-primary font-bold">Progress</span> goals. 
                Always verify the <span className="font-bold">Sustainability score</span> for high-compute tools.
              </p>
              <Button asChild className="w-full gap-2 rounded-full font-bold h-11" size="default">
                <Link href="/items/new">
                  Propose Tool
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
