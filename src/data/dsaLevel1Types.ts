export interface Topic {
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
  startHere?: boolean;
}

export interface SubSection {
  id: string;
  title: string;
  topics: Topic[];
  prerequisites?: string[];
}

export interface Section {
  id: string;
  title: string;
  subSections: SubSection[];
}

export interface SheetData {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  totalTopics: number;
  isPremium: boolean;
  sections: Section[];
  lastUpdated: string;
  totalProblems: number;
  completed: number;
  topics: any[];
  easy: number;
  medium: number;
  hard: number;

}



