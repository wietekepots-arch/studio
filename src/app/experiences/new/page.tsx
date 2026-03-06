"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Experience,
  DataSensitivity,
  RadarItem
} from '@/app/lib/radar-types';
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Award,
  Clock,
  ShieldAlert,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { useAppUser } from '@/components/app/AppUserProvider';
import common from "@/content/common.json";
import formContent from "@/content/pages/experience-form.json";

function NewExperiencePageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillToolId = searchParams.get('toolId');
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading, profile } = useAppUser();

  const [loading, setLoading] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  
  const toolsQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) return null;
    return query(collection(db, 'radarItems'), where('status', '==', 'Approved'));
  }, [db, authUser, hasCompanyAccess]);

  const { data: allTools } = useCollection<RadarItem>(toolsQuery);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    toolLinks: prefillToolId ? [prefillToolId] : [] as string[],
    howUsed: '',
    promptsOrTemplates: '',
    findings: '',
    recommendations: '',
    roleTitle: '',
    team: '',
    projectContext: '',
    dataSensitivity: 'Internal' as DataSensitivity,
    outcomeRating: 3,
    timeSavedHours: 0,
    tags: '',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!hasCompanyAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-black">{common.auth.companySignInRequired}</h1>
          <p className="mt-4 text-muted-foreground">
            {formContent.authError.description}
          </p>
          <Button asChild className="mt-8 rounded-full px-8">
            <Link href="/login">{common.auth.goToSignIn}</Link>
          </Button>
        </main>
      </div>
    );
  }

  const filteredTools = allTools?.filter(t => 
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) && 
    !formData.toolLinks.includes(t.id)
  ) || [];

  const handleAddTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      toolLinks: [...prev.toolLinks, toolId]
    }));
    setToolSearch('');
  };

  const handleRemoveTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      toolLinks: prev.toolLinks.filter(id => id !== toolId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !db || !hasCompanyAccess) return;

    if (formData.toolLinks.length === 0) {
      toast({ title: formContent.toasts.validationError.title, description: formContent.toasts.validationError.description, variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const experienceData: Partial<Experience> = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => !!t),
      status: 'Published',
      createdAt: Date.now(),
      createdBy: authUser.uid,
      creatorName: profile?.displayName || authUser.displayName || 'Greenberry Member',
      updatedAt: Date.now(),
      updatedBy: authUser.uid,
      viewsCount: 0,
      likesCount: 0,
    };

    try {
      addDocumentNonBlocking(collection(db, 'experiences'), experienceData);
      toast({ title: formContent.toasts.experienceLogged.title, description: formContent.toasts.experienceLogged.description });
      router.push('/experiences');
    } catch (e) {
      toast({ title: formContent.toasts.saveFailed.title, description: formContent.toasts.saveFailed.description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-10">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground font-bold hover:text-primary">
            <Link href="/experiences">
              <ArrowLeft className="w-5 h-5" />
              {formContent.returnToExperiences}
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase leading-none">{formContent.heading} <br/><span className="text-primary">{formContent.headingHighlight}</span></h1>
              <p className="text-xl text-muted-foreground font-medium">{formContent.description}</p>
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="rounded-full px-10 h-14 font-bold text-lg border-2" onClick={() => router.push('/experiences')}>
                {formContent.discard}
              </Button>
              <Button type="submit" className="gap-2 rounded-full px-12 h-14 font-bold text-lg shadow-lg hover:shadow-primary/20" disabled={loading}>
                <Save className="w-5 h-5" />
                {loading ? formContent.submittingButton : formContent.submitButton}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-8 space-y-10">
              <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none overflow-hidden">
                <CardHeader className="p-10 pb-2">
                  <div className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">{formContent.sections.strategicContext}</div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="font-bold text-sm tracking-tight text-foreground/70">{formContent.fields.experienceTitle.label}</Label>
                    <Input
                      id="title"
                      placeholder={formContent.fields.experienceTitle.placeholder} 
                      className="h-16 border-2 border-border focus:border-primary rounded-2xl text-xl bg-white/50"
                      required 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="summary" className="font-bold text-sm tracking-tight text-foreground/70">{formContent.fields.conciseSummary.label}</Label>
                    <Input
                      id="summary"
                      placeholder={formContent.fields.conciseSummary.placeholder} 
                      className="h-16 border-2 border-border focus:border-primary rounded-2xl text-lg bg-white/50"
                      required
                      value={formData.summary}
                      onChange={e => setFormData({...formData, summary: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">{formContent.fields.linkedTools.label}</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.toolLinks.map(id => {
                        const tool = allTools?.find(t => t.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="gap-2 font-bold px-4 py-2 rounded-full bg-primary text-primary-foreground border-none">
                            {tool?.name || 'Loading...'}
                            <X className="w-4 h-4 cursor-pointer hover:opacity-70" onClick={() => handleRemoveTool(id)} />
                          </Badge>
                        );
                      })}
                      {formData.toolLinks.length === 0 && (
                        <div className="text-sm text-muted-foreground italic py-2">{formContent.fields.linkedTools.emptyState}</div>
                      )}
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={formContent.fields.linkedTools.searchPlaceholder} 
                        className="h-14 border-2 border-border focus:border-primary rounded-2xl bg-white/50 pl-12"
                        value={toolSearch}
                        onChange={e => setToolSearch(e.target.value)}
                      />
                      {toolSearch && filteredTools.length > 0 && (
                        <Card className="absolute z-20 w-full mt-2 rounded-2xl border-2 shadow-xl p-2 max-h-60 overflow-y-auto">
                          {filteredTools.map(tool => (
                            <Button 
                              key={tool.id} 
                              variant="ghost" 
                              className="w-full justify-start font-bold h-12 rounded-xl px-4 gap-3"
                              onClick={() => handleAddTool(tool.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {tool.name}
                            </Button>
                          ))}
                        </Card>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none overflow-hidden">
                <CardHeader className="p-10 pb-2">
                  <div className="uppercase font-black tracking-[0.2em] text-[10px] text-primary">{formContent.sections.theProcess}</div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">{formContent.fields.workflowSteps.label}</Label>
                    <Textarea
                      placeholder={formContent.fields.workflowSteps.placeholder} 
                      className="min-h-[200px] border-2 border-border focus:border-primary rounded-2xl text-lg bg-white/50 p-6"
                      required
                      value={formData.howUsed}
                      onChange={e => setFormData({...formData, howUsed: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">{formContent.fields.promptsTemplates.label}</Label>
                    <Textarea
                      placeholder={formContent.fields.promptsTemplates.placeholder} 
                      className="min-h-[150px] font-mono border-2 border-border focus:border-primary rounded-2xl text-base bg-white/50 p-6"
                      value={formData.promptsOrTemplates}
                      onChange={e => setFormData({...formData, promptsOrTemplates: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">{formContent.fields.keyFindings.label}</Label>
                    <Textarea
                      placeholder={formContent.fields.keyFindings.placeholder} 
                      className="min-h-[200px] border-2 border-border focus:border-primary rounded-2xl text-lg bg-white/50 p-6"
                      required
                      value={formData.findings}
                      onChange={e => setFormData({...formData, findings: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-10">
              <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 p-4">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-[0.2em] text-[10px] text-muted-foreground">{formContent.sections.pulseMetadata}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">{formContent.fields.yourRole.label}</Label>
                    <Input
                      placeholder={formContent.fields.yourRole.placeholder} 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      required
                      value={formData.roleTitle}
                      onChange={e => setFormData({...formData, roleTitle: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">{formContent.fields.studioTeam.label}</Label>
                    <Input
                      placeholder={formContent.fields.studioTeam.placeholder} 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      required
                      value={formData.team}
                      onChange={e => setFormData({...formData, team: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">{formContent.fields.outcomeRating.label}</Label>
                    <Select value={formData.outcomeRating.toString()} onValueChange={val => setFormData({...formData, outcomeRating: parseInt(val)})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {[5, 4, 3, 2, 1].map(v => (
                          <SelectItem key={v} value={v.toString()} className="font-bold p-3">
                            {v} {v > 1 ? formContent.fields.outcomeRating.starPlural : formContent.fields.outcomeRating.starSingular} {v === 5 ? formContent.fields.outcomeRating.gameChanger : v === 1 ? formContent.fields.outcomeRating.caution : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 p-4">
                <CardHeader>
                  <CardTitle className="uppercase font-black tracking-[0.2em] text-[10px] text-muted-foreground">{formContent.sections.governanceImpact}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> {formContent.fields.dataSensitivity.label}
                    </Label>
                    <Select value={formData.dataSensitivity} onValueChange={val => setFormData({...formData, dataSensitivity: val as DataSensitivity})}>
                      <SelectTrigger className="rounded-xl h-14 border-2 font-bold bg-secondary/30 border-transparent transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Public" className="font-bold p-3">{formContent.fields.dataSensitivity.public}</SelectItem>
                        <SelectItem value="Internal" className="font-bold p-3">{formContent.fields.dataSensitivity.internal}</SelectItem>
                        <SelectItem value="Client Confidential" className="font-bold p-3">{formContent.fields.dataSensitivity.clientConfidential}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {formContent.fields.timeSaved.label}
                    </Label>
                    <Input 
                      type="number"
                      placeholder={formContent.fields.timeSaved.placeholder} 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      value={formData.timeSavedHours}
                      onChange={e => setFormData({...formData, timeSavedHours: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest opacity-50">{formContent.fields.tags.label}</Label>
                    <Input
                      placeholder={formContent.fields.tags.placeholder} 
                      className="rounded-xl h-14 border-2 border-transparent bg-secondary/30 font-bold px-4 focus:bg-white focus:border-primary transition-all"
                      value={formData.tags}
                      onChange={e => setFormData({...formData, tags: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        </div>
      }
    >
      <NewExperiencePageContent />
    </Suspense>
  );
}
