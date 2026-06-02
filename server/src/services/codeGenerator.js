const { supabase } = require('./supabaseClient');

// Generates the next human-readable sequential code for a table, e.g.
// DEF-2024-0143, NCR-2024-0018, CAPA-2024-0010.
// Looks at the highest existing code for the current year and increments.
async function nextCode(table, column, prefix) {
  const year = new Date().getFullYear();
  const likePattern = `${prefix}-${year}-%`;

  const { data, error } = await supabase
    .from(table)
    .select(column)
    .ilike(column, likePattern)
    .order(column, { ascending: false })
    .limit(1);

  if (error) throw error;

  let seq = 1;
  if (data && data.length > 0) {
    const last = data[0][column]; // e.g. "DEF-2024-0142"
    const tail = parseInt(last.split('-').pop(), 10);
    if (!Number.isNaN(tail)) seq = tail + 1;
  }

  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

module.exports = { nextCode };
