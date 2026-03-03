"use client";

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { RadarChart } from '@/components/radar/RadarChart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  History, 
  Clock, 
  Tag,
  ChevronRight
} from 'lucide-react';
import { 
  RadarItem, 
  DEFAULT_CONFIG, 
  ItemStatus 
} from '@/app/lib/radar-types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Seed data focused on AI Tooling
const MOCK_ITEMS: RadarItem[] = [
  {
    id: '1',
    name: 'Claude 3.5 Sonnet',
    shortDesc: 'State-of-the-art LLM by Anthropic with high reasoning capabilities.',
    notes: 'The current gold standard for coding assistance and complex reasoning tasks. Integrated into most of our internal workflows.',
    quadrantId: 0,
    ringId: 0, // Adopt
    tags: ['LLM', 'Anthropic', 'Coding'],
    team: 'AI Research',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
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
    quadrantId: 0,
    ringId: 0, // Adopt
    tags: ['Editor', 'Agentic', 'IDE'],
    team: 'Engineering',
    ownerId: 'u2',
    ownerName: 'Bob Jones',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
    costRange: 'Low',
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
    notes: 'Used for automated client meeting minutes and stakeholder interviews. Great multi-language support.',
    quadrantId: 1,
    ringId: 1, // Trial
    tags: ['Audio', 'Productivity'],
    team: 'Operations',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 3, impact: 4, effort: 2, risk: 2 },
    costRange: 'Medium',
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
    notes: 'The tool we are using right now! Excellent for rapid prototyping with built-in Genkit support.',
    quadrantId: 0,
    ringId: 0, // Adopt
    tags: ['Platform', 'Firebase', 'Dev'],
    team: 'Engineering',
    ownerId: 'u3',
    ownerName: 'Alice Wong',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
    costRange: 'Free',
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
    notes: 'Potentially useful for stitching together disparate RAG sources. Under heavy evaluation.',
    quadrantId: 2,
    ringId: 2, // Assess
    tags: ['Data', 'RAG', 'Google'],
    team: 'Data Science',
    ownerId: 'u4',
    ownerName: 'Kevin Chen',
    scores: { maturity: 2, impact: 4, effort: 3, risk: 3 },
    costRange: 'High',
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
            <h1 className="text-3xl font-bold text-primary">AI Tech Radar</h1>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search AI tools..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={activeQuadrant === undefined ? "default" : "outline"} 
              className="cursor-pointer px-4 py-1"
              onClick={() => setActiveQuadrant(undefined)}
            >
              All Quadrants
            </Badge>
            {DEFAULT_CONFIG.quadrants.map((q, i) => (
              <Badge 
                key={q}
                variant={activeQuadrant === i ? "default" : "outline"} 
                className="cursor-pointer px-4 py-1"
                onClick={() => setActiveQuadrant(i)}
              >
                {q}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={activeRing === undefined ? "secondary" : "outline"} 
              className="cursor-pointer px-4 py-1"
              onClick={() => setActiveRing(undefined)}
            >
              All Rings
            </Badge>
            {DEFAULT_CONFIG.rings.map((r, i) => (
              <Badge 
                key={r}
                variant={activeRing === i ? "secondary" : "outline"} 
                className="cursor-pointer px-4 py-1"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5 text-primary" />
                Recently Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updatedAt).toLocaleDateString()}
                        <Badge variant="outline" className="text-[9px] h-4 py-0 px-1">
                          {DEFAULT_CONFIG.rings[item.ringId]}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="w-5 h-5 text-primary" />
                Trending Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['LLM', 'Agentic', 'Coding', 'RAG', 'Image Gen', 'Transcription'].map(tag => (
                  <Badge key={tag} variant="secondary" className="hover:bg-primary hover:text-white cursor-pointer transition-colors">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary text-sm">Governance Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tools in the <strong>Adopt</strong> ring are verified for use with client data. 
                Always check the security evaluation before using <strong>Assess</strong> items with sensitive info.
              </p>
              <Button asChild className="w-full mt-4 gap-2" size="sm">
                <Link href="/items/new">
                  Propose AI Tool
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
