import type { Env } from '../types';
export async function batchQuery<T=unknown>(env:Env, statements:D1PreparedStatement[]):Promise<D1Result<T>[]> { if (statements.length>100) throw new Error('D1 batch limit is 100 statements'); return statements.length ? env.DB.batch<T>(statements) : []; }
export function chunkInserts<T>(rows:T[], maxRows=10):T[][] { if (maxRows<1) throw new Error('maxRows must be positive'); const chunks:T[][]=[]; for(let i=0;i<rows.length;i+=maxRows) chunks.push(rows.slice(i,i+maxRows)); return chunks; }
