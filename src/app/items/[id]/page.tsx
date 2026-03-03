"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ExternalLink, 
  MessageSquare, 
  History, 
  Edit,
  ShieldCheck,
  MoreVertical,
  ThumbsUp,
  Circle,
  Leaf,
  Shield,
  Globe,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DEFAULT_CONFIG, RadarItem } from '@/app/lib/radar-types';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Updated mock logic
const getItem = (id: string): RadarItem => {
  const items: Record<string, RadarItem> = {
    '1': {
      id: '1',
      name: 'Claude 3.5 Sonnet',
      shortDesc: 'State-of-the-art LLM by Anthropic with high reasoning capabilities.',
      notes: 'Anthropic\'s most capable model to date. Demonstrates exceptional performance in coding and complex reasoning.',
      quadrantId: 0,
      ringId: 0,
      tags: ['LLM', 'Anthropic', 'Coding'],
      team: 'Creative Tech',
      ownerId: 'u1',
      ownerName: 'Jane Smith',
      scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
      costRange: 'Medium',
      origin: 'American',
      sustainabilityNotes: 'High energy consumption during training. Infrastructure is largely US-based and optimized for performance over green energy.',
      securityNotes: 'Enterprise Tier provides data isolation. GDPR compliant under DPA. SOC2 Type II.',
      links: ['https://claude.ai'],
      status: 'Approved',
      lastReviewedAt: Date.now() - 1000000,
      createdAt: Date.now() - 10000000,
      createdBy: 'u1',
      updatedAt: Date.now() - 500000,
      updatedBy: 'u1'
    }
  };
  
  return items[id] || items['1'];
};

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = getItem(params.id);
  const [comment, setComment] = useState('');

  const ScoreRow = ({ label, value }: { label: string, value: number }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <Progress value={value * 20} className="h-2 rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground font-bold hover:text-primary">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Radar
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 font-bold uppercase py-1 px-3">
              <Circle className="w-2 h-2 fill-primary text-primary" />
              {item.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2 font-medium">
                  <Edit className="w-4 h-4" /> Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge className="font-black uppercase text-[10px] tracking-widest">{DEFAULT_CONFIG.quadrants[item.quadrantId]}</Badge>
                <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest">{DEFAULT_CONFIG.rings[item.ringId]}</Badge>
              </div>
              <h1 className="text-5xl font-black text-primary uppercase leading-tight">{item.name}</h1>
              <p className="text-2xl text-muted-foreground font-medium leading-relaxed">{item.shortDesc}</p>
              
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="px-4 py-1 font-bold text-xs uppercase tracking-wider rounded-full border-2">#{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 rounded-2xl bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-xs">
                    <Leaf className="w-4 h-4" /> Sustainability
                  </div>
                </CardHeader>
                <CardContent className="text-sm font-medium">
                  {item.sustainabilityNotes ? 'Critical Info Provided' : 'Not Assessed'}
                </CardContent>
              </Card>
              <Card className="border-2 rounded-2xl bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-xs">
                    <Shield className="w-4 h-4" /> Security
                  </div>
                </CardHeader>
                <CardContent className="text-sm font-medium">
                  {item.securityNotes ? 'Verified Compliance' : 'Review Required'}
                </CardContent>
              </Card>
              <Card className="border-2 rounded-2xl bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-xs">
                    <Globe className="w-4 h-4" /> Origin
                  </div>
                </CardHeader>
                <CardContent className="text-sm font-black uppercase tracking-wider">
                  {item.origin}
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-none bg-transparent pt-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-secondary/50 p-1 rounded-full h-12 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="overview" className="gap-2 rounded-full px-6 font-bold uppercase text-[11px] tracking-widest">Overview</TabsTrigger>
                  <TabsTrigger value="impact" className="gap-2 rounded-full px-6 font-bold uppercase text-[11px] tracking-widest">Progress & Impact</TabsTrigger>
                  <TabsTrigger value="governance" className="gap-2 rounded-full px-6 font-bold uppercase text-[11px] tracking-widest">Governance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-8">
                  <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed font-medium">
                    {item.notes}
                  </div>
                </TabsContent>

                <TabsContent value="impact" className="pt-8 space-y-8">
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-secondary/30 border-2">
                      <h4 className="text-primary font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5" /> Sustainability Review
                      </h4>
                      <p className="text-lg leading-relaxed font-medium">{item.sustainabilityNotes}</p>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-secondary/30 border-2">
                      <h4 className="text-primary font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" /> Security & Privacy
                      </h4>
                      <p className="text-lg leading-relaxed font-medium">{item.securityNotes}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="governance" className="pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl border-2 hover:border-primary/50 transition-colors">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Owner</div>
                      <div className="text-xl font-bold">{item.ownerName}</div>
                    </div>
                    <div className="p-6 rounded-3xl border-2 hover:border-primary/50 transition-colors">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Last Reviewed</div>
                      <div className="text-xl font-bold">{new Date(item.lastReviewedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Comments Section */}
            <div className="space-y-8 pt-12 border-t-2">
              <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-primary" />
                Discussions
              </h3>
              <div className="space-y-6">
                <div className="bg-secondary/20 p-6 rounded-3xl border-2">
                  <textarea 
                    placeholder="Contribute to the progress of this tool..." 
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-medium min-h-[120px]"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <div className="flex justify-end mt-4">
                    <Button className="rounded-full font-bold px-8" disabled={!comment.trim()}>Post Comment</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Scores */}
          <div className="space-y-6">
            <Card className="sticky top-24 rounded-3xl border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground p-6">
                <CardTitle className="uppercase font-black tracking-widest text-sm">Benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <ScoreRow label="Maturity" value={item.scores.maturity} />
                <ScoreRow label="Impact" value={item.scores.impact} />
                <ScoreRow label="Effort" value={item.scores.effort} />
                <ScoreRow label="Risk" value={item.scores.risk} />
                
                <div className="pt-6 border-t-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Investment</span>
                    <Badge variant="secondary" className="font-bold rounded-full px-3">{item.costRange}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Team</span>
                    <span className="text-sm font-black uppercase tracking-tight text-primary">{item.team}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2 text-xs font-medium">
                  <div className="p-5 space-y-1 hover:bg-secondary/30 transition-colors">
                    <div className="font-bold text-sm">Approved for Enterprise Use</div>
                    <div className="text-muted-foreground">by Admin • 1 week ago</div>
                  </div>
                  <div className="p-5 space-y-1 hover:bg-secondary/30 transition-colors">
                    <div className="font-bold text-sm">Shifted Focus to Craft</div>
                    <div className="text-muted-foreground">by Jane Smith • 1 month ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
