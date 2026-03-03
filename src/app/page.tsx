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
  ShieldCheck
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
    ringId: 0,
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
    securityNotes: 'Complies with Anthropic\'s safety guidelines and enterprise privacy.',
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
    id: '4',
    name: 'Google Gemini',
    shortDesc: 'Multimodal AI with massive context window (up to 2M tokens).',
    notes: 'Ideal for processing entire codebases or long video/document sets.',
    quadrantId: 1,
    ringId: 0,
    tags: ['LLM', 'Google', 'Multimodal'],
    team: 'Creative Tech',
    ownerId: 'u3',
    ownerName: 'Alice Wong',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Runs on Google\'s carbon-neutral data centers.',
    securityNotes: 'Enterprise data protection via Google Cloud.',
    links: ['https://gemini.google.com'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 2000000,
    createdBy: 'u3',
    updatedAt: Date.now(),
    updatedBy: 'u3'
  },
  {
    id: '5',
    name: 'V0',
    shortDesc: 'Generative UI system for React and Tailwind components by Vercel.',
    notes: 'Transforming how we build initial design-to-code prototypes.',
    quadrantId: 0,
    ringId: 0,
    tags: ['Code', 'Frontend', 'React'],
    team: 'Engineering',
    ownerId: 'u3',
    ownerName: 'Alice Wong',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Optimized on Vercel\'s edge network.',
    securityNotes: 'Public generation by default on free tier; private on pro.',
    links: ['https://v0.dev'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 6000000,
    createdBy: 'u3',
    updatedAt: Date.now(),
    updatedBy: 'u3'
  },
  {
    id: '6',
    name: 'Lovable',
    shortDesc: 'AI-powered full-stack app builder for rapid web deployment.',
    notes: 'Great for building functional MVPs in hours instead of days.',
    quadrantId: 0,
    ringId: 1,
    tags: ['App Builder', 'Fullstack', 'MVP'],
    team: 'Strategy',
    ownerId: 'u1',
    ownerName: 'Jane Smith',
    scores: { maturity: 3, impact: 4, effort: 2, risk: 2 },
    costRange: 'Medium',
    origin: 'European',
    sustainabilityNotes: 'Stockholm-based team, modern cloud infra.',
    securityNotes: 'Emerging platform; review data handling for client projects.',
    links: ['https://lovable.dev'],
    status: 'In Review',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1000000,
    createdBy: 'u1',
    updatedAt: Date.now(),
    updatedBy: 'u1'
  },
  {
    id: '7',
    name: 'Codex 5.3',
    shortDesc: 'Advanced AI for precision code generation and architectural refactoring.',
    notes: 'Testing its capability for large-scale legacy code migrations.',
    quadrantId: 0,
    ringId: 1,
    tags: ['Coding', 'Refactoring', 'Engineering'],
    team: 'Engineering',
    ownerId: 'u3',
    ownerName: 'Alice Wong',
    scores: { maturity: 3, impact: 4, effort: 2, risk: 3 },
    costRange: 'High',
    origin: 'American',
    sustainabilityNotes: 'Significant compute needed for high-quality generations.',
    securityNotes: 'Self-hosted options being explored for high security.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 3000000,
    createdBy: 'u3',
    updatedAt: Date.now(),
    updatedBy: 'u3'
  },
  {
    id: '8',
    name: 'OpenClawd',
    shortDesc: 'Experimental open-source orchestration for local AI workflows.',
    notes: 'Allows us to run lightweight models locally for maximum privacy.',
    quadrantId: 2,
    ringId: 2,
    tags: ['Local', 'Privacy', 'Open Source'],
    team: 'Creative Tech',
    ownerId: 'u4',
    ownerName: 'Kevin Chen',
    scores: { maturity: 2, impact: 3, effort: 3, risk: 1 },
    costRange: 'Free',
    origin: 'Other',
    sustainabilityNotes: 'Zero cloud compute; depends on local hardware efficiency.',
    securityNotes: 'Highest privacy; data never leaves the machine.',
    links: [],
    status: 'Draft',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 500000,
    createdBy: 'u4',
    updatedAt: Date.now(),
    updatedBy: 'u4'
  },
  {
    id: '9',
    name: 'Transcriptor',
    shortDesc: 'High-accuracy AI transcription and meeting summarization tool.',
    notes: 'Used for automated client meeting minutes and stakeholder interviews.',
    quadrantId: 2,
    ringId: 1,
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
    id: '10',
    name: 'Firebase Studio',
    shortDesc: 'Integrated prototyping and deployment suite for Firebase apps.',
    notes: 'Excellent for rapid prototyping with built-in Genkit support.',
    quadrantId: 0,
    ringId: 0,
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
    id: '11',
    name: 'Google Stitch',
    shortDesc: 'Experimental AI data-orchestration and linking layer.',
    notes: 'Potentially useful for stitching together disparate RAG sources.',
    quadrantId: 1,
    ringId: 2,
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
      
      <main className="flex-1 container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-8 space-y-10">
          <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-foreground tracking-tighter leading-none">Design for <br/><span className="text-primary">Progress</span></h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg">The curated lens on AI tools that amplify our creative and ethical impact at Greenberry.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search the radar..." 
                className="pl-12 border-2 border-border focus:border-primary rounded-full h-14 text-lg bg-secondary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={activeQuadrant === undefined ? "default" : "outline"} 
                className="cursor-pointer px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                onClick={() => setActiveQuadrant(undefined)}
              >
                All Focus Areas
              </Badge>
              {DEFAULT_CONFIG.quadrants.map((q, i) => (
                <Badge 
                  key={q}
                  variant={activeQuadrant === i ? "default" : "outline"} 
                  className="cursor-pointer px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                  onClick={() => setActiveQuadrant(i)}
                >
                  {q}
                </Badge>
              ))}
            </div>

            <RadarChart 
              items={filteredItems} 
              config={DEFAULT_CONFIG} 
              activeFilters={{ quadrant: activeQuadrant, ring: activeRing }} 
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2rem] border-none bg-secondary/30 overflow-hidden shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <History className="w-5 h-5 text-primary" />
                Latest Pulses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between p-6 hover:bg-white/50 transition-all group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-lg group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.updatedAt).toLocaleDateString()}
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 font-bold uppercase tracking-wider">
                          {DEFAULT_CONFIG.rings[item.ringId]}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-primary/10 shadow-none p-4">
            <CardHeader>
              <CardTitle className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Agency Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-base text-foreground/80 leading-relaxed font-medium">
                We prioritize tools that align with our <span className="text-primary font-bold">Progress</span> goals. 
                Always check the <span className="font-bold">Sustainability score</span> for high-compute models.
              </p>
              <Button asChild className="w-full gap-2 rounded-full font-bold h-14 text-lg shadow-lg hover:shadow-primary/20" size="default">
                <Link href="/items/new">
                  Propose a Tool
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="px-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Strategic Tags</h4>
            <div className="flex flex-wrap gap-2">
              {['Sustainable', 'European', 'Privacy-First', 'GDPR', 'Open Source'].map(tag => (
                <Badge key={tag} variant="secondary" className="bg-white border-2 border-transparent hover:border-primary/30 cursor-pointer transition-all px-4 py-2 text-sm font-bold rounded-full">
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
