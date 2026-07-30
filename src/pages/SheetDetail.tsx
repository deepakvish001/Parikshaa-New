import React, { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  CheckSquare, 
  Square, 
  Youtube, 
  FileText, 
  ExternalLink, 
  PlusCircle, 
  Star,
  ChevronRight,
  ArrowLeft,
  X,
  Save,
  Loader2,
  Search,
  Shuffle,
  ChevronDown,
  Sparkles,
  Flame,
  RotateCcw,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import StreakCounter from "@/components/StreakCounter";
import { useStreak } from "@/hooks/useStreak";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekProgressPanel } from "@/components/sheets/WeekProgressPanel";
import { RevisionPassControl } from "@/components/sheets/RevisionPassControl";
import { RevisionViewToggle, type RevisionView } from "@/components/sheets/RevisionViewToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { dsaLevel1Sections, dsaLevel1Meta } from "@/data/dsaLevel1Data";
import { dsaLevel2Sections, dsaLevel2Meta } from "@/data/dsaLevel2Data";
import { dsaLevel3Sections, dsaLevel3Meta } from "@/data/dsaLevel3Data";
import { blind75Sections, blind75Meta } from "@/data/blind75Data";
import { neetcode150Sections, neetcode150Meta } from "@/data/neetcode150Data";
import { neetcode250Sections, neetcode250Meta } from "@/data/neetcode250Data";
import { striversA2ZSections, striversA2ZMeta } from "@/data/striversA2ZData";
import { dbmsSections, dbmsMeta } from "@/data/dbmsData";
import { cnSections, cnMeta } from "@/data/cnData";
import { osSections, osMeta } from "@/data/osData";
import { acmIcpcSections, acmIcpcMeta, acmIcpcFaqs, acmIcpcChecklist } from "@/data/acmIcpcTrainingData";
import { cpLadderSections, cpLadderMeta } from "@/data/cpLadderData";
import { striverSDESections, striverSDEMeta } from "@/data/striverSDEData";
import { striverSDSections, striverSDMeta } from "@/data/striverSDData";
import { sqlPracticeSections, sqlPracticeMeta } from "@/data/sqlPracticeData";
import { advSqlSections, advSqlMeta } from "@/data/advSqlData";
import { problemSolvingFoundationSections, problemSolvingFoundationMeta } from "@/data/problemSolvingFoundationData";
import { linkedListSheetSections, linkedListSheetMeta } from "@/data/linkedListSheetData";
import { stackSheetSections, stackSheetMeta } from "@/data/stackSheetData";
import { queueSheetSections, queueSheetMeta } from "@/data/queueSheetData";
import { arraySheetSections, arraySheetMeta } from "@/data/arraySheetData";
import { stringSheetSections, stringSheetMeta } from "@/data/stringSheetData";
import { binaryTreeSheetSections, binaryTreeSheetMeta } from "@/data/binaryTreeSheetData";
import { graphSheetSections, graphSheetMeta } from "@/data/graphSheetData";
import { dpSheetSections, dpSheetMeta } from "@/data/dpSheetData";
import { backtrackingSheetSections, backtrackingSheetMeta } from "@/data/backtrackingSheetData";
import { heapSheetSections, heapSheetMeta } from "@/data/heapSheetData";
import { greedySheetSections, greedySheetMeta } from "@/data/greedySheetData";
import { bitSheetSections, bitSheetMeta } from "@/data/bitSheetData";
import { trieSheetSections, trieSheetMeta } from "@/data/trieSheetData";
import { recursionSheetSections, recursionSheetMeta } from "@/data/recursionSheetData";
import { binarySearchSheetSections, binarySearchSheetMeta } from "@/data/binarySearchSheetData";
import { mathSheetSections, mathSheetMeta } from "@/data/mathSheetData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import MobileFAB from "@/components/MobileFAB";
import CPFloatingProgress from "@/components/sheets/CPFloatingProgress";
import ACMChecklistCard from "@/components/sheets/ACMChecklistCard";
import ACMPaceCalculator from "@/components/sheets/ACMPaceCalculator";
import Blind75StudyPlan, { Blind75Prefs, loadBlind75Prefs, parseEstMinutes } from "@/components/sheets/Blind75StudyPlan";
import { bucketByWeeks } from "@/lib/blind75Schedule";
import { CollapsibleSection } from "@/components/shell/CollapsibleSection";
import { AccessErrorPanel } from "@/components/access/AccessErrorPanel";
import { Info, Activity, Clock, CalendarClock, CalendarDays, ClipboardCheck, HelpCircle } from "lucide-react";

// Types
interface Topic {
  id: string;
  title: string;
  completed: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  resourceType: "youtube" | "article" | "link" | null;
  resourceUrl?: string;
  articleUrl?: string;
  practiceUrl?: string;
  note: string;
  isRevision: boolean;
  estTime?: string;
  revisionCount?: number;
  revisionHistory?: string[];
  lastRevisedAt?: string | null;
  startHere?: boolean;
}

interface SubSection {
  id: string;
  title: string;
  topics: Topic[];
  prerequisites?: string[];
}

interface Section {
  id: string;
  title: string;
  subSections: SubSection[];
}


interface SheetData {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  totalProblems: number;
  completed: number;
  easy: number;
  medium: number;
  hard: number;
  sections: Section[];
}

