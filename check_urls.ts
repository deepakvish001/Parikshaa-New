import { zeroTo2300Sections } from "./src/data/zeroTo2300SheetData";
import { cpLadderData } from "./src/data/cpLadderData";
import { juniorTrainingData } from "./src/data/juniorTrainingData";
import { juniorTrainingD3Data } from "./src/data/juniorTrainingD3Data";
import { juniorTrainingD2Data } from "./src/data/juniorTrainingD2Data";
import { juniorTrainingC1Data } from "./src/data/juniorTrainingC1Data";
import { juniorTrainingD1Data } from "./src/data/juniorTrainingD1Data";
import { juniorTrainingBData } from "./src/data/juniorTrainingBData";
import { juniorTrainingC2Data } from "./src/data/juniorTrainingC2Data";
import { cpTopicSheetData } from "./src/data/cpTopicSheetData";
import * as fs from 'fs';

const datasets = [
  { name: 'zeroTo2300SheetData.ts', data: zeroTo2300Sections },
  { name: 'cpLadderData.ts', data: cpLadderData },
  { name: 'juniorTrainingData.ts', data: juniorTrainingData },
  { name: 'juniorTrainingD3Data.ts', data: juniorTrainingD3Data },
  { name: 'juniorTrainingD2Data.ts', data: juniorTrainingD2Data },
  { name: 'juniorTrainingC1Data.ts', data: juniorTrainingC1Data },
  { name: 'juniorTrainingD1Data.ts', data: juniorTrainingD1Data },
  { name: 'juniorTrainingBData.ts', data: juniorTrainingBData },
  { name: 'juniorTrainingC2Data.ts', data: juniorTrainingC2Data },
  { name: 'cpTopicSheetData.ts', data: cpTopicSheetData }
];

function fixUrl(url: string) {
  if (!url || !url.includes('codeforces.com/problemset/problem/')) return url;
  
  // Example: https://codeforces.com/problemset/problem/372056
  // Correct: https://codeforces.com/contest/372056/problem/A (if it's a numeric ID that looks like a contest ID)
  // But usually these broken links are because they treat a 6-digit ID as the problem ID in a set.
  // Actually, Codeforces problemset URLs look like: /problemset/problem/123/A
  // If it's just /problemset/problem/372056, it might be a contest ID.
  
  const match = url.match(/\/problemset\/problem\/(\d+)\/?$/);
  if (match) {
    const id = match[1];
    // If it's a large numeric ID without an index (like 372056), it's likely a contest ID.
    // For many of these, the problem is just 'A' or similar if it's a custom gym/contest link.
    // However, the user said "Practice links lead to broken pages".
    // A common issue is that these are actually meant to be /contest/ID/problem/INDEX
  }
  return url;
}

// Just log the first few broken-looking ones to verify
console.log("Checking URLs...");
datasets.forEach(ds => {
  console.log(`Checking ${ds.name}...`);
  // Deep search for practiceUrl
  const findUrls = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.practiceUrl && obj.practiceUrl.includes('codeforces.com')) {
      if (obj.practiceUrl.match(/\/problemset\/problem\/\d+$/)) {
         console.log(`Potentially broken: ${obj.practiceUrl} in ${obj.title || obj.id}`);
      }
    }
    Object.values(obj).forEach(findUrls);
  };
  findUrls(ds.data);
});
