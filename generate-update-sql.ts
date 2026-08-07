import fs from 'fs';
import { parse } from 'csv-parse/sync';
import beautify from 'js-beautify';

const fileContent = fs.readFileSync('starter_code.csv', 'utf8');
const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
});

console.log(`Loaded ${records.length} records.`);

let sql = 'BEGIN;\n';
let count = 0;

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

        if (formatted !== code) {
            // Escape single quotes for SQL
            const escapedCode = formatted.replace(/'/g, "''");
            sql += `UPDATE public.coding_problem_starter_code SET code = '${escapedCode}' WHERE id = '${id}';\n`;
            count++;
        }
    } catch (e) {
        console.error(`Error formatting ${id}:`, e);
    }

    if (count > 0 && count % 500 === 0) {
        sql += 'COMMIT; BEGIN;\n';
    }
}

sql += 'COMMIT;';

fs.writeFileSync('update_starter_code.sql', sql);
console.log(`Generated SQL update script for ${count} records.`);
