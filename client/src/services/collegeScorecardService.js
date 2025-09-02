const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const API_KEY = 'g64kOWBlBIYL3qA0NJoRWt7qarUqT6yQEeIt0OKK';

export async function fetchTexasCollegesByNames(names) {
  const results = [];
  for (const name of names) {
    const url = `${BASE_URL}?api_key=${API_KEY}&school.name=${encodeURIComponent(name)}&school.state=TX&per_page=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      results.push(data.results[0]);
    } else {
      results.push(null);
    }
  }
  return results;
}
