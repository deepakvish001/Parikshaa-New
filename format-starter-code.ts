import pg from 'pg';
import beautify from 'js-beautify';

const { Client } = pg;

async function formatStarterCode() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    const res = await client.query('SELECT id, lang_id, code FROM public.coding_problem_starter_code');
    console.log(`Found ${res.rows.length} starter code entries.`);

    let updatedCount = 0;
    // Process in parallel with a limit
    const batchSize = 100;
    for (let i = 0; i < res.rows.length; i += batchSize) {
      const batch = res.rows.slice(i, i + batchSize);
      await Promise.all(batch.map(async (row) => {
        const { id, lang_id, code } = row;
        let formattedCode = code;

        try {
          if (['c', 'cpp', 'javascript', 'typescript', 'java', 'go'].includes(lang_id)) {
            formattedCode = beautify.js(code, {
              indent_size: 4,
              space_in_empty_paren: false,
              preserve_newlines: true,
              max_preserve_newlines: 2
            });
          } else if (['python', 'python3'].includes(lang_id)) {
            formattedCode = code.split('\n').map(line => line.trimEnd()).join('\n');
          }

          if (formattedCode !== code) {
            await client.query('UPDATE public.coding_problem_starter_code SET code = $1 WHERE id = $2', [formattedCode, id]);
            updatedCount++;
          }
        } catch (err) {
          console.error(`Failed to format ${lang_id} for ID ${id}:`, err);
        }
      }));
      console.log(`Processed ${i + batch.length}/${res.rows.length} rows...`);
    }

    console.log(`Finished. Updated ${updatedCount} entries.`);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.end();
  }
}

formatStarterCode();
