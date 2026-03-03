"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  Layers, 
  Circle, 
  Save, 
  Plus, 
  Trash2,
  Lock,
  Mail
} from 'lucide-react';
import { DEFAULT_CONFIG } from '@/app/lib/radar-types';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export default function AdminPage() {
  const [quadrants, setQuadrants] = useState(DEFAULT_CONFIG.quadrants);
  const [rings, setRings] = useState(DEFAULT_CONFIG.rings);

  const MOCK_USERS = [
    { name: 'Jane Doe', email: 'jane@agency.com', role: 'Admin', team: 'Management' },
    { name: 'John Smith', email: 'john@agency.com', role: 'Editor', team: 'Engineering' },
    { name: 'Alice Wong', email: 'alice@agency.com', role: 'Viewer', team: 'Design' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Workspace</h1>
            <p className="text-muted-foreground">Manage your radar configuration and user permissions.</p>
          </div>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="bg-muted/50 w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6 gap-2">
              <Layers className="w-4 h-4" /> Radar Structure
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6 gap-2">
              <Users className="w-4 h-4" /> User Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quadrants</CardTitle>
                  <CardDescription>Define the core categories of your radar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quadrants.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <Input 
                        value={q} 
                        onChange={(e) => {
                          const next = [...quadrants];
                          next[i] = e.target.value;
                          setQuadrants(next);
                        }}
                      />
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2 mt-2">
                    <Plus className="w-4 h-4" /> Add Quadrant
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rings</CardTitle>
                  <CardDescription>Configure the maturity levels for items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rings.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <Input 
                        value={r} 
                        onChange={(e) => {
                          const next = [...rings];
                          next[i] = e.target.value;
                          setRings(next);
                        }}
                      />
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2 mt-2">
                    <Plus className="w-4 h-4" /> Add Ring
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button className="gap-2 px-8">
                <Save className="w-4 h-4" /> Save Configuration
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Authorized Users</CardTitle>
                  <CardDescription>Manage who can access and edit the radar.</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Invite User
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_USERS.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === 'Admin' ? 'default' : 'secondary'}
                            className="gap-1 px-3"
                          >
                            <Lock className="w-3 h-3" /> {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.team}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}