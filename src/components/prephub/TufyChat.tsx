import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const TufyChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Tufy, your Socratic AI mentor. I won't give you the answer, but I'll help you find it. What are you working on?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // System prompt for Socratic guidance
      const systemPrompt = "You are Tufy, a Socratic AI mentor for DSA and interview prep. NEVER give direct code solutions or final answers. Instead, ask guiding questions, provide conceptual hints, and nudge the user toward the correct pattern or approach. If the user asks for code, explain the logic and ask how they would implement a specific part of it.";

      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            { role: 'user', content: userMsg }
          ]
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error: any) {
      console.error("Tufy error:", error);
      toast.error("Tufy is taking a nap. Try again later.");
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I hit a snag. Let's try that again. What was the logic you were thinking of?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 h-[500px] flex flex-col bg-slate-900 border-slate-800 shadow-2xl animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-indigo-600 p-4 flex flex-row items-center justify-between text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Tufy AI Mentor</CardTitle>
                <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                  <Sparkles className="h-2 w-2" /> Socratic Mode Active
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1">
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" />
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce delay-75" />
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask a hint..."
                className="w-full bg-slate-950 border border-slate-800 rounded-full py-2.5 pl-4 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                className="absolute right-1 top-1 h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-full"
                onClick={handleSend}
                disabled={loading}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" /> Tufy will never give you the answer.
            </p>
          </div>
        </Card>
      ) : (
        <Button 
          className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 group animate-bounce"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-950" />
        </Button>
      )}
    </div>
  );
};

export default TufyChat;
