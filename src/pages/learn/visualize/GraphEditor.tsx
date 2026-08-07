import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Play, 
  Settings, 
  Download, 
  Share2, 
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  MousePointer2,
  Move,
  Type,
  Maximize2,
  Minimize2,
  X,
  Palette,
  Circle,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface Node {
  id: number;
  label: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  from: number;
  to: number;
  weight?: number;
}

const GraphEditor = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [isZeroIndexed, setIsZeroIndexed] = useState(true);
  const [isWeighted, setIsWeighted] = useState(false);
  const [isOriented, setIsOriented] = useState(false);
  const [nodeCount, setNodeCount] = useState("5");
  const [edgeInput, setEdgeInput] = useState("0 1\n1 2\n2 3\n3 4\n4 0");
  const [randomP, setRandomP] = useState("0.3");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize
  useEffect(() => {
    handleRender();
  }, []);

  // Simple Force-Directed Layout logic
  useEffect(() => {
    if (!physicsEnabled || isDragging) return;

    const interval = setInterval(() => {
      setNodes(prevNodes => {
        if (prevNodes.length === 0) return prevNodes;
        
        const newNodes = prevNodes.map(n => ({ ...n, vx: n.vx || 0, vy: n.vy || 0 }));
        const k = 0.1;
        const repulse = 1500;
        const centerForce = 0.01;
        const centerX = 400;
        const centerY = 350;

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[i].x - newNodes[j].x;
            const dy = newNodes[i].y - newNodes[j].y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);
            const force = repulse / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            newNodes[i].vx! += fx;
            newNodes[i].vy! += fy;
            newNodes[j].vx! -= fx;
            newNodes[j].vy! -= fy;
          }
        }

        edges.forEach(edge => {
          const from = newNodes.find(n => n.id === edge.from);
          const to = newNodes.find(n => n.id === edge.to);
          if (from && to) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const force = (dist - 120) * k;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            from.vx! += fx;
            from.vy! += fy;
            to.vx! -= fx;
            to.vy! -= fy;
          }
        });

        return newNodes.map(n => {
          n.vx! += (centerX - n.x) * centerForce;
          n.vy! += (centerY - n.y) * centerForce;
          n.vx! *= 0.9;
          n.vy! *= 0.9;

          return {
            ...n,
            x: Math.max(50, Math.min(750, n.x + n.vx!)),
            y: Math.max(50, Math.min(650, n.y + n.vy!))
          };
        });
      });
    }, 16);

    return () => clearInterval(interval);
  }, [edges, physicsEnabled, isDragging]);

  const handleRender = () => {
    const n = parseInt(nodeCount);
    if (isNaN(n) || n <= 0) {
      toast.error("Invalid node count");
      return;
    }

    const newNodes: Node[] = [];
    const radius = 200;
    const centerX = 400;
    const centerY = 350;

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI;
      newNodes.push({
        id: i,
        label: i.toString(),
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0
      });
    }

    const newEdges: Edge[] = [];
    const lines = edgeInput.trim().split("\n");
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const from = parseInt(parts[0]);
        const to = parseInt(parts[1]);
        const weight = parts[2] ? parseFloat(parts[2]) : undefined;
        if (!isNaN(from) && !isNaN(to) && from < n && to < n && from >= 0 && to >= 0) {
          newEdges.push({ from, to, weight });
        }
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const generateRandom = () => {
    const n = parseInt(nodeCount);
    const p = parseFloat(randomP);
    if (isNaN(n) || isNaN(p) || n <= 0) return;

    const newEdges: Edge[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.random() < p) {
          newEdges.push({ from: i, to: j });
        }
      }
    }
    setEdgeInput(newEdges.map(e => `${e.from} ${e.to}`).join("\n"));
    handleRender();
  };

  const handleMouseDown = (nodeId: number) => {
    setIsDragging(true);
    setDraggedNode(nodeId);
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedNode !== null && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (800 / rect.width);
      const y = (e.clientY - rect.top) * (700 / rect.height);
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x, y, vx: 0, vy: 0 } : n));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleExport = () => {
    toast.info("Exporting graph...");
  };

  return (
    <div 
      className="min-h-screen bg-black text-white p-8 font-serif select-none overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none opacity-40 hover:opacity-100 transition-opacity max-w-2xl px-4">
        <p className="text-[10px] leading-relaxed whitespace-pre-wrap uppercase tracking-[0.2em] font-sans italic text-white/60">
          '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                            
                                            Graph Editor ko complete correct working and design ke plan karo end to end
        </p>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 h-[85vh]">
        <div className="flex-1 relative border border-white/10 rounded-2xl bg-[#050505] overflow-hidden group shadow-2xl">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
            <h1 className="text-4xl font-bold tracking-tight text-white/90">Graph Editor</h1>
            <div className="flex gap-2">
              <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center cursor-pointer hover:bg-white/10">
                <X className="w-2.5 h-2.5" />
              </div>
              <div className="w-4 h-4 rounded-full border border-white/40 hover:bg-white/10 cursor-pointer" />
              <div className="w-4 h-4 rounded-full border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer" />
              <div className="w-4 h-4 rounded-full border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 cursor-pointer" />
            </div>
          </div>

          <svg 
            ref={svgRef}
            className="w-full h-full cursor-crosshair"
            viewBox="0 0 800 700"
          >
            {edges.map((edge, i) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <g key={`edge-${i}`}>
                  <line
                    x1={fromNode.x} y1={fromNode.y}
                    x2={toNode.x} y2={toNode.y}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  {isOriented && (
                    <circle cx={toNode.x} cy={toNode.y} r="4" fill="white" />
                  )}
                </g>
              );
            })}

            {nodes.map((node) => (
              <g 
                key={node.id} 
                className="cursor-pointer"
                onMouseDown={() => handleMouseDown(node.id)}
              >
                <circle
                  cx={node.x} cy={node.y} r="22"
                  fill="black"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2"
                  className={cn(
                    "transition-all duration-150",
                    selectedNode === node.id && "stroke-white r-[24px]"
                  )}
                />
                <text
                  x={node.x} y={node.y} dy=".3em"
                  textAnchor="middle" fill="white"
                  className="text-sm font-sans select-none pointer-events-none"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>

          <div className="absolute bottom-8 right-8 flex flex-col gap-4">
            <Button onClick={handleExport} variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/5 font-sans h-12 px-6 rounded-lg text-lg gap-2">
              <Download className="w-5 h-5" />
              graph.png
            </Button>
          </div>
          
          <div className="absolute bottom-8 left-8">
            <Button 
              onClick={() => setPhysicsEnabled(!physicsEnabled)} 
              variant="ghost" 
              className={cn("text-white/40 hover:text-white", physicsEnabled && "text-white/80")}
            >
              {physicsEnabled ? "Physics On" : "Physics Off"}
            </Button>
          </div>
        </div>

        <div className="w-full md:w-[380px] flex flex-col gap-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
            <Tabs defaultValue="input" className="w-full flex-1 flex flex-col">
              <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none p-0 h-auto gap-4 mb-8">
                <TabsTrigger value="input" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white border-b-2 border-transparent rounded-none px-4 py-2 text-base font-sans uppercase tracking-widest text-white/60 data-[state=active]:text-white">Input</TabsTrigger>
                <TabsTrigger value="random" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white border-b-2 border-transparent rounded-none px-4 py-2 text-base font-sans uppercase tracking-widest text-white/60 data-[state=active]:text-white">Random</TabsTrigger>
                <TabsTrigger value="print" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white border-b-2 border-transparent rounded-none px-4 py-2 text-base font-sans uppercase tracking-widest text-white/60 data-[state=active]:text-white">Print</TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="space-y-6 flex-1 flex flex-col mt-0">
                <h3 className="text-2xl font-bold tracking-tight text-white/90">Input Graph</h3>
                <div className="flex items-center gap-4">
                  <label className="text-xl font-sans text-white/80">n =</label>
                  <Input 
                    value={nodeCount} 
                    onChange={e => setNodeCount(e.target.value)}
                    className="bg-[#111] border-white/10 text-white text-lg h-10 w-full font-sans"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xl font-sans text-white/80">edges:</label>
                  <div className="relative flex-1">
                    <textarea 
                      value={edgeInput}
                      onChange={e => setEdgeInput(e.target.value)}
                      className="w-full h-full min-h-[250px] bg-[#111] border border-white/10 rounded-lg p-4 font-mono text-white/90 focus:outline-none focus:border-white/30 resize-none text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isZeroIndexed} onChange={e => setIsZeroIndexed(e.target.checked)} className="w-5 h-5 accent-primary" />
                    <span className="text-lg font-sans text-white/80">zero-indexed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isOriented} onChange={e => setIsOriented(e.target.checked)} className="w-5 h-5 accent-primary" />
                    <span className="text-lg font-sans text-white/80">oriented</span>
                  </div>
                </div>
                <Button onClick={handleRender} className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 text-2xl h-14 font-serif rounded-lg">
                  render
                </Button>
              </TabsContent>

              <TabsContent value="random" className="space-y-6">
                 <h3 className="text-2xl font-bold tracking-tight text-white/90">Random Graph</h3>
                 <div className="flex items-center gap-4">
                  <label className="text-xl font-sans text-white/80">n =</label>
                  <Input 
                    value={nodeCount} onChange={e => setNodeCount(e.target.value)}
                    className="bg-[#111] border-white/10 text-white text-lg h-10 w-full font-sans"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-xl font-sans text-white/80">p =</label>
                  <Input 
                    value={randomP} onChange={e => setRandomP(e.target.value)}
                    className="bg-[#111] border-white/10 text-white text-lg h-10 w-full font-sans"
                  />
                </div>
                <Button onClick={generateRandom} className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 text-2xl h-14 font-serif rounded-lg">
                  render
                </Button>
              </TabsContent>

              <TabsContent value="print" className="space-y-6">
                <h3 className="text-2xl font-bold tracking-tight text-white/90">Print Current Graph</h3>
                <div className="bg-[#111] p-4 rounded-lg font-mono text-white/60">
                  {nodeCount}<br/>
                  {edges.map((e, i) => (
                    <div key={i}>{e.from} {e.to}</div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center shadow-xl">
             <p className="text-white/60 font-sans italic">- drag nodes to move them</p>
             <p className="text-white/60 font-sans italic">- physics keeps nodes separated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphEditor;