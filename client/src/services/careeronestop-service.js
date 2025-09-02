// Service for CareerOneStop API via backend proxy
const PROXY_BASE = "/api/careeronestop";

// Lower-level bulk function (keeps compatibility with earlier code)
export async function fetchCareersByTitles(titles) {
  const results = [];
  for (const title of titles) {
    const endpoint = "occupation/keywordsearch"; // proxy will map to /v1/occupation/keywordsearch/:userId/:query
    try {
      const res = await fetch(`${PROXY_BASE}/${endpoint}?query=${encodeURIComponent(title)}`);
      if (!res.ok) {
        results.push(null);
        continue;
      }
      const json = await res.json();
      // API may return { occupations: [...] } or an array
      const occ = Array.isArray(json?.occupations) ? json.occupations : Array.isArray(json) ? json : [];
      results.push(occ.length > 0 ? normalizeCareer(occ[0]) : null);
    } catch (err) {
      results.push(null);
    }
  }
  return results;
}

function normalizeCareer(item) {
  if (!item) return null;
  return {
    title: item.Title || item.title || item.Occupation || "Career",
    description: item.Description || item.description || item.OnetDescription || "",
    medianSalary: typeof item.MedianWage === "number" ? item.MedianWage : (Number(item.MedianWage) || null),
    education: item.Education || item.TypicalEducation || item.education || null,
    category: item.Category || item.OccupationGroup || item.Group || null,
    socCode: item.SOC || item.Soc || item.OnetCode || item.soc || null,
    sourceUrl: item.Url || item.url || item.CareerUrl || null,
  };
}

// Page-friendly helper: searches a single title and returns an array (matching original page usage)
export async function searchCareerByTitle(title) {
  if (!title || !String(title).trim()) return [];
  const endpoint = "occupation/keywordsearch";
  const url = `${PROXY_BASE}/${endpoint}?query=${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) {
    let details;
    try {
      details = await res.json();
    } catch {
      details = await res.text();
    }
    if (res.status === 401) throw new Error('Unauthorized: check CareerOneStop token/user ID on the server proxy');
    throw new Error(`Career proxy error: ${res.status}` + (details ? ` - ${JSON.stringify(details)}` : ''));
  }
  const json = await res.json();
  const occ = Array.isArray(json?.occupations) ? json.occupations : Array.isArray(json) ? json : [];
  const normalized = occ.length > 0 ? normalizeCareer(occ[0]) : null;
  return normalized ? [normalized] : [];
}
