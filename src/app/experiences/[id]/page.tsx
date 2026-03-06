"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Award,
  ShieldCheck,
  Star,
  MessageSquare,
  Sparkles,
  Zap,
  Tag,
  ChevronRight,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Experience, RadarItem } from '@/app/lib/radar-types';
import { collection, query, where, documentId, doc } from 'firebase/firestore';
import { useAppUser } from '@/components/app/AppUserProvider';

export default function ExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const db = useFirestore();
  const {
    authUser,
    hasCompanyAccess,
    isLoading: isAuthLoading,
  } = useAppUser();
  
  const expRef = useMemoFirebase(() => (
    db && authUser && hasCompanyAccess ? doc(db, 'experiences', id) : null
  ), [db, authUser, hasCompanyAccess, id]);
  const { data: experience, isLoading: isExpLoading } = useDoc<Experience>(expRef);

  const toolsQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess || !experience?.toolLinks?.length) return null;
    return query(collection(db, 'radarItems'), where(documentId(), 'in', experience.toolLinks));
  }, [db, authUser, hasCompanyAccess, experience?.toolLinks]);

  const { data: linkedTools, isLoading: isToolsLoading } = useCollection<RadarItem>(toolsQuery);

  if (isAuthLoading || isExpLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!hasCompanyAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center px-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-4 max-w-md">
            <h1 className="text-5xl font-black tracking-tighter">Locked Experience</h1>
            <p className="text-xl text-muted-foreground font-medium">Strategic workflow details are reserved for authenticated Greenberry members.</p>
          </div>
          <Button asChild className="rounded-full px-10 h-14 font-black text-lg uppercase tracking-widest shadow-xl shadow-primary/20">
            <Link href="/login">Sign In to View</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="text-4xl font-black mb-6">Experience Not Found</h1>
          <Button asChild className="rounded-full px-8">
            <Link href="/experiences">Back to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 lg:px-12 max-w-7xl">
        <div className="flex items-center justify-between mb-16">
          <Button variant="ghost" asChild className="gap-3 -ml-4 text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">
            <Link href="/experiences">
              <ArrowLeft className="w-5 h-5" />
              Return to Feed
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2 font-black uppercase py-2 px-6 rounded-full border-2 text-primary border-primary">
              <ShieldCheck className="w-4 h-4" />
              {experience.dataSensitivity || 'Internal'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-8 space-y-16">
            <div className="space-y-10">
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="font-black uppercase text-[10px] tracking-[0.2em] px-6 py-2 rounded-full bg-primary/10 text-primary border-none">{experience.team}</Badge>
                {experience.outcomeRating && (
                  <Badge variant="secondary" className="gap-2 font-black uppercase text-[10px] tracking-[0.2em] px-6 py-2 rounded-full text-yellow-600 border-none bg-yellow-50">
                    <Star className="w-3.5 h-3.5 fill-current" /> {experience.outcomeRating}/5 Outcome
                  </Badge>
                )}
              </div>
              <h1 className="text-8xl font-black text-foreground tracking-tighter leading-[0.85]">{experience.title}</h1>
              <p className="text-4xl text-muted-foreground/90 font-medium leading-[1.1] max-w-4xl">{experience.summary}</p>
              
              <div className="flex flex-wrap gap-3 pt-4">
                {experience.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="px-6 py-2.5 font-bold text-base rounded-full border-2 bg-secondary/10">#{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-12">
              <section className="space-y-8">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <Zap className="w-6 h-6" /> The Workflow
                </div>
                <div className="prose prose-2xl max-w-none text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
                  {experience.howUsed}
                </div>
              </section>

              {experience.promptsOrTemplates && (
                <section className="space-y-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                    <MessageSquare className="w-6 h-6" /> Prompts & Templates
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-secondary/30 font-mono text-lg whitespace-pre-wrap border-2 border-primary/10">
                    {experience.promptsOrTemplates}
                  </div>
                </section>
              )}

              <section className="space-y-8">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <Sparkles className="w-6 h-6" /> Key Findings & Outcomes
                </div>
                <div className="p-12 rounded-[3.5rem] bg-primary/5 border-none shadow-inner">
                  <div className="prose prose-2xl max-w-none text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
                    {experience.findings}
                  </div>
                </div>
              </section>

              {experience.recommendations && (
                <section className="space-y-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                    <Award className="w-6 h-6" /> Strategic Recommendations
                  </div>
                  <div className="prose prose-xl max-w-none text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap italic">
                    {experience.recommendations}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-primary/10 overflow-hidden bg-white">
              <CardHeader className="bg-primary text-primary-foreground p-12">
                <CardTitle className="uppercase font-black tracking-[0.3em] text-[10px] opacity-70">Experience Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-12 space-y-12">
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contributor</div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-black tracking-tight">{experience.creatorName}</div>
                      <div className="text-sm font-bold text-muted-foreground uppercase">{experience.roleTitle}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Studio</div>
                    <div className="text-lg font-black tracking-tight">{experience.team}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date Logged</div>
                    <div className="text-lg font-black tracking-tight">{new Date(experience.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {experience.timeSavedHours && (
                  <div className="p-8 rounded-[2.5rem] bg-yellow-50 border-2 border-yellow-100 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-yellow-700">Efficiency Gain</div>
                    <div className="text-3xl font-black text-yellow-700">+{experience.timeSavedHours}h</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="px-8 space-y-8">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-primary">
                <Tag className="w-5 h-5" /> Linked Tools
              </div>
              <div className="space-y-4">
                {isToolsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 rounded-3xl bg-secondary/20" />)}
                  </div>
                ) : linkedTools?.map(tool => (
                  <Link key={tool.id} href={`/items/${tool.id}`}>
                    <Card className="group rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 hover:bg-secondary/10 transition-all p-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{tool.name}</div>
                          <div className="text-xs font-bold text-muted-foreground uppercase">{tool.team}</div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
