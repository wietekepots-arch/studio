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
  Circle
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

// Mock fetching logic updated for AI tools
const getItem = (id: string): RadarItem => {
  const items: Record<string, RadarItem> = {
    '1': {
      id: '1',
      name: 'Claude 3.5 Sonnet',
      shortDesc: 'State-of-the-art LLM by Anthropic with high reasoning capabilities.',
      notes: 'Anthropic\'s most capable model to date. It demonstrates exceptional performance in coding, complex reasoning, and creative writing. We use it extensively for pair programming and data analysis.\n\nGovernance Note: Ensure that PII is masked before submission, though our enterprise tier includes high privacy standards.',
      quadrantId: 0,
      ringId: 0,
      tags: ['LLM', 'Anthropic', 'Coding'],
      team: 'AI Research',
      ownerId: 'u1',
      ownerName: 'Jane Smith',
      scores: { maturity: 5, impact: 5, effort: 1, risk: 2 },
      costRange: 'Medium',
      links: ['https://claude.ai', 'https://www.anthropic.com/news/claude-3-5-sonnet'],
      status: 'Approved',
      lastReviewedAt: Date.now() - 1000000,
      createdAt: Date.now() - 10000000,
      createdBy: 'u1',
      updatedAt: Date.now() - 500000,
      updatedBy: 'u1'
    },
    '4': {
      id: '4',
      name: 'Firebase Studio',
      shortDesc: 'Integrated prototyping and deployment suite for Firebase apps.',
      notes: 'Firebase Studio is our preferred environment for rapid application prototyping. It provides a seamless bridge between local development and cloud deployment, specifically optimized for GenAI applications using Genkit.',
      quadrantId: 0,
      ringId: 0,
      tags: ['Platform', 'Firebase', 'Dev'],
      team: 'Engineering',
      ownerId: 'u3',
      ownerName: 'Alice Wong',
      scores: { maturity: 4, impact: 5, effort: 1, risk: 1 },
      costRange: 'Free',
      links: ['https://firebase.google.com'],
      status: 'Approved',
      lastReviewedAt: Date.now() - 500000,
      createdAt: Date.now() - 2000000,
      createdBy: 'u3',
      updatedAt: Date.now(),
      updatedBy: 'u3'
    }
  };
  
  return items[id] || items['1'];
};

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = getItem(params.id);
  const [comment, setComment] = useState('');

  const ScoreRow = ({ label, value }: { label: string, value: number }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <Progress value={value * 20} className="h-1.5" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Radar
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Circle className="w-2 h-2 fill-accent text-accent" />
              {item.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Edit className="w-4 h-4" /> Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" /> Approve Change
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-primary">{item.name}</h1>
              <p className="text-xl text-muted-foreground font-medium">{item.shortDesc}</p>
              
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-3">#{tag}</Badge>
                ))}
              </div>
            </div>

            <Card className="border-none shadow-none bg-transparent">
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="notes" className="gap-2">Notes</TabsTrigger>
                  <TabsTrigger value="governance" className="gap-2">Governance</TabsTrigger>
                  <TabsTrigger value="links" className="gap-2">Links ({item.links.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="notes" className="pt-6">
                  <div className="prose prose-blue max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {item.notes}
                  </div>
                </TabsContent>
                <TabsContent value="governance" className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-xs font-bold uppercase text-primary mb-1">Owner</div>
                      <div className="font-medium">{item.ownerName}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-xs font-bold uppercase text-primary mb-1">Last Reviewed</div>
                      <div className="font-medium">{new Date(item.lastReviewedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-xs font-bold uppercase text-primary mb-1">Quadrant</div>
                      <div className="font-medium">{DEFAULT_CONFIG.quadrants[item.quadrantId]}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-xs font-bold uppercase text-primary mb-1">Current Ring</div>
                      <div className="font-medium">{DEFAULT_CONFIG.rings[item.ringId]}</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="links" className="pt-6">
                  <div className="space-y-3">
                    {item.links.map(link => (
                      <a 
                        key={link} 
                        href={link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm font-medium">{link}</span>
                      </a>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Comments Section */}
            <div className="space-y-6 pt-8 border-t">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Comments
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea 
                      placeholder="Add a comment or ask a question..." 
                      className="w-full p-4 rounded-xl border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button disabled={!comment.trim()}>Post Comment</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mt-8">
                  {[1].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">BS</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">Bill Stevens</span>
                          <span className="text-xs text-muted-foreground">2 days ago</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          We should also consider how this plays with the new CMS initiative. 
                          Claude seems to have great integration with our current toolchain.
                        </p>
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                            <ThumbsUp className="w-3 h-3" /> 12
                          </button>
                          <button className="text-xs text-muted-foreground hover:text-primary">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Scores */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Assessment Scores</CardTitle>
                <CardDescription>Based on internal benchmarks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScoreRow label="Maturity" value={item.scores.maturity} />
                <ScoreRow label="Impact" value={item.scores.impact} />
                <ScoreRow label="Effort" value={item.scores.effort} />
                <ScoreRow label="Risk" value={item.scores.risk} />
                
                <div className="pt-4 border-t space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Estimated Cost</span>
                    <Badge variant="secondary">{item.costRange}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Team</span>
                    <span className="text-sm font-bold">{item.team}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y text-xs">
                  <div className="p-4 space-y-1">
                    <div className="font-medium">Status changed to Approved</div>
                    <div className="text-muted-foreground">by Admin • 1 week ago</div>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-medium">Moved from Assess to Adopt</div>
                    <div className="text-muted-foreground">by Jane Smith • 3 weeks ago</div>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-medium">Item created</div>
                    <div className="text-muted-foreground">by Jane Smith • 1 month ago</div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full text-xs h-10 rounded-t-none">View Full History</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
