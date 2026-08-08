import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('excel_dump.json', 'utf8'));

const theory = dump.theory.filter(row => typeof row.__EMPTY === 'number').map(row => ({
    sNo: row.__EMPTY,
    part: row.__EMPTY_1,
    topic: row.__EMPTY_2,
    ratingBand: row.__EMPTY_3,
    idea: row.__EMPTY_4,
    pehchano: row.__EMPTY_5,
    padho: row.__EMPTY_6,
    note: row.__EMPTY_7 || ""
}));

const problems = dump.problems.filter(row => typeof row.__EMPTY === 'number').map(row => ({
    sNo: row.__EMPTY,
    topic: row.__EMPTY_1,
    problem: row.__EMPTY_2,
    rating: row.__EMPTY_3,
    link: row.__EMPTY_4,
    tags: row.__EMPTY_5 || ""
}));

// Group problems by topic
const topicProblems = {};
problems.forEach(p => {
    if (!topicProblems[p.topic]) topicProblems[p.topic] = [];
    topicProblems[p.topic].push(p);
});

// Construct full data
const sections = theory.map((t, idx) => {
    const sectionProbs = topicProblems[t.topic] || [];
    
    return {
        id: `z23-${idx}`,
        title: t.topic,
        part: t.part,
        ratingBand: t.ratingBand,
        description: t.idea,
        keyConcepts: t.pehchano,
        resources: t.padho,
        notes: t.note,
        subSections: [
            {
                id: `z23-sub-${idx}`,
                title: "Practice Set",
                topics: sectionProbs.map((p, pIdx) => ({
                    id: `z23-p-${idx}-${pIdx}`,
                    title: `${p.problem} (${p.rating})`,
                    completed: false,
                    difficulty: p.rating < 1300 ? "Easy" : (p.rating < 1900 ? "Medium" : "Hard"),
                    resourceType: "link",
                    practiceUrl: p.link,
                    note: `Tags: ${p.tags}`,
                    isRevision: false
                }))
            }
        ]
    };
});

const easyCount = problems.filter(p => p.rating < 1300).length;
const mediumCount = problems.filter(p => p.rating >= 1300 && p.rating < 1900).length;
const hardCount = problems.filter(p => p.rating >= 1900).length;

const finalData = {
    meta: {
        id: "zero-to-2300-cp-sheet",
        title: "Zero to 2300",
        description: "CodingPariksha CP Sheet — 57 techniques, 1100+ Codeforces problems, very basic → Master",
        lastUpdated: "2026-08-08",
        totalProblems: problems.length,
        completed: 0,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount
    },
    sections: sections
};

const output = `export const zeroTo2300Meta = ${JSON.stringify(finalData.meta, null, 2)};\n\nexport const zeroTo2300Sections: any[] = ${JSON.stringify(finalData.sections, null, 2)};\n`;

fs.writeFileSync('src/data/zeroTo2300SheetData.ts', output);
console.log(`Generated data with ${problems.length} problems across ${sections.length} sections.`);
