const XLSX = require('xlsx');

function parse() {
    const workbook = XLSX.readFile('/tmp/user-uploads/file-8');
    
    // 1. Parse Topic Theory
    const theorySheet = workbook.Sheets['Topic Theory'];
    if (!theorySheet) {
        console.error('Topic Theory sheet not found');
        return;
    }
    
    // Row 3 headers for Theory
    const theoryData = XLSX.utils.sheet_to_json(theorySheet, { range: 2 });
    
    // 2. Parse Problems
    const problemsSheet = workbook.Sheets['Problems'];
    if (!problemsSheet) {
        console.error('Problems sheet not found');
        return;
    }
    
    // Row 3 headers for Problems
    const problemsData = XLSX.utils.sheet_to_json(problemsSheet, { range: 2 });
    
    console.log(JSON.stringify({ theory: theoryData, problems: problemsData }, null, 2));
}

parse();