// Mock data for sheets
const mockSheetData: Record<string, SheetData> = {
  "strivers-sde-sheet": {
    ...striverSDEMeta,
    sections: striverSDESections,
  },
  "problem-solving-foundation": {
    ...problemSolvingFoundationMeta,
    sections: problemSolvingFoundationSections,
  },
  "neetcode-150": {
    ...neetcode150Meta,
    sections: neetcode150Sections,
  },
  "neetcode-250": {
    ...neetcode250Meta,
    sections: neetcode250Sections,
  },
  "strivers-a2z-dsa": {
    ...striversA2ZMeta,
    sections: striversA2ZSections,
  },
  "dbms-sheet": {
    ...dbmsMeta,
    sections: dbmsSections,
  },
  "cn-sheet": {
    ...cnMeta,
    sections: cnSections,
  },
  "os-sheet": {
    ...osMeta,
    sections: osSections,
  },
  "acm-icpc-training": {
    ...acmIcpcMeta,
    sections: acmIcpcSections,
  },
  "parikshaa-cp-sheet": {
    ...cpLadderMeta,
    sections: cpLadderSections,
  },
  "striver-sd-sheet": {
    ...striverSDMeta,
    sections: striverSDSections,
  },
  "sql-practice": {
    ...sqlPracticeMeta,
    sections: sqlPracticeSections,
  },
  "adv-sql-practice": {
    ...advSqlMeta,
    sections: advSqlSections,
  },
  "competitive-programming": {
    id: "competitive-programming",
    title: "Competitive Programming Sheet",
    description: "Master algorithms through structured problem sets from Codeforces, AtCoder & ICPC",
    lastUpdated: "February 7, 2026",
    totalProblems: 320,
    completed: 0,
    easy: 80,
    medium: 150,
    hard: 90,
    sections: [
      {
        id: "cp-preliminaries",
        title: "Preliminaries",
        subSections: [
          {
            id: "cp-lang-basics",
            title: "Language Basics",
            topics: [
              { id: "cp-1", title: "Fast I/O in C++", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-2", title: "Template Setup", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-3", title: "Debugging Techniques", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-4", title: "Time Complexity Analysis", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-5", title: "Common Pitfalls & Edge Cases", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-io-practice",
            title: "Input/Output Practice",
            topics: [
              { id: "cp-6", title: "Multiple Test Cases", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-7", title: "Reading Until EOF", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-8", title: "String Parsing", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-basics",
        title: "Basics",
        subSections: [
          {
            id: "cp-sorting",
            title: "Sorting Algorithms",
            topics: [
              { id: "cp-9", title: "Counting Sort", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-10", title: "Radix Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-11", title: "Custom Comparators", completed: false, difficulty: "Easy", resourceType: "article", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-12", title: "Coordinate Compression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-two-pointers",
            title: "Two Pointers & Sliding Window",
            topics: [
              { id: "cp-13", title: "Two Pointers Technique", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-14", title: "Sliding Window Fixed Size", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-15", title: "Sliding Window Variable Size", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-16", title: "Meet in the Middle", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-prefix",
            title: "Prefix Sum & Difference Arrays",
            topics: [
              { id: "cp-17", title: "1D Prefix Sum", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-18", title: "2D Prefix Sum", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-19", title: "Difference Array", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-20", title: "Range Update Queries", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-greedy",
            title: "Greedy Algorithms",
            topics: [
              { id: "cp-21", title: "Activity Selection", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-22", title: "Fractional Knapsack", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-23", title: "Job Scheduling", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-24", title: "Huffman Coding", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-intermediate",
        title: "Intermediate",
        subSections: [
          {
            id: "cp-binary-search",
            title: "Binary Search Advanced",
            topics: [
              { id: "cp-25", title: "Binary Search on Answer", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-26", title: "Ternary Search", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-27", title: "Parallel Binary Search", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-28", title: "Fractional Binary Search", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-dp-intro",
            title: "Dynamic Programming Introduction",
            topics: [
              { id: "cp-29", title: "DP Fundamentals", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-30", title: "1D DP Problems", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-31", title: "2D DP Problems", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-32", title: "Knapsack Variants", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-33", title: "LIS & LCS", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-34", title: "Digit DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-graphs-basic",
            title: "Graph Fundamentals",
            topics: [
              { id: "cp-35", title: "Graph Representation", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-36", title: "BFS & DFS", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-37", title: "Cycle Detection", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-38", title: "Bipartite Check", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-39", title: "Topological Sort", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-40", title: "Dijkstra's Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-number-theory",
            title: "Number Theory",
            topics: [
              { id: "cp-41", title: "Prime Sieve", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-42", title: "Prime Factorization", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-43", title: "GCD & LCM", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-44", title: "Modular Arithmetic", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-45", title: "Modular Inverse", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-46", title: "Fast Exponentiation", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-advanced-ds",
        title: "Advanced Data Structures",
        subSections: [
          {
            id: "cp-segment-tree",
            title: "Segment Tree",
            topics: [
              { id: "cp-47", title: "Basic Segment Tree", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-48", title: "Lazy Propagation", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-49", title: "Segment Tree with Merge", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-50", title: "Persistent Segment Tree", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-fenwick",
            title: "Fenwick Tree (BIT)",
            topics: [
              { id: "cp-51", title: "Basic BIT", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-52", title: "Range Update Point Query", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-53", title: "2D BIT", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-dsu",
            title: "Disjoint Set Union",
            topics: [
              { id: "cp-54", title: "Basic DSU", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-55", title: "DSU by Rank/Size", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-56", title: "Path Compression", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-57", title: "DSU on Trees", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-trie",
            title: "Trie & Suffix Structures",
            topics: [
              { id: "cp-58", title: "Basic Trie", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-59", title: "XOR Trie", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-60", title: "Suffix Array", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-advanced-algo",
        title: "Advanced Algorithms",
        subSections: [
          {
            id: "cp-graphs-adv",
            title: "Advanced Graph Algorithms",
            topics: [
              { id: "cp-61", title: "Bellman-Ford", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-62", title: "Floyd-Warshall", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-63", title: "MST (Kruskal & Prim)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-64", title: "SCC (Kosaraju/Tarjan)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-65", title: "Bridges & Articulation Points", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-66", title: "LCA & Binary Lifting", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-dp-advanced",
            title: "Advanced DP",
            topics: [
              { id: "cp-67", title: "DP on Trees", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-68", title: "Bitmask DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-69", title: "SOS DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-70", title: "Divide & Conquer DP", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-71", title: "Convex Hull Trick", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-strings",
            title: "String Algorithms",
            topics: [
              { id: "cp-72", title: "KMP Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-73", title: "Z Algorithm", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-74", title: "Rabin-Karp Hashing", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-75", title: "Aho-Corasick", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-math",
        title: "Advanced Mathematics",
        subSections: [
          {
            id: "cp-combinatorics",
            title: "Combinatorics",
            topics: [
              { id: "cp-76", title: "nCr & nPr", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-77", title: "Pascal's Triangle", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-78", title: "Catalan Numbers", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-79", title: "Inclusion-Exclusion", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-80", title: "Stars and Bars", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-game-theory",
            title: "Game Theory",
            topics: [
              { id: "cp-81", title: "Nim Game", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-82", title: "Sprague-Grundy Theorem", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-83", title: "Minimax Algorithm", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-fft",
            title: "FFT & Polynomial",
            topics: [
              { id: "cp-84", title: "FFT Basics", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-85", title: "NTT", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-86", title: "Polynomial Multiplication", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
      {
        id: "cp-contests",
        title: "Contest Problem Sets",
        subSections: [
          {
            id: "cp-atcoder",
            title: "AtCoder Beginner Problems",
            topics: [
              { id: "cp-87", title: "ABC 300 - A to D", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-88", title: "ABC 310 - A to D", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-89", title: "ABC 320 - A to D", completed: false, difficulty: "Medium", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-90", title: "ABC E-F Collection", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-codeforces",
            title: "Codeforces Educational",
            topics: [
              { id: "cp-91", title: "Div 2 A-B Problems", completed: false, difficulty: "Easy", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-92", title: "Div 2 C-D Problems", completed: false, difficulty: "Medium", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-93", title: "Div 2 E-F Problems", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-94", title: "Educational Round Collection", completed: false, difficulty: "Medium", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
          {
            id: "cp-icpc",
            title: "ICPC Problems",
            topics: [
              { id: "cp-95", title: "ICPC Regionals 2023", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-96", title: "ICPC World Finals 2022", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
              { id: "cp-97", title: "ICPC World Finals 2023", completed: false, difficulty: "Hard", resourceType: "link", resourceUrl: "#", articleUrl: "#", practiceUrl: "#", note: "", isRevision: false },
            ],
          },
        ],
      },
    ],
  },
  "dsa-level-1": {
    ...dsaLevel1Meta,
    sections: dsaLevel1Sections,
  },
  "dsa-level-2": {
    ...dsaLevel2Meta,
    sections: dsaLevel2Sections,
  },
  "dsa-level-3": {
    ...dsaLevel3Meta,
    sections: dsaLevel3Sections,
  },
  "blind-75": {
    ...blind75Meta,
    sections: blind75Sections,
  },
  "linked-list-typewise": {
    ...linkedListSheetMeta,
    id: "linked-list-typewise",
    title: "Linked List Questions Sheet (Type-wise)",
    description:
      "Type-wise Linked List question bank — organised by pattern (recursion, reversing, reordering, two-pointer, hash, design, merge sort, tree + monotonic stack).",
    sections: linkedListSheetSections,
  },
  "stack-typewise": {
    ...stackSheetMeta,
    id: "stack-typewise",
    title: "Stack Questions Sheet (Type-wise)",
    description:
      "Type-wise Stack question bank — design, parentheses, string reduce, expression eval, monotonic stack, simulation, iterative tree traversal & advanced patterns.",
    sections: stackSheetSections,
  },
  "queue-typewise": {
    ...queueSheetMeta,
    id: "queue-typewise",
    title: "Queue Questions Sheet (Type-wise)",
    description:
      "Type-wise Queue question bank — design, BFS on tree/graph/matrix, multi-source BFS, implicit-graph shortest path, Kahn's topo sort, monotonic deque & simulation.",
    sections: queueSheetSections,
  },
  "array-typewise": {
    ...arraySheetMeta,
    id: "array-typewise",
    title: "Array Questions Sheet (Type-wise)",
    description:
      "Type-wise Array question bank (basic → advanced) — prefix sum, two pointers, sliding window, Kadane, hashing, intervals, binary search, matrix, cyclic sort, greedy, bits, voting, in-place, LIS & BIT.",
    sections: arraySheetSections,
  },
  "string-typewise": {
    ...stringSheetMeta,
    id: "string-typewise",
    title: "String Questions Sheet (Type-wise)",
    description:
      "Type-wise String question bank (basic → advanced) — two pointers, sliding window, hashing, KMP/Rabin-Karp, palindromes, parsing, conversion, string DP, Trie, greedy & advanced.",
    sections: stringSheetSections,
  },
  "binary-tree-typewise": {
    ...binaryTreeSheetMeta,
    id: "binary-tree-typewise",
    title: "Binary Tree & BST Questions Sheet (Type-wise)",
    description:
      "Type-wise Binary Tree & BST question bank (basic → advanced) — DFS/BFS traversals, construction, properties, paths, LCA, views, BST inorder tricks, structural mods, Tree DP, distance, serialize.",
    sections: binaryTreeSheetSections,
  },
  "graph-typewise": {
    ...graphSheetMeta,
    id: "graph-typewise",
    title: "Graph Questions Sheet (Type-wise)",
    description:
      "Type-wise Graph question bank (basic → advanced) — DFS components, BFS shortest path, topo sort, Union-Find, cycle/bipartite, Dijkstra, Bellman-Ford, Floyd-Warshall, MST, bridges/Eulerian & bitmask BFS.",
    sections: graphSheetSections,
  },
  "dp-typewise": {
    ...dpSheetMeta,
    id: "dp-typewise",
    title: "Dynamic Programming Questions Sheet (Type-wise)",
    description:
      "Type-wise DP question bank (basic → advanced) — 1D linear, house robber, Kadane, 0/1 & unbounded knapsack, grid, LIS, 2-sequence LCS/edit distance, palindrome, interval/MCM, stock state-machine, bitmask, tree DP, digit DP, game theory & counting.",
    sections: dpSheetSections,
  },
  "backtracking-typewise": {
    ...backtrackingSheetMeta,
    id: "backtracking-typewise",
    title: "Backtracking Questions Sheet (Type-wise)",
    description:
      "Type-wise Backtracking question bank (basic → advanced) — subsets, combinations, permutations, combination sum, string generation, partitioning, grid backtracking, N-Queens/Sudoku & advanced pruning.",
    sections: backtrackingSheetSections,
  },
  "heap-typewise": {
    ...heapSheetMeta,
    id: "heap-typewise",
    title: "Heap / Priority Queue Questions Sheet (Type-wise)",
    description:
      "Type-wise Heap / Priority Queue question bank (basic → advanced) — top K, kth smallest, K-way merge, two heaps (median), heap+greedy scheduling, Dijkstra on grids & advanced design.",
    sections: heapSheetSections,
  },
  "greedy-typewise": {
    ...greedySheetMeta,
    id: "greedy-typewise",
    title: "Greedy Questions Sheet (Type-wise)",
    description:
      "Type-wise Greedy question bank (basic → advanced) — classics, interval scheduling, sort-based, jump/reachability, two-pointer, string, monotonic stack, heap greedy & advanced hard.",
    sections: greedySheetSections,
  },
  "math-typewise": {
    ...mathSheetMeta,
    id: "math-typewise",
    title: "Math / Number Theory Questions Sheet (Type-wise)",
    description:
      "Type-wise Math & Number Theory question bank (basic → advanced) — digit tricks, GCD/LCM (Euclid), Sieve/primes, fast exponentiation & modular inverse, combinatorics (Pascal/Catalan), base conversion, divisors, geometry, sampling & advanced hard.",
    sections: mathSheetSections,
  },
  "bit-typewise": {
    ...bitSheetMeta,
    id: "bit-typewise",
    title: "Bit Manipulation Questions Sheet (Type-wise)",
    description:
      "Type-wise Bit Manipulation question bank (basic → advanced) — basics, XOR family, counting bits, power checks, tricks, bitmask enumeration, bit math, bit-trie max-XOR, bitmask DP & advanced.",
    sections: bitSheetSections,
  },
  "trie-typewise": {
    ...trieSheetMeta,
    id: "trie-typewise",
    title: "Trie (Prefix Tree) Questions Sheet (Type-wise)",
    description:
      "Type-wise Trie question bank (basic → advanced) — implementation, prefix/word lookup, autocomplete, trie+backtracking (Word Search II), trie+DP, bit-trie max-XOR & advanced.",
    sections: trieSheetSections,
  },
  "recursion-typewise": {
    ...recursionSheetMeta,
    id: "recursion-typewise",
    title: "Recursion Questions Sheet (Type-wise)",
    description:
      "Type-wise Recursion sheet — foundation for Backtracking, Trees & DP. Warm-ups, numbers/math, linked list, divide & conquer, subsets bridge, tree recursion, memo bridge & advanced classics.",
    sections: recursionSheetSections,
  },
  "binary-search-typewise": {
    ...binarySearchSheetMeta,
    id: "binary-search-typewise",
    title: "Binary Search Questions Sheet (Type-wise)",
    description:
      "Type-wise Binary Search sheet — classic exact match, lower/upper bounds, rotated & mountain, 2D matrix, BS on answer (minimize max / maximize min), median/kth via BS & advanced.",
    sections: binarySearchSheetSections,
  },
};

// Difficulty badge component
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const colorMap = {
    Easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  
  return (
    <span className={cn(
      "text-xs px-2.5 py-1 rounded-full border font-medium",
      colorMap[difficulty]
    )}>
      {difficulty}
    </span>
  );
}

// Animated Progress Bar component
function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-secondary group", className)}>
      <motion.div
        className="h-full bg-primary rounded-full relative"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_ease-in-out_infinite] transition-opacity" />
      </motion.div>
      {value === 100 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -right-1 -top-1"
        >
          <Sparkles className="h-3 w-3 text-primary" />
        </motion.div>
      )}
    </div>
  );
}

// Topic row component with hover animations
function TopicRow({ 
  topic, 
  onToggle,
  onOpenNote,
  onToggleRevision,
  showRevisionControl,
  onMarkRevised,
  onUndoLastPass,
  onResetPasses,
}: { 
  topic: Topic; 
  onToggle: (id: string) => void;
  onOpenNote: (topic: Topic) => void;
  onToggleRevision: (id: string) => void;
  showRevisionControl?: boolean;
  onMarkRevised?: (id: string) => void;
  onUndoLastPass?: (id: string) => void;
  onResetPasses?: (id: string) => void;
}) {
  const rowNavigate = useNavigate();
  const [rowSearchParams, setRowSearchParams] = useSearchParams();
  /**
   * Opens a blog article inside the sheet's middle content area.
   * Pushes ?article=<slug> so browser back/forward and deep links work,
   * and remembers the current scroll offset so closing restores the row.
   */
  const openArticleInline = (slug: string, topicId: string) => {
    try {
      sessionStorage.setItem(
        `sheet-scroll:${window.location.pathname}`,
        String(window.scrollY),
      );
    } catch {
      /* storage unavailable — scroll restore is best-effort */
    }
    const next = new URLSearchParams(rowSearchParams);
    next.set("article", slug);
    next.set("from", topicId);
    setRowSearchParams(next);
  };
  const getEstTime = (topic: Topic) => {


    if (topic.estTime) return topic.estTime;
    switch (topic.difficulty) {
      case "Easy": return "15 min";
      case "Medium": return "30 min";
      case "Hard": return "45 min";
      default: return "20 min";
    }
  };

  return (
    <motion.tr
      data-topic-id={topic.id}
      className="border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted group scroll-mt-24"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ 
        backgroundColor: "hsl(var(--muted) / 0.5)",
        transition: { duration: 0.15 }
      }}
    >
      {/* Status */}
      <TableCell className="w-14">
        <motion.button
          onClick={() => onToggle(topic.id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {topic.completed ? (
              <motion.div
                key="checked"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <CheckSquare className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TableCell>
      
      {/* Problem Title */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          <motion.span 
            className={cn(
              "inline-block transition-colors",
              topic.completed && "line-through text-muted-foreground"
            )}
            animate={{ 
              opacity: topic.completed ? 0.6 : 1,
              x: topic.completed ? 5 : 0 
            }}
            transition={{ duration: 0.2 }}
          >
            {topic.title}
          </motion.span>
          {topic.startHere && !topic.completed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <Sparkles className="h-2.5 w-2.5" />
              Start Here
            </span>
          )}
        </div>
      </TableCell>

      
      {/* Problem Link */}
      <TableCell className="w-24 text-center">
        {topic.practiceUrl && topic.practiceUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.practiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Solve Problem</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      
      {/* Resource Articles */}
      <TableCell className="w-24 text-center">
        {topic.articleUrl && topic.articleUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.articleUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-muted hover:bg-muted/80 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FileText className="h-4 w-4 text-foreground" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Read Article</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : topic.resourceType === "article" && topic.resourceUrl && topic.resourceUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.resourceUrl} 
                  target={topic.resourceUrl.startsWith("/") ? undefined : "_blank"} 
                  rel={topic.resourceUrl.startsWith("/") ? undefined : "noopener noreferrer"}
                  onClick={(e) => {
                    const url = topic.resourceUrl;
                    if (!url?.startsWith("/")) return;
                    e.preventDefault();
                    if (url.startsWith("/blog/")) {
                      // Open inside the sheet's middle section (deep-linkable)
                      openArticleInline(url.replace(/^\/blog\//, ""), topic.id);
                    } else {
                      rowNavigate(url);
                    }
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-muted hover:bg-muted/80 transition-colors"


                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FileText className="h-4 w-4 text-foreground" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Read Article</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      
      {/* Resource Videos */}
      <TableCell className="w-24 text-center">
        {topic.resourceType === "youtube" && topic.resourceUrl && topic.resourceUrl !== "#" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a 
                  href={topic.resourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Youtube className="h-4 w-4 text-destructive" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Watch Video</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      
      {/* Note */}
      <TableCell className="w-14 text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button 
                onClick={() => onOpenNote(topic)}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  topic.note 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <PlusCircle className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>{topic.note ? "Edit Note" : "Add Note"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      
      {/* Revision */}
      <TableCell className={cn("text-center", showRevisionControl ? "w-40" : "w-20")}>

        <div className="inline-flex items-center justify-center gap-1.5">
          <motion.button 
            onClick={() => onToggleRevision(topic.id)}
            className={cn(
              "transition-colors",
              topic.isRevision 
                ? "text-yellow-500" 
                : "text-muted-foreground hover:text-yellow-500"
            )}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={topic.isRevision ? { 
              rotate: [0, -10, 10, -5, 5, 0],
            } : {}}
            transition={{ duration: 0.5 }}
            aria-label={topic.isRevision ? "Unmark for revision" : "Mark for revision"}
          >
            <Star className={cn("h-5 w-5", topic.isRevision && "fill-current")} />
          </motion.button>
          {showRevisionControl && onMarkRevised && onUndoLastPass && onResetPasses && (
            <RevisionPassControl
              topicId={topic.id}
              count={topic.revisionCount ?? 0}
              history={topic.revisionHistory ?? []}
              lastRevisedAt={topic.lastRevisedAt ?? null}
              onMark={onMarkRevised}
              onUndo={onUndoLastPass}
              onReset={onResetPasses}
              size="sm"
            />
          )}
        </div>
      </TableCell>
      
      
      {/* Difficulty */}
      <TableCell className="w-24 text-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.15 }}
        >
          <DifficultyBadge difficulty={topic.difficulty} />
        </motion.div>
      </TableCell>

      {/* Est Time */}
      <TableCell className="w-20 text-center">
        <span className="text-xs text-muted-foreground">{getEstTime(topic)}</span>
      </TableCell>
    </motion.tr>
  );
}

// SubSection component with table
function SubSectionCard({ 
  subSection, 
  onToggleTopic,
  onOpenNote,
  onToggleRevision,
  onSectionComplete,
  expandAllSignal,
  openSubSignal,
  showRevisionControl,
  onMarkRevised,
  onUndoLastPass,
  onResetPasses,
}: { 
  subSection: SubSection; 
  onToggleTopic: (id: string) => void;
  onOpenNote: (topic: Topic) => void;
  onToggleRevision: (id: string) => void;
  onSectionComplete?: (title: string) => void;
  expandAllSignal?: { expanded: boolean; timestamp: number } | null;
  openSubSignal?: { id: string; ts: number } | null;
  showRevisionControl?: boolean;
  onMarkRevised?: (id: string) => void;
  onUndoLastPass?: (id: string) => void;
  onResetPasses?: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const completed = subSection.topics.filter(t => t.completed).length;
  const total = subSection.topics.length;
  const prevCompletedRef = useRef(completed);
  const isComplete = completed === total && total > 0;
  // Lazy-load topics in batches of 25. Preserves scroll because we only append.
  const TOPICS_BATCH = 25;
  const [visibleTopics, setVisibleTopics] = useState(TOPICS_BATCH);
  const topicsToRender = subSection.topics.slice(0, visibleTopics);

  // React to expand/collapse all signal
  useEffect(() => {
    if (expandAllSignal) {
      setIsOpen(expandAllSignal.expanded);
    }
  }, [expandAllSignal]);

  // React to "Resume where you left off" — open + scroll to this sub-module
  useEffect(() => {
    if (openSubSignal && openSubSignal.id === subSection.id) {
      setIsOpen(true);
      requestAnimationFrame(() => {
        wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [openSubSignal, subSection.id]);



  // Check for section completion
  useEffect(() => {
    if (completed === total && total > 0 && prevCompletedRef.current < total) {
      onSectionComplete?.(subSection.title);
    }
    prevCompletedRef.current = completed;
  }, [completed, total, subSection.title, onSectionComplete]);

  return (
    <div ref={wrapperRef} className="scroll-mt-24">
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border/30 last:border-b-0">

      <CollapsibleTrigger className="flex items-start justify-between w-full py-4 px-4 hover:bg-muted/30 transition-colors group gap-4">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-0.5"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{subSection.title}</span>
              {isComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
              )}
            </div>
            {subSection.prerequisites && subSection.prerequisites.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 font-semibold">
                  Requires:
                </span>
                {subSection.prerequisites.map((req) => (
                  <span
                    key={req}
                    className="inline-flex items-center rounded-md border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {req}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 pt-0.5">
          <AnimatedProgress value={(completed / total) * 100} className="w-24" />
          <span className={cn(
            "text-sm min-w-[50px] text-right transition-colors",
            isComplete ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {completed} / {total}
          </span>
        </div>
      </CollapsibleTrigger>

      <AnimatePresence initial={false}>
        {isOpen && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30 hover:bg-transparent">
                      <TableHead className="w-14 text-xs font-medium">Status</TableHead>
                      <TableHead className="text-xs font-medium">Problem</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Problem Link</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Resource Articles</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Resource Videos</TableHead>
                      <TableHead className="w-14 text-xs font-medium text-center">Note</TableHead>
                      <TableHead className={cn("text-xs font-medium text-center", showRevisionControl ? "w-40" : "w-20")}>Revision</TableHead>
                      <TableHead className="w-24 text-xs font-medium text-center">Difficulty</TableHead>
                      <TableHead className="w-20 text-xs font-medium text-center">Est Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topicsToRender.map((topic) => (
                      <TopicRow 
                        key={topic.id} 
                        topic={topic} 
                        onToggle={onToggleTopic} 
                        onOpenNote={onOpenNote}
                        onToggleRevision={onToggleRevision}
                        showRevisionControl={showRevisionControl}
                        onMarkRevised={onMarkRevised}
                        onUndoLastPass={onUndoLastPass}
                        onResetPasses={onResetPasses}
                      />
                    ))}
                  </TableBody>
                </Table>
                {visibleTopics < subSection.topics.length && (
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border/30 bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      Showing {visibleTopics} of {subSection.topics.length} problems
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setVisibleTopics((c) =>
                          Math.min(c + TOPICS_BATCH, subSection.topics.length),
                        )
                      }
                    >
                      Load more problems
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
    </div>
  );
}


// Section component
function SectionCard({ 
  section, 
  onToggleTopic,
  onOpenNote,
  onToggleRevision,
  onSectionComplete,
  expandAllSignal,
  showRevisionControl,
  onMarkRevised,
  onUndoLastPass,
  onResetPasses,
  onResetSection,
  onJumpToTopic,
}: { 
  section: Section; 
  onToggleTopic: (id: string) => void;
  onOpenNote: (topic: Topic) => void;
  onToggleRevision: (id: string) => void;
  onSectionComplete?: (title: string) => void;
  expandAllSignal?: { expanded: boolean; timestamp: number } | null;
  showRevisionControl?: boolean;
  onMarkRevised?: (id: string) => void;
  onUndoLastPass?: (id: string) => void;
  onResetPasses?: (id: string) => void;
  onResetSection?: (sectionId: string) => void;
  onJumpToTopic?: (topicId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubSignal, setOpenSubSignal] = useState<{ id: string; ts: number } | null>(null);
  const allTopics = section.subSections.flatMap(s => s.topics);
  const completed = allTopics.filter(t => t.completed).length;
  const total = allTopics.length;
  const prevCompletedRef = useRef(completed);
  const isComplete = completed === total && total > 0;
  const hasStarted = completed > 0 && !isComplete;

  // First sub-section that is not yet fully complete = next checkpoint
  const nextIncompleteSub = section.subSections.find(ss => {
    const t = ss.topics.length;
    const d = ss.topics.filter(x => x.completed).length;
    return t > 0 && d < t;
  });

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextIncompleteSub) return;
    setIsOpen(true);
    setOpenSubSignal({ id: nextIncompleteSub.id, ts: Date.now() });
  };

  // React to expand/collapse all signal
  useEffect(() => {
    if (expandAllSignal) {
      setIsOpen(expandAllSignal.expanded);
    }
  }, [expandAllSignal]);

  // Check for section completion
  useEffect(() => {
    if (completed === total && total > 0 && prevCompletedRef.current < total) {
      onSectionComplete?.(section.title);
    }
    prevCompletedRef.current = completed;
  }, [completed, total, section.title, onSectionComplete]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border/50">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 px-4 hover:bg-muted/30 transition-colors group gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
          <span className="font-medium truncate">{section.title}</span>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Complete!</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasStarted && nextIncompleteSub && (
            <motion.button
              type="button"
              onClick={handleResume}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors max-w-[280px]"
              title={`Resume at: ${nextIncompleteSub.title}`}
            >
              <span className="opacity-80">Resume →</span>
              <span className="truncate">{nextIncompleteSub.title}</span>
            </motion.button>
          )}
          <AnimatedProgress value={(completed / total) * 100} className="w-32" />
          <span className={cn(
            "text-sm min-w-[60px] text-right transition-colors",
            isComplete ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {completed} / {total}
          </span>
          {completed > 0 && onResetSection && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border/50 text-muted-foreground hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/10 transition-colors"
                  title="Reset this module"
                  aria-label="Reset this module"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset "{section.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark all <b>{completed}</b> completed problems in this module as unsolved. Notes and revision flags stay intact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onResetSection(section.id)}
                    className="bg-rose-500 hover:bg-rose-500/90 text-white"
                  >
                    Reset module
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

      </CollapsibleTrigger>

      <AnimatePresence initial={false}>
        {isOpen && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              {section.subSections.length > 1 && (
                <div className="px-4 pt-3 pb-4 border-b border-border/30 bg-gradient-to-b from-muted/10 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Learning Path
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {section.subSections.filter(ss => ss.topics.every(t => t.completed) && ss.topics.length > 0).length} / {section.subSections.length} checkpoints
                    </span>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {section.subSections.map((ss, i) => {
                      const ssTotal = ss.topics.length;
                      const ssDone = ss.topics.filter(t => t.completed).length;
                      const done = ssDone === ssTotal && ssTotal > 0;
                      const active = ssDone > 0 && !done;
                      const remaining = ss.topics.filter(t => !t.completed);
                      return (
                        <div key={ss.id} className="flex items-center gap-1 shrink-0">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50",
                                  done && "border-primary/50 bg-primary/15 text-primary",
                                  active && "border-amber-400/50 bg-amber-500/10 text-amber-300",
                                  !done && !active && "border-border/50 bg-muted/30 text-muted-foreground"
                                )}
                                title={`${ss.title} — ${ssDone}/${ssTotal}`}
                              >
                                <span
                                  className={cn(
                                    "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                                    done ? "bg-primary text-primary-foreground" : "bg-background/60 border border-current"
                                  )}
                                >
                                  {done ? "✓" : i + 1}
                                </span>
                                <span className="max-w-[140px] truncate">{ss.title}</span>
                                <span className="tabular-nums text-[10px] opacity-70">{ssDone}/{ssTotal}</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="bottom" align="start" className="w-80 p-0">
                              <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{ss.title}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {ssDone}/{ssTotal} solved · {remaining.length} left
                                  </p>
                                </div>
                                {remaining[0] && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsOpen(true);
                                      setOpenSubSignal({ id: ss.id, ts: Date.now() });
                                      onJumpToTopic?.(remaining[0].id);
                                    }}
                                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
                                  >
                                    Jump <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <div className="max-h-64 overflow-y-auto py-1">
                                {ss.topics.map((tp) => (
                                  <button
                                    key={tp.id}
                                    type="button"
                                    onClick={() => {
                                      setIsOpen(true);
                                      setOpenSubSignal({ id: ss.id, ts: Date.now() });
                                      onJumpToTopic?.(tp.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/50 transition-colors"
                                  >
                                    {tp.completed ? (
                                      <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                    ) : (
                                      <CircleDot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <span className={cn("truncate flex-1", tp.completed && "line-through text-muted-foreground")}>
                                      {tp.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/70 tabular-nums shrink-0">{tp.note}</span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          {i < section.subSections.length - 1 && (
                            <div className={cn("h-px w-4 shrink-0", done ? "bg-primary/50" : "bg-border/40")} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <motion.div 
                className="ml-4 border-l border-border/30"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >

                {section.subSections.map((subSection, index) => (
                  <motion.div
                    key={subSection.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <SubSectionCard 
                      subSection={subSection} 
                      onToggleTopic={onToggleTopic}
                      onOpenNote={onOpenNote}
                      onToggleRevision={onToggleRevision}
                      onSectionComplete={onSectionComplete}
                      expandAllSignal={expandAllSignal}
                      openSubSignal={openSubSignal}
                      showRevisionControl={showRevisionControl}
                      onMarkRevised={onMarkRevised}
                      onUndoLastPass={onUndoLastPass}
                      onResetPasses={onResetPasses}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

// Wrapper component to handle CP sheet routing
function SheetDetailWrapper() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const currentSheetId = sheetId || "strivers-sde-sheet";
  
  return <SheetDetailContent sheetId={currentSheetId} />;
}

function SheetDetailContent({ sheetId }: { sheetId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { requireAuth, LoginPromptDialog } = useRequireAuth();
  const { currentStreak, todayCompleted, refreshStreak } = useStreak();
  
  const currentSheetId = sheetId;
  const [sheetData, setSheetData] = useState<SheetData | null>(
    mockSheetData[currentSheetId] || mockSheetData["strivers-sde-sheet"]
  );
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  
  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "weekwise" | "revision">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Expand/Collapse all
  const [expandAllSignal, setExpandAllSignal] = useState<{ expanded: boolean; timestamp: number } | null>(null);

  // Lazy reveal for sections to speed up initial paint after login.
  const SECTIONS_BATCH = 6;
  const [visibleSectionCount, setVisibleSectionCount] = useState(SECTIONS_BATCH);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Blind 75 study plan prefs
  const [blind75Prefs, setBlind75Prefs] = useState<Blind75Prefs | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [revisionView, setRevisionView] = useState<RevisionView>(() => {
    if (typeof window === "undefined") return "topics";
    const saved = window.localStorage.getItem("blind75_revision_view");
    return saved === "weeks" ? "weeks" : "topics";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("blind75_revision_view", revisionView);
    }
  }, [revisionView]);

  // Load user progress from database
  const loadProgress = useCallback(async () => {
    if (!user || !sheetData) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("sheet_id", currentSheetId);

      if (error) throw error;

      if (data && data.length > 0) {
        const progressMap = new Map(data.map(p => [p.topic_id, p]));
        setActivityDates(
          data
            .filter((p) => p.completed && p.updated_at)
            .map((p) => new Date(p.updated_at as string).toLocaleDateString("en-CA")),
        );
        
        setSheetData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map(section => ({
              ...section,
              subSections: section.subSections.map(subSection => ({
                ...subSection,
                topics: subSection.topics.map(topic => {
                  const saved = progressMap.get(topic.id);
                  if (saved) {
                    const anySaved = saved as typeof saved & {
                      revision_count?: number | null;
                      revision_history?: string[] | null;
                      last_revised_at?: string | null;
                    };
                    return {
                      ...topic,
                      completed: saved.completed,
                      isRevision: saved.is_revision,
                      note: saved.note || "",
                      revisionCount: anySaved.revision_count ?? 0,
                      revisionHistory: Array.isArray(anySaved.revision_history)
                        ? (anySaved.revision_history as string[])
                        : [],
                      lastRevisedAt: anySaved.last_revised_at ?? null,
                    };
                  }
                  return topic;
                }),
              })),
            })),
          };
        });
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSheetId, sheetData]);

  useEffect(() => {
    loadProgress();
  }, [user, currentSheetId]);

  // Save progress to database
  const saveProgress = async (topicId: string, updates: { completed?: boolean; is_revision?: boolean; note?: string; revision_count?: number; revision_history?: string[]; last_revised_at?: string | null }) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        sheet_id: currentSheetId,
        topic_id: topicId,
        ...updates,
        ...(updates.completed !== undefined
          ? { completed_at: updates.completed ? new Date().toISOString() : null }
          : {}),
      };

      const { error } = await supabase
        .from("user_topic_progress")
        .upsert(payload, {
          onConflict: "user_id,sheet_id,topic_id",
        });

      if (error) throw error;
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your progress.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate stats
  const allTopics = useMemo(() => 
    sheetData?.sections.flatMap(s => s.subSections.flatMap(ss => ss.topics)) || [],
    [sheetData]
  );
  
  const completedCount = allTopics.filter(t => t.completed).length;

  // Sheet-scoped weekly streak: consecutive days (ending today/yesterday) with at least one completion.
  const sheetStreak = useMemo(() => {
    if (activityDates.length === 0) return 0;
    const unique = Array.from(new Set(activityDates)).sort((a, b) => b.localeCompare(a));
    const today = new Date().toLocaleDateString("en-CA");
    const yest = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
    if (unique[0] !== today && unique[0] !== yest) return 0;
    let streak = 0;
    let cursor = unique[0];
    for (const d of unique) {
      if (d === cursor) {
        streak++;
        const prev = new Date(cursor);
        prev.setDate(prev.getDate() - 1);
        cursor = prev.toLocaleDateString("en-CA");
      } else if (d < cursor) break;
    }
    return streak;
  }, [activityDates]);

  const weekSolvedCount = useMemo(() => {
    if (activityDates.length === 0) return 0;
    const weekAgo = new Date(Date.now() - 6 * 86400000).toLocaleDateString("en-CA");
    return activityDates.filter((d) => d >= weekAgo).length;
  }, [activityDates]);
  const revisionCount = allTopics.filter(t => t.isRevision).length;
  const progressPercent = allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;
  
  const easyCompleted = allTopics.filter(t => t.difficulty === "Easy" && t.completed).length;
  const mediumCompleted = allTopics.filter(t => t.difficulty === "Medium" && t.completed).length;
  const hardCompleted = allTopics.filter(t => t.difficulty === "Hard" && t.completed).length;
  
  const easyTotal = sheetData?.easy || 0;
  const mediumTotal = sheetData?.medium || 0;
  const hardTotal = sheetData?.hard || 0;

  // Filter sections
  const getFilteredSections = useCallback(() => {
    if (!sheetData) return [];
    
    let sections = sheetData.sections;
    
    // Apply filters
    sections = sections.map(section => ({
      ...section,
      subSections: section.subSections
        .map(subSection => ({
          ...subSection,
          topics: subSection.topics.filter(topic => {
            // Revision filter
            if (activeTab === "revision" && !topic.isRevision) return false;
            
            // Search filter
            if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            
            // Difficulty filter
            if (difficultyFilter !== "all" && topic.difficulty.toLowerCase() !== difficultyFilter) return false;
            
            // Category filter (completed/pending)
            if (categoryFilter === "completed" && !topic.completed) return false;
            if (categoryFilter === "pending" && topic.completed) return false;
            
            return true;
          })
        }))
        .filter(subSection => subSection.topics.length > 0)
    })).filter(section => section.subSections.length > 0);
    
    return sections;
  }, [sheetData, activeTab, searchQuery, difficultyFilter, categoryFilter]);

  const baseFilteredSections = getFilteredSections();

  // Init Blind 75 prefs once sheet loads
  useEffect(() => {
    if (currentSheetId === "blind-75" && sheetData && !blind75Prefs) {
      setBlind75Prefs(loadBlind75Prefs(sheetData.sections.map((s) => s.title)));
    }
  }, [currentSheetId, sheetData, blind75Prefs]);

  // Defer heavy inputs so rapid completion ticks stay smooth — bucketing
  // recomputes at lower priority while the tick UI updates immediately.
  const deferredSheetData = useDeferredValue(sheetData);
  const deferredSearch = useDeferredValue(searchQuery);

  // Transform into Week-based pseudo-sections when Blind 75 + (weekwise | revision-weeks | groupBy=weeks)
  const weekView = useMemo(() => {
    const wantWeeks =
      currentSheetId === "blind-75" &&
      blind75Prefs &&
      (activeTab === "weekwise" ||
        (activeTab === "revision" && revisionView === "weeks") ||
        (activeTab !== "revision" && blind75Prefs.groupBy === "weeks"));
    if (!wantWeeks || !deferredSheetData) {
      return { sections: baseFilteredSections, weekProgress: [] as { weekNum: number; done: number; total: number; topicIds: string[]; passesDone?: number; passesTarget?: number }[], emptyReason: null as null | "no-weeks" };
    }

    // Build a stable week assignment from ALL sheet topics (ignoring revision filter)
    // so a revision problem stays in the same week as in Week Wise.
    const allTopicsList: Topic[] = [];
    deferredSheetData.sections.forEach((sec) =>
      sec.subSections.forEach((sub) =>
        sub.topics.forEach((t) => {
          if (deferredSearch && !t.title.toLowerCase().includes(deferredSearch.toLowerCase())) return;
          if (difficultyFilter !== "all" && t.difficulty.toLowerCase() !== difficultyFilter) return;
          if (categoryFilter === "completed" && !t.completed) return;
          if (categoryFilter === "pending" && t.completed) return;
          allTopicsList.push(t);
        })
      )
    );

    const weeks = blind75Prefs.weeks;
    const hoursPerDay = blind75Prefs.hoursPerWeek; // legacy field, now hours/day
    const hoursPerWeek = hoursPerDay * 7;

    // weeks = 0 → empty state
    if (weeks === 0) {
      return { sections: [], weekProgress: [], emptyReason: "no-weeks" as const };
    }

    const isRevisionTab = activeTab === "revision";
    const REVISION_TARGET = 3;

    // Bucket only INCOMPLETE topics across the chosen weeks so remaining work
    // re-balances in real time as the user finishes problems.
    // Completed topics are surfaced in Week 1 as an "already done" prefix so the
    // weekly progress panel still reflects total wins.
    const pendingPool = isRevisionTab
      ? allTopicsList.filter((t) => t.isRevision && !t.completed)
      : allTopicsList.filter((t) => !t.completed);
    const donePool = isRevisionTab
      ? allTopicsList.filter((t) => t.isRevision && t.completed)
      : allTopicsList.filter((t) => t.completed);

    const { buckets: pendingBuckets, loadsMin: loads, paused } = bucketByWeeks(
      pendingPool,
      weeks,
      hoursPerWeek,
    );

    // Merge: week 1 gets completed prefix, other weeks just pending.
    const buckets: Topic[][] = pendingBuckets.map((arr, i) =>
      i === 0 ? [...donePool, ...arr] : arr,
    );

    const weekProgress = buckets.map((topics, i) => {
      const done = topics.filter((t) => t.completed).length;
      const passesDone = topics.reduce((acc, t) => acc + (t.revisionCount ?? 0), 0);
      const passesTarget = topics.length * REVISION_TARGET;
      return {
        weekNum: i + 1,
        done,
        total: topics.length,
        topicIds: topics.filter((t) => !t.completed).map((t) => t.id),
        ...(isRevisionTab ? { passesDone, passesTarget } : {}),
      };
    });

    const sections = buckets
      .map((topics, i) => {
        const weekNum = i + 1;
        const done = topics.filter((t) => t.completed).length;
        const tot = topics.length;
        const pending = tot - done;
        const status =
          tot === 0
            ? ""
            : pending === 0
              ? " · ✓ Completed"
              : ` · ${pending} left · ${done}/${tot} done`;
        const hrs = Math.round(loads[i] / 60);
        const loadText = paused
          ? `~${hrs}h of work · Paused (no daily hours)`
          : `~${hrs}h of ${hoursPerWeek}h budget (${hoursPerDay}h/day)`;
        const subTitle = `${isRevisionTab ? "Revision" : "Problems"}${status} · ${loadText}`;
        return {
          id: `b75-week-${weekNum}`,
          title: `Week ${weekNum}${paused ? " · Paused" : ""}`,
          subSections: topics.length
            ? [{ id: `b75-week-${weekNum}-sub`, title: subTitle, topics }]
            : [],
        };
      })
      .filter((sec) => {
        if (selectedWeek !== "all") return sec.id === `b75-week-${selectedWeek}`;
        return sec.subSections.length > 0;
      });

    return { sections, weekProgress, emptyReason: null };
  }, [baseFilteredSections, currentSheetId, blind75Prefs, activeTab, revisionView, deferredSheetData, deferredSearch, difficultyFilter, categoryFilter, selectedWeek]);

  const filteredSections = weekView.sections;
  const weekProgress = weekView.weekProgress;
  const weekViewEmpty = weekView.emptyReason;

  // Reset lazy window when filters/search/tab change.
  useEffect(() => {
    setVisibleSectionCount(SECTIONS_BATCH);
  }, [activeTab, deferredSearch, difficultyFilter, categoryFilter, selectedWeek, currentSheetId]);

  // Auto-reveal more sections when sentinel enters viewport.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (visibleSectionCount >= filteredSections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleSectionCount((c) => Math.min(c + SECTIONS_BATCH, filteredSections.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visibleSectionCount, filteredSections.length]);
  const showWeekPanel =
    currentSheetId === "blind-75" &&
    !!blind75Prefs &&
    activeTab === "weekwise";

  const handleQuickCompleteWeek = useCallback(
    (topicIds: string[]) => {
      requireAuth(async () => {
        for (const id of topicIds) {
          const t = allTopics.find((x) => x.id === id);
          if (t && !t.completed) {
            // sequential to keep saveProgress order deterministic
            // eslint-disable-next-line no-await-in-loop
            await handleToggleTopicInternal(id);
          }
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTopics],
  );


  // Confetti celebration
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed'],
      });
    }, 250);
  }, []);

  const handleSectionComplete = useCallback((sectionTitle: string) => {
    triggerConfetti();
    toast({
      title: "🎉 Section Complete!",
      description: `Congratulations! You completed "${sectionTitle}"`,
    });
  }, [toast, triggerConfetti]);

  // Random problem
  const handleRandomProblem = () => {
    const uncompletedTopics = allTopics.filter(t => !t.completed);
    if (uncompletedTopics.length === 0) {
      toast({ title: "All problems completed!", description: "Great job!" });
      triggerConfetti();
      return;
    }
    const randomTopic = uncompletedTopics[Math.floor(Math.random() * uncompletedTopics.length)];
    toast({ 
      title: "Random Problem", 
      description: randomTopic.title,
    });
  };

  // Track previous completion for sheet completion detection
  const prevCompletedCountRef = useRef(completedCount);
  const sheetCompletionTriggeredRef = useRef(false);

  // Check for 100% sheet completion
  useEffect(() => {
    const totalTopics = allTopics.length;
    const isNowComplete = completedCount === totalTopics && totalTopics > 0;
    const wasNotComplete = prevCompletedCountRef.current < totalTopics;
    
    if (isNowComplete && wasNotComplete && !sheetCompletionTriggeredRef.current) {
      sheetCompletionTriggeredRef.current = true;
      triggerSheetCompletionCelebration();
    }
    
    // Reset trigger if sheet becomes incomplete again
    if (!isNowComplete) {
      sheetCompletionTriggeredRef.current = false;
    }
    
    prevCompletedCountRef.current = completedCount;
  }, [completedCount, allTopics.length]);

  // Epic celebration for 100% sheet completion
  const triggerSheetCompletionCelebration = useCallback(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const colors = ['#f97316', '#fb923c', '#10b981', '#8b5cf6', '#ec4899', '#eab308'];

    // Initial burst from center
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
      startVelocity: 45,
      ticks: 100,
      zIndex: 9999,
    });

    // Continuous side cannons
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 30 * (timeLeft / duration);

      // Left cannon
      confetti({
        particleCount: Math.floor(particleCount),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        ticks: 80,
        zIndex: 9999,
      });

      // Right cannon
      confetti({
        particleCount: Math.floor(particleCount),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        ticks: 80,
        zIndex: 9999,
      });
    }, 200);

    // Show celebratory toast
    toast({
      title: "🏆 Sheet Complete!",
      description: `Amazing! You've completed all ${allTopics.length} topics in ${sheetData?.title}!`,
    });
  }, [toast, allTopics.length, sheetData?.title]);

  const scrollToTopic = useCallback((topicId: string) => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-topic-id="${topicId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-400/60", "ring-offset-2", "ring-offset-background");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-400/60", "ring-offset-2", "ring-offset-background");
        }, 2500);
      }
    });
  }, []);

  const findNextIncompleteTopic = useCallback((afterId: string): Topic | null => {
    if (!sheetData) return null;
    const flat: Topic[] = sheetData.sections.flatMap(s => s.subSections.flatMap(ss => ss.topics));
    const idx = flat.findIndex(t => t.id === afterId);
    if (idx < 0) return null;
    // prefer next-in-order after current
    for (let i = idx + 1; i < flat.length; i++) if (!flat[i].completed) return flat[i];
    for (let i = 0; i < idx; i++) if (!flat[i].completed) return flat[i];
    return null;
  }, [sheetData]);

  const handleToggleTopicInternal = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId);
    const newCompleted = !topic?.completed;

    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(t =>
              t.id === topicId ? { ...t, completed: newCompleted } : t
            ),
          })),
        })),
      };
    });

    await saveProgress(topicId, { completed: newCompleted });
    
    if (newCompleted) {
      refreshStreak();
      const next = findNextIncompleteTopic(topicId);
      if (next) {
        toast({
          title: "Nice — one more done!",
          description: `Next up: ${next.title}`,
          action: (
            <button
              onClick={() => scrollToTopic(next.id)}
              className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ),
        });
      }
    }
  };

  const handleResetSection = async (sectionId: string) => {
    if (!user || !sheetData) return;
    const section = sheetData.sections.find(s => s.id === sectionId);
    if (!section) return;
    const completedTopicIds = section.subSections.flatMap(ss => ss.topics.filter(t => t.completed).map(t => t.id));
    if (completedTopicIds.length === 0) return;

    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id !== sectionId ? s : {
            ...s,
            subSections: s.subSections.map(ss => ({
              ...ss,
              topics: ss.topics.map(t => ({ ...t, completed: false })),
            })),
          }
        ),
      };
    });

    try {
      const rows = completedTopicIds.map(tid => ({
        user_id: user.id,
        sheet_id: currentSheetId,
        topic_id: tid,
        completed: false,
        completed_at: null,
      }));
      const { error } = await supabase
        .from("user_topic_progress")
        .upsert(rows, { onConflict: "user_id,sheet_id,topic_id" });
      if (error) throw error;
      toast({ title: "Module reset", description: `${completedTopicIds.length} problems reset in "${section.title}".` });
    } catch (err) {
      console.error("Reset failed", err);
      toast({ variant: "destructive", title: "Reset failed", description: "Could not reset progress. Try again." });
    }
  };

  const handleToggleTopic = (topicId: string) => {
    requireAuth(() => handleToggleTopicInternal(topicId));
  };


  const handleToggleRevisionInternal = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId);
    const newRevision = !topic?.isRevision;

    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(t =>
              t.id === topicId ? { ...t, isRevision: newRevision } : t
            ),
          })),
        })),
      };
    });

    await saveProgress(topicId, { is_revision: newRevision });
  };

  const handleToggleRevision = (topicId: string) => {
    requireAuth(() => handleToggleRevisionInternal(topicId));
  };

  const REVISION_HISTORY_CAP = 50;

  const mutateTopic = (topicId: string, mutate: (t: Topic) => Topic) => {
    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(t => (t.id === topicId ? mutate(t) : t)),
          })),
        })),
      };
    });
  };

  const handleMarkRevisedInternal = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return;
    const now = new Date().toISOString();
    const prevHistory = topic.revisionHistory ?? [];
    const nextHistory = [...prevHistory, now].slice(-REVISION_HISTORY_CAP);
    const nextCount = (topic.revisionCount ?? 0) + 1;
    mutateTopic(topicId, t => ({
      ...t,
      isRevision: true,
      revisionCount: nextCount,
      revisionHistory: nextHistory,
      lastRevisedAt: now,
    }));
    await saveProgress(topicId, {
      is_revision: true,
      revision_count: nextCount,
      revision_history: nextHistory,
      last_revised_at: now,
    });
    toast({
      title: `Marked revised · pass ${nextCount}`,
      description: nextCount >= 3 ? "🎯 Mastered (3+ passes)" : `${3 - nextCount} more pass${3 - nextCount === 1 ? "" : "es"} to mastery.`,
    });
  };

  const handleUndoLastPassInternal = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId);
    if (!topic || (topic.revisionCount ?? 0) <= 0) return;
    const prevHistory = topic.revisionHistory ?? [];
    const nextHistory = prevHistory.slice(0, -1);
    const nextCount = Math.max(0, (topic.revisionCount ?? 0) - 1);
    const nextLast = nextHistory.length > 0 ? nextHistory[nextHistory.length - 1] : null;
    mutateTopic(topicId, t => ({
      ...t,
      revisionCount: nextCount,
      revisionHistory: nextHistory,
      lastRevisedAt: nextLast,
    }));
    await saveProgress(topicId, {
      revision_count: nextCount,
      revision_history: nextHistory,
      last_revised_at: nextLast,
    });
  };

  const handleResetPassesInternal = async (topicId: string) => {
    mutateTopic(topicId, t => ({
      ...t,
      revisionCount: 0,
      revisionHistory: [],
      lastRevisedAt: null,
    }));
    await saveProgress(topicId, {
      revision_count: 0,
      revision_history: [],
      last_revised_at: null,
    });
  };

  const handleMarkRevised = (topicId: string) => requireAuth(() => handleMarkRevisedInternal(topicId));
  const handleUndoLastPass = (topicId: string) => requireAuth(() => handleUndoLastPassInternal(topicId));
  const handleResetPasses = (topicId: string) => requireAuth(() => handleResetPassesInternal(topicId));

  const handleOpenNote = (topic: Topic) => {
    requireAuth(() => {
      setEditingTopic(topic);
      setNoteText(topic.note);
      setNoteModalOpen(true);
    });
  };

  const handleSaveNote = async () => {
    if (!editingTopic) return;
    
    setSheetData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          subSections: section.subSections.map(subSection => ({
            ...subSection,
            topics: subSection.topics.map(topic =>
              topic.id === editingTopic.id ? { ...topic, note: noteText } : topic
            ),
          })),
        })),
      };
    });

    await saveProgress(editingTopic.id, { note: noteText });
    
    setNoteModalOpen(false);
    setEditingTopic(null);
    setNoteText("");
    
    toast({
      title: "Note saved",
      description: "Your note has been saved successfully.",
    });
  };

  if (!sheetData) {
    const kind: "builtin_sheet" | "user_folder" =
      currentSheetId && ["dbms-sheet", "cn-sheet", "os-sheet"].includes(currentSheetId)
        ? "builtin_sheet"
        : "user_folder";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AccessErrorPanel
            resourceKind={kind}
            resource={currentSheetId ?? "(unknown)"}
            message="This sheet could not be loaded. It may be blocked by RLS or the slug may be wrong."
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Deep-linkable inline article view (?article=<slug>) — rendered in the
  // middle content area, with browser back/forward handled by the router.
  if (articleSlug) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <Button variant="ghost" size="icon" onClick={closeArticle} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-base font-semibold truncate text-muted-foreground">
                {sheetData.title}
              </h1>
            </div>
          </div>
        </header>
        <SheetArticleReader slug={articleSlug} onClose={closeArticle} />
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/learn/sheets")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{sheetData.title}</h1>
          </div>
          
          {/* Sheet-scoped weekly streak + total solved */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 text-xs font-semibold"
              title={`${sheetStreak}-day streak on this sheet · ${weekSolvedCount} solved in the last 7 days`}
            >
              <Flame className="h-3.5 w-3.5" />
              {sheetStreak}d · {weekSolvedCount}/wk
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-semibold"
              title="Total problems solved in this sheet"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {completedCount} solved
            </span>
          </div>

          {/* Streak Counter */}
          <StreakCounter variant="mini" />
          
          <Badge variant="outline" className="hidden sm:flex text-xs whitespace-nowrap">
            Last updated : {sheetData.lastUpdated}
          </Badge>
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </header>

      {/* About this sheet — context header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-0">
        <CollapsibleSection
          title="About this sheet"
          description={sheetData.lastUpdated ? `Last updated ${sheetData.lastUpdated}` : undefined}
          icon={Info}
        >
          <p className="text-muted-foreground text-sm sm:text-base">
            {sheetData.description}{" "}
            <a href="#" className="text-primary hover:underline">Know more</a>
          </p>
        </CollapsibleSection>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* Overall Progress — primary KPI, opens by default */}
        <CollapsibleSection
          title="Overall Progress"
          description={`${completedCount}/${sheetData.totalProblems} problems · ${progressPercent}% complete`}
          icon={Activity}
          defaultOpen
          badge={
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
              {progressPercent}%
            </span>
          }
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full border-4 border-muted flex items-center justify-center">
                <span className="text-lg font-bold">{progressPercent}%</span>
              </div>
              <div>
                <p className="font-medium">Overall Progress</p>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{sheetData.totalProblems}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm">Easy</span>
                <span className="text-sm text-muted-foreground">{easyCompleted}/{easyTotal}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-sm">Medium</span>
                <span className="text-sm text-muted-foreground">{mediumCompleted}/{mediumTotal}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-sm">Hard</span>
                <span className="text-sm text-muted-foreground">{hardCompleted}/{hardTotal}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Blind 75 — Grind75-style study plan */}
        {currentSheetId === "blind-75" && blind75Prefs && (
          <CollapsibleSection
            title="Study Plan"
            description="Personalize weeks, hours, difficulty and grouping"
            icon={CalendarClock}
            defaultOpen={false}
          >
            <Blind75StudyPlan
              sections={sheetData.sections}
              prefs={blind75Prefs}
              onChange={setBlind75Prefs}
            />
          </CollapsibleSection>
        )}

        {/* ACM-ICPC Training — pace & time budget first */}
        {currentSheetId === "acm-icpc-training" && (
          <>
            <CollapsibleSection
              title="Weekly Pace Calculator"
              description="Track average pace and estimated completion date"
              icon={CalendarClock}
            >
              <ACMPaceCalculator
                sheetId={currentSheetId}
                totalProblems={sheetData.totalProblems}
                completedCount={completedCount}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Estimated Time Breakdown"
              description="~700–900 hours total · Practical limit ~1300 hours"
              icon={Clock}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { level: "≤ 2.5", count: 215, avg: 20, color: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
                    { level: "≤ 3.5", count: 93, avg: 30, color: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
                    { level: "≤ 4.5", count: 270, avg: 40, color: "from-amber-500/15 to-amber-500/5 border-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
                    { level: "≤ 5.25", count: 178, avg: 60, color: "from-orange-500/15 to-orange-500/5 border-orange-500/20", text: "text-orange-600 dark:text-orange-400" },
                    { level: "≤ 5.75", count: 127, avg: 75, color: "from-rose-500/15 to-rose-500/5 border-rose-500/20", text: "text-rose-600 dark:text-rose-400" },
                    { level: "> 5.75", count: 53, avg: 90, color: "from-rose-500/15 to-rose-500/5 border-rose-500/20", text: "text-rose-600 dark:text-rose-400" },
                  ].map((tier) => (
                    <div
                      key={tier.level}
                      className={cn(
                        "rounded-lg border p-3 bg-gradient-to-b text-center",
                        tier.color
                      )}
                    >
                      <p className={cn("text-lg font-bold", tier.text)}>{tier.count}</p>
                      <p className="text-xs text-muted-foreground">problems</p>
                      <p className="text-[11px] font-medium mt-1.5">Level {tier.level}</p>
                      <p className="text-[11px] text-muted-foreground">~{tier.avg} min each</p>
                      <p className={cn("text-xs font-semibold mt-1", tier.text)}>
                        {Math.round((tier.count * tier.avg) / 60)}h
                      </p>
                    </div>
                  ))}
                </div>

                {(() => {
                  const easyRemaining = easyTotal - easyCompleted;
                  const medRemaining = mediumTotal - mediumCompleted;
                  const hardRemaining = hardTotal - hardCompleted;
                  const totalMinRemaining = easyRemaining * 25 + medRemaining * 45 + hardRemaining * 75;
                  const totalHoursRemaining = Math.round(totalMinRemaining / 60);
                  const totalMinAll = easyTotal * 25 + mediumTotal * 45 + hardTotal * 75;
                  const timeProgress = totalMinAll > 0 ? Math.round(((totalMinAll - totalMinRemaining) / totalMinAll) * 100) : 0;
                  const problemsRemaining = (easyTotal + mediumTotal + hardTotal) - completedCount;

                  return (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Time Remaining Estimate</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{timeProgress}% time completed</span>
                      </div>
                      <Progress value={timeProgress} className="h-2" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xl font-bold text-primary">{totalHoursRemaining}h</p>
                          <p className="text-[11px] text-muted-foreground">Est. remaining</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">{problemsRemaining}</p>
                          <p className="text-[11px] text-muted-foreground">Problems left</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{easyRemaining}</p>
                          <p className="text-[11px] text-muted-foreground">Easy left (~{Math.round(easyRemaining * 25 / 60)}h)</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{hardRemaining}</p>
                          <p className="text-[11px] text-muted-foreground">Hard left (~{Math.round(hardRemaining * 75 / 60)}h)</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CollapsibleSection>
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-1 -mx-1 px-1 [scrollbar-width:thin]"
        >
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "weekwise" | "revision")} className="shrink-0">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                All Problems
              </TabsTrigger>
              {currentSheetId === "blind-75" && (
                <TabsTrigger value="weekwise" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                  Week Wise
                </TabsTrigger>
              )}
              <TabsTrigger value="revision" className="data-[state=active]:bg-foreground data-[state=active]:text-background">
                Revision
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Spacer pushes filters to the right on wide screens */}
          <div className="hidden sm:block flex-1" />

          {/* Search and Filters — same line, scroll if needed */}
          <div className="relative w-44 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px] h-9 shrink-0">
              <SelectValue placeholder="All problems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All problems</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {showWeekPanel && blind75Prefs && blind75Prefs.weeks > 0 && (
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[120px] h-9 shrink-0">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All weeks</SelectItem>
                {Array.from({ length: blind75Prefs.weeks }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Week {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[110px] h-9 shrink-0">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 shrink-0"
            onClick={handleRandomProblem}
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden md:inline">Random Problem</span>
          </Button>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAllSignal(prev => ({
                expanded: !prev?.expanded,
                timestamp: Date.now()
              }))}
              className="gap-2 text-xs"
            >
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform",
                expandAllSignal?.expanded && "rotate-180"
              )} />
              {expandAllSignal?.expanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
          {activeTab === "revision" && currentSheetId === "blind-75" && (
            <div className="mb-3 flex items-center justify-between gap-3 flex-wrap rounded-xl border border-amber-400/20 bg-amber-500/[0.04] px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground antialiased">
                <span className="font-semibold text-foreground">Revision view:</span>
                <span>Pick how you want to revise — by topic or by week. Use ↻ to log each pass; 3 passes = mastered.</span>
              </div>
              <RevisionViewToggle value={revisionView} onChange={setRevisionView} />
            </div>
          )}
          {showWeekPanel && weekProgress.some((w) => w.total > 0) && (
            <div className="mb-3">
              <CollapsibleSection
                title="Weekly progress"
                description={`${weekProgress.filter((w) => w.total > 0).length} weeks scheduled`}
                icon={CalendarDays}
                defaultOpen={false}
              >
                <WeekProgressPanel
                  weeks={weekProgress}
                  selectedWeek={selectedWeek}
                  onQuickComplete={activeTab === "weekwise" ? handleQuickCompleteWeek : undefined}
                />
              </CollapsibleSection>
            </div>
          )}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {filteredSections.length > 0 ? (
                <>
                  {filteredSections.slice(0, visibleSectionCount).map((section) => (
                    <SectionCard 
                      key={section.id} 
                      section={section} 
                      onToggleTopic={handleToggleTopic} 
                      onOpenNote={handleOpenNote}
                      onToggleRevision={handleToggleRevision}
                      onSectionComplete={handleSectionComplete}
                      expandAllSignal={expandAllSignal}
                      showRevisionControl={activeTab === "revision"}
                      onMarkRevised={handleMarkRevised}
                      onUndoLastPass={handleUndoLastPass}
                      onResetPasses={handleResetPasses}
                      onResetSection={handleResetSection}
                      onJumpToTopic={scrollToTopic}
                    />
                  ))}
                  {visibleSectionCount < filteredSections.length && (
                    <div ref={loadMoreRef} className="flex flex-col items-center gap-2 py-6 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">
                        Showing {visibleSectionCount} of {filteredSections.length} sections
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setVisibleSectionCount((c) =>
                            Math.min(c + SECTIONS_BATCH, filteredSections.length),
                          )
                        }
                      >
                        Load more sections
                      </Button>
                    </div>
                  )}
                </>
              ) : weekViewEmpty === "no-weeks" ? (
                <div className="p-12 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-1 font-medium">No weeks scheduled</p>
                  <p className="text-sm text-muted-foreground">
                    Open the Study Plan above and set <span className="text-foreground font-medium">Weeks &gt; 0</span> to see your week-by-week breakdown.
                  </p>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === "revision" 
                      ? "No topics marked for revision yet. Click the star icon on any topic to add it here."
                      : searchQuery 
                        ? "No topics found matching your search."
                        : "No topics found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* ACM-ICPC Extras — pacing, time budget, weekly discipline & FAQ */}
      {currentSheetId === "acm-icpc-training" && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 space-y-4">

          <CollapsibleSection
            title="Weekly Training Checklist"
            description="Track training discipline and mindset week to week"
            icon={ClipboardCheck}
          >
            <ACMChecklistCard checklist={acmIcpcChecklist} />
          </CollapsibleSection>

          <CollapsibleSection
            title="ACM-ICPC Training FAQ"
            description={`${acmIcpcFaqs.length} common questions`}
            icon={HelpCircle}
          >
            <Accordion type="single" collapsible className="w-full">
              {acmIcpcFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CollapsibleSection>
        </main>
      )}





      {/* Mobile FAB */}
      <MobileFAB />

      {/* Notes Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Notes for: {editingTopic?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add your personal notes here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} className="gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {LoginPromptDialog}
    </div>
  );
}

export default SheetDetailWrapper;
