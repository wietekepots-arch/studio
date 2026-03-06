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
  Sparkles
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
    id: 'claude-3-5',
    name: 'Claude 3.5 Sonnet',
    shortDesc: 'High-performance reasoning model.',
    notes: 'Legacy support for existing workflows. Superseded by newer models for primary production.',
    quadrantId: 0,
    ringId: 3, // HOLD
    previousRingId: 0,
    tags: ['LLM', 'Anthropic', 'Legacy'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 5, impact: 3, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Standard inference footprint.',
    securityNotes: 'Enterprise safety verified.',
    links: ['https://anthropic.com'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 30000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    history: [
      { id: 'h1', itemId: 'claude-3-5', action: 'Moved to Hold', note: 'Outdated model', createdAt: Date.now(), createdBy: 'Admin' }
    ],
    pricingTiers: [
      { name: 'Individual', cost: 'Free', features: ['Basic usage', 'Standard support'] },
      { name: 'Pro', cost: '$20', billing: 'per user/month', features: ['High limits', 'Priority access', 'Latest features'] }
    ]
  },
  {
    id: 'claude-4-6',
    name: 'Claude 4.6 Sonnet',
    shortDesc: 'Latest intelligence flagship.',
    notes: 'Primary recommendation for reasoning and complex coding tasks.',
    quadrantId: 1,
    ringId: 0, // ADOPT
    tags: ['LLM', 'Anthropic', 'Flagship'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Optimized efficiency metrics.',
    securityNotes: 'Full privacy compliance.',
    links: ['https://anthropic.com'],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Developer', cost: 'Usage-based', billing: 'per million tokens', features: ['API Access', 'Enterprise Support'] },
      { name: 'Pro', cost: '$20', billing: 'per month', features: ['Unlimited Web Access', 'Team workspace'] }
    ]
  },
  {
    id: 'transcriptor',
    name: 'Transcriptor',
    shortDesc: 'Meeting intelligence for studios.',
    notes: 'Excellent support for Dutch language and studio-wide integration.',
    quadrantId: 2,
    ringId: 0,
    tags: ['Audio', 'Productivity', 'EU'],
    team: 'Operations',
    ownerId: 'admin-1',
    ownerName: 'Admin',
    scores: { maturity: 4, impact: 4, effort: 2, risk: 1 },
    costRange: 'Low',
    origin: 'European',
    sustainabilityNotes: 'Low energy overhead.',
    securityNotes: 'EU-hosted, GDPR compliant.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Starter', cost: 'Free', features: ['10h per month', 'Basic export'] },
      { name: 'Business', cost: '€12', billing: 'per seat/month', features: ['Unlimited hours', 'Team sharing', 'AI Summaries'] }
    ]
  },
  {
    id: 'firebase-studio',
    name: 'Firebase Studio',
    shortDesc: 'Rapid prototyping environment.',
    notes: 'Our core platform for building internal tools and MVPs.',
    quadrantId: 0,
    ringId: 0,
    tags: ['Prototyping', 'Cloud'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Admin',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 1 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Google Cloud managed.',
    securityNotes: 'Enterprise Auth & Rules.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 5000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'gpt-5-4',
    name: 'GPT-5.4',
    shortDesc: 'OpenAI flagship reasoning model.',
    notes: 'Top-tier general intelligence from OpenAI. Strong for complex strategy and analysis tasks.',
    quadrantId: 1,
    ringId: 0,
    tags: ['LLM', 'OpenAI', 'Flagship'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Standard inference footprint.',
    securityNotes: 'Enterprise privacy controls available.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Plus', cost: '$20', billing: 'per month', features: ['High limits', 'Latest models'] },
      { name: 'API', cost: 'Usage-based', billing: 'per million tokens', features: ['Full API access'] }
    ]
  },
  {
    id: 'gpt-5-3',
    name: 'GPT-5.3',
    shortDesc: 'Previous OpenAI flagship.',
    notes: 'Strong general model, largely superseded by GPT-5.4 for primary tasks.',
    quadrantId: 1,
    ringId: 1,
    tags: ['LLM', 'OpenAI'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 5, impact: 4, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Standard inference footprint.',
    securityNotes: 'Enterprise privacy controls available.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 8000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'gpt-5-3-codex',
    name: 'GPT-5.3 Codex',
    shortDesc: 'OpenAI code-optimised model.',
    notes: 'Specialised for code generation and refactoring. Evaluate against Claude Code and Cursor for daily dev workflows.',
    quadrantId: 0,
    ringId: 1,
    tags: ['LLM', 'OpenAI', 'Coding'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 4, impact: 4, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Standard inference footprint.',
    securityNotes: 'Enterprise privacy controls available.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 2000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'gpt-5-1-codex-mini',
    name: 'GPT-5.1 Codex mini',
    shortDesc: 'Lightweight coding model from OpenAI.',
    notes: 'Fast, low-cost code completions. Assess for high-volume or embedded coding use cases.',
    quadrantId: 0,
    ringId: 2,
    tags: ['LLM', 'OpenAI', 'Coding', 'Lightweight'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 3, impact: 3, effort: 1, risk: 2 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Smaller model, lower energy footprint.',
    securityNotes: 'Enterprise privacy controls available.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    shortDesc: 'Google\'s fast multimodal model.',
    notes: 'Excellent speed-to-intelligence ratio. Useful for high-throughput or real-time creative workflows.',
    quadrantId: 1,
    ringId: 1,
    tags: ['LLM', 'Google', 'Multimodal', 'Fast'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 4, impact: 4, effort: 1, risk: 2 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Google infrastructure, carbon-neutral goals.',
    securityNotes: 'Google Workspace integration, standard compliance.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1500000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    shortDesc: 'Emerging AI creative tool.',
    notes: 'Under assessment for fit in creative workflows. Monitor for production readiness.',
    quadrantId: 0,
    ringId: 2,
    tags: ['Creative', 'Emerging'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 2, impact: 3, effort: 2, risk: 3 },
    costRange: 'Low',
    origin: 'Other',
    sustainabilityNotes: 'Under review.',
    securityNotes: 'Under review.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'cursor',
    name: 'Cursor',
    shortDesc: 'AI-first code editor.',
    notes: 'Strong adoption across engineering. Deep codebase awareness and multi-file editing make it a preferred daily driver.',
    quadrantId: 2,
    ringId: 0,
    tags: ['IDE', 'Coding', 'AI Editor'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 5, impact: 5, effort: 1, risk: 1 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Lightweight desktop app.',
    securityNotes: 'Privacy mode available, SOC 2 compliant.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 10000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Hobby', cost: 'Free', features: ['2000 completions/month', 'Basic AI'] },
      { name: 'Pro', cost: '$20', billing: 'per month', features: ['Unlimited completions', 'Advanced models', 'Privacy mode'] }
    ]
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    shortDesc: 'AI pair programmer by GitHub.',
    notes: 'Deeply integrated into VS Code. Trial alongside Cursor to compare daily developer experience.',
    quadrantId: 2,
    ringId: 1,
    tags: ['IDE', 'Coding', 'Microsoft', 'GitHub'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 5, impact: 4, effort: 1, risk: 2 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Microsoft Azure infrastructure.',
    securityNotes: 'Enterprise plan with IP indemnification available.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 7000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Individual', cost: '$10', billing: 'per month', features: ['Unlimited completions', 'Chat'] },
      { name: 'Business', cost: '$19', billing: 'per seat/month', features: ['Policy management', 'Audit logs'] }
    ]
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    shortDesc: 'Anthropic\'s agentic CLI for development.',
    notes: 'Terminal-native AI coding agent. Excellent for complex multi-step engineering tasks and codebase-wide changes.',
    quadrantId: 2,
    ringId: 0,
    tags: ['CLI', 'Coding', 'Anthropic', 'Agentic'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 4, impact: 5, effort: 1, risk: 2 },
    costRange: 'Medium',
    origin: 'American',
    sustainabilityNotes: 'Optimised inference efficiency.',
    securityNotes: 'Full privacy compliance, no training on prompts.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Pro', cost: '$20', billing: 'per month', features: ['Unlimited Claude Code usage', 'Latest models'] },
      { name: 'API', cost: 'Usage-based', billing: 'per million tokens', features: ['Direct API access'] }
    ]
  },
  {
    id: 'warp',
    name: 'Warp',
    shortDesc: 'AI-powered terminal.',
    notes: 'Modern terminal with built-in AI assistance for commands and workflows. Trial for engineering teams.',
    quadrantId: 2,
    ringId: 1,
    tags: ['Terminal', 'CLI', 'Productivity'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 4, impact: 3, effort: 1, risk: 1 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Lightweight native app.',
    securityNotes: 'Optional local mode, no cloud logging.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 3000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Free', cost: 'Free', features: ['Core terminal', 'AI commands'] },
      { name: 'Team', cost: '$15', billing: 'per seat/month', features: ['Shared workflows', 'Team settings'] }
    ]
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    shortDesc: 'Agentic AI IDE by Codeium.',
    notes: 'Cursor alternative with strong agentic "flows". Assess for teams exploring alternatives to Cursor.',
    quadrantId: 2,
    ringId: 2,
    tags: ['IDE', 'Coding', 'Agentic'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 3, impact: 4, effort: 1, risk: 2 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Lightweight desktop app.',
    securityNotes: 'SOC 2 compliant, privacy mode available.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 500000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin'
  },
  {
    id: 'v0',
    name: 'v0 by Vercel',
    shortDesc: 'Prompt-to-UI component generator.',
    notes: 'Rapidly generates React/Tailwind UI from natural language. Strong fit for prototyping and design handoff acceleration.',
    quadrantId: 0,
    ringId: 1,
    tags: ['UI', 'Prototyping', 'Vercel', 'React'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 3, impact: 4, effort: 1, risk: 2 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Vercel edge infrastructure.',
    securityNotes: 'Standard web security, no sensitive data required.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 2500000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Free', cost: 'Free', features: ['200 tokens/day', 'Basic generation'] },
      { name: 'Premium', cost: '$20', billing: 'per month', features: ['Unlimited tokens', 'Private projects'] }
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    shortDesc: 'AI-powered research and search.',
    notes: 'Fast, cited answers for research tasks. Good for competitive intelligence and brief discovery.',
    quadrantId: 1,
    ringId: 1,
    tags: ['Research', 'Search', 'Productivity'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 4, impact: 3, effort: 1, risk: 2 },
    costRange: 'Low',
    origin: 'American',
    sustainabilityNotes: 'Standard cloud footprint.',
    securityNotes: 'No enterprise privacy guarantee on free tier.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 4000000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Free', cost: 'Free', features: ['Unlimited searches', 'Basic Pro queries'] },
      { name: 'Pro', cost: '$20', billing: 'per month', features: ['600 Pro queries/day', 'File upload', 'API access'] }
    ]
  },
  {
    id: 'mistral-le-chat',
    name: 'Mistral Le Chat',
    shortDesc: 'European LLM with strong privacy story.',
    notes: 'EU-hosted, GDPR-native. Strong candidate for workflows requiring data residency or client privacy commitments.',
    quadrantId: 3,
    ringId: 2,
    tags: ['LLM', 'European', 'Privacy-First', 'GDPR'],
    team: 'Creative Tech',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 3, impact: 3, effort: 2, risk: 1 },
    costRange: 'Low',
    origin: 'European',
    sustainabilityNotes: 'European data centres, EU Green Deal aligned.',
    securityNotes: 'GDPR compliant, EU data residency guaranteed.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 1200000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Free', cost: 'Free', features: ['Generous limits', 'Web access'] },
      { name: 'Pro', cost: '€14.99', billing: 'per month', features: ['Unlimited messages', 'All models', 'Priority access'] }
    ]
  },
  {
    id: 'lovable',
    name: 'Lovable',
    shortDesc: 'AI app builder from prompt to production.',
    notes: 'Generates full-stack apps from natural language. Assess for rapid client prototyping and MVP delivery.',
    quadrantId: 2,
    ringId: 2,
    tags: ['App Builder', 'Prototyping', 'Full-stack'],
    team: 'Engineering',
    ownerId: 'admin-1',
    ownerName: 'Greenberry Admin',
    scores: { maturity: 3, impact: 4, effort: 1, risk: 3 },
    costRange: 'Low',
    origin: 'European',
    sustainabilityNotes: 'European-founded, standard cloud infra.',
    securityNotes: 'Review generated code before production deployment.',
    links: [],
    status: 'Approved',
    lastReviewedAt: Date.now(),
    createdAt: Date.now() - 800000,
    updatedAt: Date.now(),
    createdBy: 'Admin',
    updatedBy: 'Admin',
    pricingTiers: [
      { name: 'Free', cost: 'Free', features: ['5 projects', 'Basic generation'] },
      { name: 'Starter', cost: '$20', billing: 'per month', features: ['Unlimited projects', 'Custom domains'] }
    ]
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
              <h1 className="text-6xl font-black text-foreground tracking-tighter leading-none uppercase">Design for <br/><span className="text-primary">Progress</span></h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg">Tracking AI tools that amplify creative and ethical impact at Greenberry.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search the network..." 
                className="pl-12 border-2 border-border focus:border-primary rounded-full h-14 text-lg bg-secondary/30"
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

            <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-primary/5 border-2 border-secondary/20 relative overflow-hidden">
              <div className="absolute top-8 right-12 flex gap-4 z-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
                  <Sparkles className="w-3 h-3 text-primary" /> New
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
              <div className="space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b pb-6">
                  <h3 className="text-4xl font-black uppercase tracking-tighter">
                    Focus: <span className="text-primary">{DEFAULT_CONFIG.quadrants[activeQuadrant]}</span>
                  </h3>
                  <Badge variant="secondary" className="font-bold px-4 py-1.5 rounded-full">
                    {quadrantItems.length} Pulses
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quadrantItems.map(item => (
                    <Link 
                      key={item.id} 
                      href={`/items/${item.id}`}
                      className="group p-8 bg-secondary/30 rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 hover:bg-white transition-all flex justify-between items-center"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black group-hover:text-primary transition-colors tracking-tight">{item.name}</span>
                          {isItemNew(item) && (
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          )}
                          {hasItemMoved(item) && (
                            <ArrowUpRight className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium line-clamp-1">{item.shortDesc}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="font-black uppercase text-[10px] tracking-widest h-8 px-4 rounded-full">
                          {DEFAULT_CONFIG.rings[item.ringId]}
                        </Badge>
                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2.5rem] border-none bg-secondary/30 overflow-hidden shadow-none">
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
                        <span className="font-bold text-xl group-hover:text-primary transition-colors tracking-tight">{item.name}</span>
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

          <Card className="rounded-[2.5rem] border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20 p-4">
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
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Strategic Pulse</h4>
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
