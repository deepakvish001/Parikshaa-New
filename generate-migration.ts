import fs from 'fs';
import { parse } from 'csv-parse/sync';

const fileContent = fs.readFileSync('formatted_starter_code.csv', 'utf8');
const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
});

const migrationPath = 'supabase/migrations/20260807000000_format_starter_code.sql';
let sql = "CREATE TEMP TABLE temp_starter_code (id uuid, code text);\n";

for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);
    sql += "INSERT INTO temp_starter_code (id, code) VALUES\n";
    sql += batch.map(r => `('${r.id}', '${r.code.replace(/'/g, "''")}')`).join(',\n');
    sql += ";\n";
}

sql += "UPDATE public.coding_problem_starter_code s SET code = t.code FROM temp_starter_code t WHERE s.id = t.id AND s.code != t.code;\n";
sql += "DROP TABLE temp_starter_code;\n";

fs.writeFileSync(migrationPath, sql);
console.log("Migration file generated.");
