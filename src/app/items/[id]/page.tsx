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
  Globe
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
      notes: 'Anthropic\'s most capable model to date. Demonstrates exceptional performance in coding and complex reasoning. We use this for internal automation and client prototypes.',
      quadrantId: 0,
      ringId: 0,
      tags: ['LLM', 'Anthropic', 'Coding'],
      team: 'Creative Tech',
      ownerId: 'u1',
      ownerName: 'Jane Smith',
      scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
      costRange: 'Medium',
      origin: 'American',
      sustainabilityNotes: 'Anthropic is committed to safety but large training runs have high energy impact. Infrastructure is largely US-based.',
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
      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <Progress value={value * 20} className="h-3 rounded-full bg-secondary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground font-bold hover:text-primary transition-colors">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
              Back to Pulse
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2 font-bold uppercase py-1.5 px-5 rounded-full border-2">
              <Circle className="w-2.5 h-2.5 fill-primary text-primary animate-pulse" />
              {item.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 border-2">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
                <DropdownMenuItem className="gap-2 font-bold p-3 rounded-xl cursor-pointer">
                  <Edit className="w-4 h-4" /> Edit Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Badge className="font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">{DEFAULT_CONFIG.quadrants[item.quadrantId]}</Badge>
                <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">{DEFAULT_CONFIG.rings[item.ringId]}</Badge>
              </div>
              <h1 className="text-7xl font-black text-foreground tracking-tighter leading-[0.9]">{item.name}</h1>
              <p className="text-3xl text-muted-foreground/80 font-medium leading-tight max-w-2xl">{item.shortDesc}</p>
              
              <div className="flex flex-wrap gap-2 pt-4">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="px-5 py-2 font-bold text-sm rounded-full border-2 bg-secondary/20">#{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none rounded-[2rem] bg-secondary/30 p-2 shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                    <Leaf className="w-4 h-4" /> Sustainability
                  </div>
                </CardHeader>
                <CardContent className="text-sm font-bold text-foreground/80">
                  {item.sustainabilityNotes ? 'Critical Info Provided' : 'Needs Assessment'}
                </CardContent>
              </Card>
              <Card className="border-none rounded-[2rem] bg-secondary/30 p-2 shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                    <Shield className="w-4 h-4" /> Security
                  </div>
                </CardHeader>
                <CardContent className="text-sm font-bold text-foreground/80">
                  {item.securityNotes ? 'Verified Compliance' : 'Review Required'}
                </CardContent>
              </Card>
              <Card className="border-none rounded-[2rem] bg-secondary/30 p-2 shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                    <Globe className="w-4 h-4" /> Origin
                  </div>
                </CardHeader>
                <CardContent className="text-base font-black uppercase tracking-widest">
                  {item.origin}
                </CardContent>
              </Card>
            </div>

            <div className="pt-8">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-secondary/50 p-1 rounded-full h-14 w-full md:w-auto justify-start inline-flex">
                  <TabsTrigger value="overview" className="gap-2 rounded-full px-8 font-bold text-sm transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="impact" className="gap-2 rounded-full px-8 font-bold text-sm transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Progress & Impact</TabsTrigger>
                  <TabsTrigger value="governance" className="gap-2 rounded-full px-8 font-bold text-sm transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Governance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-12">
                  <div className="prose prose-2xl max-w-none text-foreground/90 leading-relaxed font-medium">
                    {item.notes}
                  </div>
                </TabsContent>

                <TabsContent value="impact" className="pt-12 space-y-10">
                  <div className="space-y-10">
                    <div className="p-8 rounded-[2.5rem] bg-secondary/20 border-none">
                      <h4 className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-3">
                        <Leaf className="w-6 h-6" /> Sustainability Review
                      </h4>
                      <p className="text-2xl leading-relaxed font-medium text-foreground/80">{item.sustainabilityNotes}</p>
                    </div>
                    
                    <div className="p-8 rounded-[2.5rem] bg-secondary/20 border-none">
                      <h4 className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-3">
                        <Shield className="w-6 h-6" /> Security & Privacy
                      </h4>
                      <p className="text-2xl leading-relaxed font-medium text-foreground/80">{item.securityNotes}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="governance" className="pt-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-secondary/30 transition-all hover:bg-secondary/50">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Steward</div>
                      <div className="text-2xl font-bold">{item.ownerName}</div>
                      <div className="text-sm text-primary font-bold mt-1">Lead of {item.team}</div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-secondary/30 transition-all hover:bg-secondary/50">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Last Reviewed</div>
                      <div className="text-2xl font-bold">{new Date(item.lastReviewedAt).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground font-medium mt-1">Next review in 3 months</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-10 pt-16 border-t">
              <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4">
                <MessageSquare className="w-10 h-10 text-primary" />
                Discussion
              </h3>
              <div className="bg-secondary/10 p-10 rounded-[3rem] space-y-6">
                <textarea 
                  placeholder="Share your experience or concerns..." 
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-2xl font-medium min-h-[160px] placeholder:text-muted-foreground/40"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <div className="flex justify-end pt-4">
                  <Button className="rounded-full font-bold px-10 h-14 text-lg" disabled={!comment.trim()}>Post Contribution</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="sticky top-32 rounded-[3rem] border-none shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground p-10">
                <CardTitle className="uppercase font-black tracking-[0.2em] text-xs opacity-80">Benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-10 bg-white">
                <ScoreRow label="Maturity" value={item.scores.maturity} />
                <ScoreRow label="Potential Impact" value={item.scores.impact} />
                <ScoreRow label="Implementation Effort" value={item.scores.effort} />
                <ScoreRow label="Risk Profile" value={item.scores.risk} />
                
                <div className="pt-10 border-t space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investment</span>
                    <Badge variant="secondary" className="font-bold rounded-full px-4 py-1.5 text-xs">{item.costRange}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team</span>
                    <span className="text-sm font-black text-primary">{item.team}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="px-6 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" />
                Activity Log
              </h4>
              <div className="space-y-6 border-l-2 pl-6">
                <div className="space-y-1 relative">
                  <div className="absolute -left-[1.65rem] top-1.5 w-3 h-3 rounded-full bg-primary" />
                  <div className="font-bold text-sm">Approved for Trial</div>
                  <div className="text-xs text-muted-foreground font-medium">by Admin • 1 week ago</div>
                </div>
                <div className="space-y-1 relative">
                  <div className="absolute -left-[1.65rem] top-1.5 w-3 h-3 rounded-full bg-border" />
                  <div className="font-bold text-sm">Review Completed</div>
                  <div className="text-xs text-muted-foreground font-medium">by Jane Smith • 1 month ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}