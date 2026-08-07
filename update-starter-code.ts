import { createClient } from '@supabase/supabase-js';
import beautify from 'js-beautify';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { execSync } = require('child_process');
  execSync('psql "$DATABASE_URL" -c "COPY (SELECT id, lang_id, code FROM public.coding_problem_starter_code) TO STDOUT WITH CSV HEADER" > starter_code.csv');

  const fileContent = fs.readFileSync('starter_code.csv', 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Loaded ${records.length} records.`);

  let updatedCount = 0;
  // Use a smaller batch size to avoid overwhelming the API
  const batchSize = 25;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await Promise.all(batch.map(async (record) => {
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
          const { error } = await supabase
            .from('coding_problem_starter_code')
            .update({ code: formatted })
            .eq('id', id);

          if (error) {
            console.error(`Error updating ${id}:`, error);
          } else {
            updatedCount++;
          }
        }
      } catch (e) {
        console.error(`Error formatting ${id}:`, e);
      }
    }));
    if (i % 100 === 0) {
        console.log(`Processed ${i}/${records.length} records...`);
    }
  }

  console.log(`Finished. Updated ${updatedCount} records.`);
}

run().catch(console.error);
