import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Target, Calendar, Briefcase, Rocket, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from "sonner";

const PrepHubOnboarding = () => {
  const navigate = useNavigate();
  const { refreshPrepHubOnboarding } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    target_company: '',
    target_role: '',
    target_timeline: '3 months',
    skills: [] as string[]
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          ...formData,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Onboarding completed! Generating your roadmap...");
      
      await refreshPrepHubOnboarding();
      navigate('/prephub/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Rocket className="text-blue-500 h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome to Prep Hub</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Let's personalize your interview preparation journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">What is your dream company?</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input 
                    id="company" 
                    placeholder="e.g. Google, Microsoft, Meta" 
                    className="pl-10 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    value={formData.target_company}
                    onChange={(e) => setFormData({...formData, target_company: e.target.value})}
                  />
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setStep(2)}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">What role are you targeting?</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input 
                    id="role" 
                    placeholder="e.g. Software Engineer, Frontend, Backend" 
                    className="pl-10 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    value={formData.target_role}
                    onChange={(e) => setFormData({...formData, target_role: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setStep(3)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timeline">Prep Timeline</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <select 
                    id="timeline"
                    className="w-full pl-10 h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 focus:ring-blue-500"
                    value={formData.target_timeline}
                    onChange={(e) => setFormData({...formData, target_timeline: e.target.value})}
                  >
                    <option value="1 month">1 Month (Crash Course)</option>
                    <option value="3 months">3 Months (Standard)</option>
                    <option value="6 months">6 Months (Deep Dive)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300" onClick={() => setStep(2)}>Back</Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700" 
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Start Journey"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrepHubOnboarding;
