import fs from 'fs';
import { parse } from 'csv-parse/sync';
import beautify from 'js-beautify';

async function run() {
    // 1. Dump data
    const { execSync } = require('child_process');
    execSync('psql "$DATABASE_URL" -c "COPY (SELECT id, lang_id, code FROM public.coding_problem_starter_code) TO STDOUT WITH CSV HEADER" > starter_code.csv');

    const fileContent = fs.readFileSync('starter_code.csv', 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`Loaded ${records.length} records.`);

    let sql = "CREATE TEMP TABLE temp_starter_code (id uuid, code text);\n";

    for (let i = 0; i < records.length; i += 200) {
        const batch = records.slice(i, i + 200);
        sql += "INSERT INTO temp_starter_code (id, code) VALUES\n";
        sql += batch.map(record => {
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
            } catch (e) {}
            return `('${id}', '${formatted.replace(/'/g, "''")}')`;
        }).join(',\n');
        sql += ";\n";
    }

    sql += "UPDATE public.coding_problem_starter_code s SET code = t.code FROM temp_starter_code t WHERE s.id = t.id AND s.code != t.code;\n";
    sql += "DROP TABLE temp_starter_code;\n";

    fs.writeFileSync('migration.sql', sql);
    console.log("Migration SQL generated in migration.sql");
}

run();
