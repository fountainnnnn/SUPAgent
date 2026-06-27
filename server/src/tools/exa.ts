import Exa from 'exa-js';

export interface ExaSearchResult {
  title: string;
  url: string;
  highlights: string[];
}

let _exa: Exa | null = null;

function getExa(): Exa | null {
  const key = process.env.EXA_API_KEY;
  if (!key) return null;
  if (!_exa) _exa = new Exa(key);
  return _exa;
}

/**
 * Web search via Exa — the primary search tool available to built agents.
 * Uses `type: "auto"` with highlights (token-efficient excerpts for LLM workflows).
 */
export async function exaSearch(
  query: string,
  numResults = 5,
): Promise<ExaSearchResult[]> {
  const exa = getExa();
  if (!exa) {
    return [{ title: 'Exa not configured', url: '', highlights: ['EXA_API_KEY missing in server/.env'] }];
  }

  const res = await exa.search(query, {
    type: 'auto',
    numResults,
    contents: { highlights: true },
  });

  return (res.results ?? []).map((r) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    highlights: (r as { highlights?: string[] }).highlights ?? [],
  }));
}
