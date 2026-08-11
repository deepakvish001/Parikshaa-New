import { Section } from "./dsaLevel1Types";

export const advSqlMeta = {
  title: "LeetCode Advanced SQL 50",
  description: "Master complex SQL queries: window functions, recursive CTEs, and advanced joins.",
  category: "SQL",
  difficulty: "Hard",
  totalTopics: 50,
  isPremium: true
};

export const advSqlSections: Section[] = [
  {
    id: "sql-adv-1",
    title: "Select & Basic Joins (Advanced)",
    subSections: [
      {
        id: "sql-adv-1-1",
        title: "Complex Filtering",
        topics: [
          { id: "asql-1", title: "Recyclable and Low Fat Products", completed: false, difficulty: "Easy", resourceType: "article", practiceUrl: "https://leetcode.com/problems/recyclable-and-low-fat-products/", note: "", isRevision: false, estTime: "10 min" },
          { id: "asql-2", title: "Find Customer Referee", completed: false, difficulty: "Easy", resourceType: "article", practiceUrl: "https://leetcode.com/problems/find-customer-referee/", note: "", isRevision: false, estTime: "10 min" }
        ]
      }
    ]
  }
];
