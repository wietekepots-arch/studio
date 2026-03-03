"use client";

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  Star, 
  Clock, 
  User as UserIcon,
  Sparkles,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Experience } from '@/app/lib/radar-types';

export default function ExperiencesPage() {
  const [search, setSearch] = useState('');
  const [activeTeam, setActiveTeam] = useState<string | undefined>();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const experiencesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'experiences'),
      where('status', '==', 'Published'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: experiences, isLoading } = useCollection<Experience>(experiencesQuery);

  const filteredExperiences = useMemo(() => {
    if (!experiences) return [];
    return experiences.filter(exp => {
      const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase()) || 
                          exp.summary.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = !activeTeam || exp.team === activeTeam;
      return matchesSearch && matchesTeam;
    });
  }, [experiences, search, activeTeam]);

  const teams = useMemo(() => {
    if (!experiences) return [];
    return Array.from(new Set(experiences.map(e => e.team)));
  }, [experiences]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center px-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-4 max-w-md">
            <h1 className="text-5xl font-black tracking-tighter">Locked Experiences</h1>
            <p className="text-xl text-muted-foreground font-medium">Real-world AI insights are reserved for authenticated Greenberry members.</p>
          </div>
          <Button asChild className="rounded-full px-10 h-14 font-black text-lg uppercase tracking-widest shadow-xl shadow-primary/20">
            <Link href="/login">Sign In to View Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-7xl font-black text-foreground tracking-tighter uppercase leading-none">The <span className="text-primary">Collective</span> <br/>Experience</h1>
            <p className="text-2xl text-muted-foreground font-medium max-w-2xl">Real-world pulses from our studios. See how we're pushing boundaries with AI.</p>
          </div>
          <Button asChild className="rounded-full px-10 h-16 font-bold text-lg shadow-xl hover:shadow-primary/20 transition-all gap-3">
            <Link href="/experiences/new">
              <Plus className="w-6 h-6" />
              Log an Experience
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar / Filters */}
          <div className="lg:col-span-3 space-y-10">
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Search Pulses</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Keywords..." 
                  className="pl-12 border-2 border-border focus:border-primary rounded-2xl h-14 bg-secondary/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Filter by Studio</div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant={!activeTeam ? "secondary" : "ghost"} 
                  className="justify-start font-bold rounded-xl h-12 px-4"
                  onClick={() => setActiveTeam(undefined)}
                >
                  All Studios
                </Button>
                {teams.map(team => (
                  <Button 
                    key={team}
                    variant={activeTeam === team ? "secondary" : "ghost"} 
                    className="justify-start font-bold rounded-xl h-12 px-4"
                    onClick={() => setActiveTeam(team)}
                  >
                    {team}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Main List */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 rounded-[2.5rem] bg-secondary/20 animate-pulse" />
                ))}
              </div>
            ) : filteredExperiences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredExperiences.map((exp) => (
                  <Link key={exp.id} href={`/experiences/${exp.id}`}>
                    <Card className="group h-full rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all overflow-hidden flex flex-col">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full bg-primary/5 text-primary border-none">
                            {exp.team}
                          </Badge>
                          {exp.outcomeRating && (
                            <div className="flex items-center gap-1 text-yellow-500 font-black">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm">{exp.outcomeRating}/5</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors">
                          {exp.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between space-y-6">
                        <p className="text-muted-foreground font-medium line-clamp-3">
                          {exp.summary}
                        </p>
                        <div className="space-y-4 pt-6 border-t border-secondary">
                          <div className="flex flex-wrap gap-2">
                            {exp.toolLinks.slice(0, 2).map((_, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-secondary/40 text-[10px] font-bold uppercase py-1 px-3 rounded-full">
                                Tool Pulled
                              </Badge>
                            ))}
                            {exp.toolLinks.length > 2 && (
                              <Badge variant="ghost" className="text-[10px] font-bold opacity-50">+{exp.toolLinks.length - 2} more</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span className="flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> {exp.creatorName || 'Member'}</span>
                            <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(exp.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 space-y-6">
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">No experiences found</h3>
                <p className="text-muted-foreground max-sm mx-auto">Be the first to log a strategic pulse with your favorite AI tools.</p>
                <Button asChild variant="outline" className="rounded-full px-8 border-2">
                  <Link href="/experiences/new">Start Logging</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}