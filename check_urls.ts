
import { zeroTo2300Sections } from "./src/data/zeroTo2300SheetData";
import { cpLadderData } from "./src/data/cpLadderData";
import { juniorTrainingData } from "./src/data/juniorTrainingData";
import { juniorTrainingD3Sections } from "./src/data/juniorTrainingD3Data";
import { juniorTrainingD2Sections } from "./src/data/juniorTrainingD2Data";
import { juniorTrainingC1Sections } from "./src/data/juniorTrainingC1Data";
import { juniorTrainingD1Sections } from "./src/data/juniorTrainingD1Data";
import { juniorTrainingBSections } from "./src/data/juniorTrainingBData";
import { juniorTrainingC2Sections } from "./src/data/juniorTrainingC2Data";
import { cpTopicSheetData } from "./src/data/cpTopicSheetData";

const datasets = [
  { name: 'zeroTo2300SheetData.ts', data: zeroTo2300Sections },
  { name: 'cpLadderData.ts', data: cpLadderData },
  { name: 'juniorTrainingData.ts', data: juniorTrainingData },
  { name: 'juniorTrainingD3Data.ts', data: juniorTrainingD3Sections },
  { name: 'juniorTrainingD2Data.ts', data: juniorTrainingD2Sections },
  { name: 'juniorTrainingC1Data.ts', data: juniorTrainingC1Sections },
  { name: 'juniorTrainingD1Data.ts', data: juniorTrainingD1Sections },
  { name: 'juniorTrainingBData.ts', data: juniorTrainingBSections },
  { name: 'juniorTrainingC2Data.ts', data: juniorTrainingC2Sections },
  { name: 'cpTopicSheetData.ts', data: cpTopicSheetData }
];

console.log("Checking URLs...");
datasets.forEach(ds => {
  const findUrls = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.practiceUrl && typeof obj.practiceUrl === 'string' && obj.practiceUrl.includes('codeforces.com')) {
      if (obj.practiceUrl.match(/\/problemset\/problem\/\d+$/)) {
         console.log(`[${ds.name}] Potentially broken: ${obj.practiceUrl} (Title: ${obj.title})`);
      }
    }
    Object.values(obj).forEach(findUrls);
  };
  findUrls(ds.data);
});
