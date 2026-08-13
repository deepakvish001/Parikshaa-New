import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  Target, 
  Calendar, 
  BookOpen, 
  History, 
  TrendingUp,
  BrainCircuit,
  Code2,
  Trophy,
  Star,
  Zap,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TufyChat from '@/components/prephub/TufyChat';

const PrepHubDashboard = () => {
  const { user } = useAuth();
  const [onboarding, setOnboarding] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const [onboardingRes, roadmapRes, streakRes] = await Promise.all([
        supabase.from('user_onboarding').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_roadmaps').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      setOnboarding(onboardingRes.data);
      setRoadmap(roadmapRes.data);
      setStreak(streakRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialRoadmap = async () => {
    if (!user || !onboarding) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: { user_id: user.id, onboarding_data: onboarding }
      });
      if (error) throw error;

      const { data: roadmapData, error: dbError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.id,
          title: `Roadmap for ${onboarding.target_company}`,
          weekly_sprints: data.roadmap.weeks,
          status: 'active'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setRoadmap(roadmapData);
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prep Hub Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user?.user_metadata?.full_name || 'Scholar'}! Here's your personalized prep overview.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{streak?.current_streak || 0} Day Streak</span>
            </div>
            {!roadmap ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => generateInitialRoadmap()}>
                <Rocket className="mr-2 h-4 w-4" /> Generate Roadmap
              </Button>
            ) : (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Rocket className="mr-2 h-4 w-4" /> Start Today's Task
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Target Company</p>
                <p className="text-lg font-bold">{onboarding?.target_company || 'Not Set'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tasks Completed</p>
                <p className="text-lg font-bold">12 / 48</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Overall Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={25} className="h-2 w-24 bg-slate-800" />
                  <span className="text-xs font-bold">25%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Prep Score</p>
                <p className="text-lg font-bold">840/1000</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Progress Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Roadmap Widget */}
            <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Weekly Sprint Plan
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400" asChild>
                    <Link to="/roadmap">Full Roadmap <ChevronRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800">
                  {roadmap ? (
                    (roadmap.weekly_sprints?.[0]?.tasks || []).slice(0, 5).map((task: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${idx === 0 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700'}`}>
                            <span className="text-xs font-bold">{idx === 0 ? '✓' : idx + 1}</span>
                          </div>
                          <div>
                            <p className={`font-medium ${idx === 0 ? 'line-through text-slate-500' : ''}`}>
                              Day {task.day || idx + 1}: {task.title}
                            </p>
                            <p className="text-xs text-slate-500">{task.type} • {task.estimated_minutes} mins</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-700 h-8">
                          {idx === 0 ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      Generate your roadmap to see your daily plan.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/prephub/aptitude">
                <Card className="bg-slate-900/40 border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded">2000+ Topics</span>
                    </div>
                    <h3 className="mt-4 font-bold text-lg">Aptitude Module</h3>
                    <p className="text-sm text-slate-400 mt-1">Master logical and quantitative reasoning with step-by-step solutions.</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/prephub/interview-experiences">
                <Card className="bg-slate-900/40 border-slate-800 hover:border-purple-500/50 transition-all group cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <History className="h-5 w-5 text-purple-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded">Daily Updates</span>
                    </div>
                    <h3 className="mt-4 font-bold text-lg">Interview Experiences</h3>
                    <p className="text-sm text-slate-400 mt-1">Real world insights from recent candidates at top tech firms.</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            
            {/* POTD Widget */}
            <Card className="bg-slate-900/40 border-slate-800 overflow-hidden border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-bold tracking-wider text-blue-500 uppercase">Problem of the Day</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Trapping Rain Water</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-6">
                  <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded">Hard</span>
                  <span>Accuracy: 42%</span>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Solve Challenge</Button>
              </CardContent>
            </Card>

            {/* AI Mentor Quick Access */}
            <Card className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Ask Tufy AI</h3>
                    <p className="text-xs text-slate-400 italic">"I'll guide, you'll solve."</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-4">Stuck on a pattern? Get a hint without spoiling the solution.</p>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ask a hint..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Button size="icon" className="absolute right-1 top-1 h-7 w-7 bg-blue-600">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Revision Notes */}
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  Revision Snippets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Mastering DFS', 'Complexity Analysis', 'Bitmasking Tips'].map((note) => (
                  <div key={note} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{note}</span>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      
      {/* Floating Chatbot Component */}
      <TufyChat />
    </div>
  );
};

export default PrepHubDashboard;
