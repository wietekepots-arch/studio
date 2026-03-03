"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  History, 
  Edit,
  MoreVertical,
  Circle,
  Leaf,
  Shield,
  Globe,
  ArrowUpRight,
  Sparkles,
  Info,
  Zap,
  Star,
  Plus,
  CreditCard,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DEFAULT_CONFIG, RadarItem, Experience } from '@/app/lib/radar-types';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const db = useFirestore();
  
  const itemRef = useMemoFirebase(() => (db ? doc(db, 'radarItems', id) : null), [db, id]);
  const { data: item, isLoading: isItemLoading } = useDoc<RadarItem>(itemRef);

  const experiencesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'experiences'),
      where('toolLinks', 'array-contains', id),
      where('status', '==', 'Published'),
      orderBy('createdAt', 'desc')
    );
  }, [db, id]);

  const { data: relatedExperiences, isLoading: isExpLoading } = useCollection<Experience>(experiencesQuery);

  if (isItemLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-4xl font-black">Tool Not Found</h1>
          <Button asChild className="rounded-full px-8">
            <Link href="/">Back to Radar</Link>
          </Button>
        </div>
      </div>
    );
  }

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
                  {item.sustainabilityNotes || 'Assessment Pending'}
                </CardContent>
              </Card>
              <Card className="border-none rounded-[3rem] bg-secondary/20 p-4 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                    <Shield className="w-5 h-5" /> Security
                  </div>
                </CardHeader>
                <CardContent className="text-lg font-bold text-foreground/80">
                  {item.securityNotes || 'Review Required'}
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
                  <TabsTrigger value="pricing" className="gap-3 rounded-full px-10 font-black uppercase tracking-widest text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <CreditCard className="w-3.5 h-3.5" /> Pricing
                  </TabsTrigger>
                  <TabsTrigger value="experiences" className="gap-3 rounded-full px-10 font-black uppercase tracking-widest text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Sparkles className="w-3.5 h-3.5" /> Experiences ({relatedExperiences?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-3 rounded-full px-10 font-black uppercase tracking-widest text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <History className="w-3.5 h-3.5" /> History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-16">
                  <div className="prose prose-2xl max-w-none text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
                    {item.notes}
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="pt-16">
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter">Investment <span className="text-primary">Tiers</span></h3>
                        <p className="text-muted-foreground font-medium">Commercial structure for {item.name}.</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-6 h-10 font-bold uppercase tracking-widest text-[10px]">
                        Category: {item.costRange}
                      </Badge>
                    </div>

                    <Card className="rounded-[3rem] border-none bg-secondary/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-primary/5">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[200px] font-black uppercase tracking-widest text-[10px] text-primary p-8">Tier</TableHead>
                            <TableHead className="font-black uppercase tracking-widest text-[10px] text-primary p-8">Investment</TableHead>
                            <TableHead className="font-black uppercase tracking-widest text-[10px] text-primary p-8">Key Progress Enablers</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.pricingTiers && item.pricingTiers.length > 0 ? (
                            item.pricingTiers.map((tier, idx) => (
                              <TableRow key={idx} className="border-secondary hover:bg-white/40 transition-colors">
                                <TableCell className="font-black text-xl p-8">{tier.name}</TableCell>
                                <TableCell className="p-8">
                                  <div className="flex flex-col">
                                    <span className="text-2xl font-black text-primary">{tier.cost}</span>
                                    {tier.billing && <span className="text-xs font-bold text-muted-foreground uppercase">{tier.billing}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="p-8">
                                  <ul className="space-y-2">
                                    {tier.features.map((feature, fIdx) => (
                                      <li key={fIdx} className="flex items-center gap-3 text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="p-16 text-center text-muted-foreground font-medium italic">
                                Detailed pricing matrix pending review. See official site for latest commercials.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                    
                    <div className="flex justify-center">
                      <Button asChild variant="outline" className="rounded-full border-2 gap-2 h-14 px-10 font-black uppercase tracking-widest text-[10px]">
                        <a href={item.links?.[0] || '#'} target="_blank" rel="noopener noreferrer">
                          View Vendor Details
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="experiences" className="pt-16 space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter">Real-World <span className="text-primary">Pulses</span></h3>
                      <p className="text-muted-foreground font-medium">How Greenberry teams are using {item.name}.</p>
                    </div>
                    <Button asChild className="rounded-full gap-2 font-bold px-8 h-14 shadow-lg shadow-primary/20">
                      <Link href={`/experiences/new?toolId=${item.id}`}>
                        <Plus className="w-5 h-5" /> Log Your Experience
                      </Link>
                    </Button>
                  </div>

                  {isExpLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                      <div className="h-48 rounded-[2.5rem] bg-secondary/20" />
                      <div className="h-48 rounded-[2.5rem] bg-secondary/20" />
                    </div>
                  ) : relatedExperiences && relatedExperiences.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {relatedExperiences.map(exp => (
                        <Link key={exp.id} href={`/experiences/${exp.id}`}>
                          <Card className="group h-full rounded-[2.5rem] border-none bg-secondary/10 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all p-8 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">{exp.team}</Badge>
                                {exp.outcomeRating && (
                                  <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                                    <Star className="w-4 h-4 fill-current" /> {exp.outcomeRating}
                                  </div>
                                )}
                              </div>
                              <h4 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight">{exp.title}</h4>
                              <p className="text-sm text-muted-foreground font-medium line-clamp-2">{exp.summary}</p>
                            </div>
                            <div className="pt-6 border-t mt-6 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{exp.creatorName}</span>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-16 rounded-[3.5rem] bg-secondary/10 text-center space-y-6">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-primary">
                        <Zap className="w-8 h-8" />
                      </div>
                      <h4 className="text-2xl font-black">No experiences logged yet</h4>
                      <p className="text-muted-foreground max-w-sm mx-auto">Be the first to share how this tool is making an impact in your project.</p>
                      <Button asChild variant="outline" className="rounded-full px-8 border-2">
                        <Link href={`/experiences/new?toolId=${item.id}`}>Log First Pulse</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="pt-16">
                  <div className="space-y-8">
                    {item.history && item.history.length > 0 ? (
                      item.history.map((entry, idx) => (
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
                      ))
                    ) : (
                      <div className="text-center py-20 text-muted-foreground font-medium italic">No lifecycle entries yet.</div>
                    )}
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
