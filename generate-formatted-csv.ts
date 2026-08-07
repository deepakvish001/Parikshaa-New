import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import beautify from 'js-beautify';

const fileContent = fs.readFileSync('starter_code.csv', 'utf8');
const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
});

console.log(`Loaded ${records.length} records.`);

const formattedRecords = [];

for (const record of records) {
    const { id, lang_id, code } = record;
    let formatted = code;

    try {
        if (['c', 'cpp', 'javascript', 'typescript', 'java', 'go'].includes(lang_id)) {
            formatted = beautify.js(code, {
                indent_size: 4,
                space_in_empty_paren: false,
                preserve_newlines: true,
                max_preserve_newlines: 2
            });
        } else if (['python', 'python3'].includes(lang_id)) {
            formatted = code.split('\n').map(line => line.trimEnd()).join('\n');
        }
        
        formattedRecords.push({ id, code: formatted });
    } catch (e) {
        console.error(`Error formatting ${id}:`, e);
        formattedRecords.push({ id, code });
    }
}

const csvOutput = stringify(formattedRecords, { header: true });
fs.writeFileSync('formatted_starter_code.csv', csvOutput);
console.log(`Generated formatted CSV for ${formattedRecords.length} records.`);
