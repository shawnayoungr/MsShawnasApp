#!/usr/bin/env python3
"""
Best-effort scraper to build prepopulated-careers.json from CareerOneStop occupation-profile pages.
Run from repository root: python3 client/server/scripts/build_prepop.py
"""
import time, json, re, sys, os
from urllib.request import Request, urlopen
from urllib.parse import quote_plus

OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'prepopulated-careers.json')
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; PrepopBot/1.0; +https://example.org)'}

KEYWORDS = [
    "Business",
    "Psychology",
    "Biology",
    "Marketing",
    "Information Science",
    "Nursing",
    "Criminal Justice",
    "Education",
    "Liberal Arts",
    "Engineering",
    "Interdisciplinary Studies",
    "Communications",
    "Exercise Science",
    "Biotechnology",
    "Mechanic Repair",
    "Computer Science",
    "Hospitality",
    "Music",
    "Architecture",
    "Radiologic Technology",
    "Diagnostic Medical Sonography"
]

BASE = 'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx'
API_BASE = 'https://api.careeronestop.org/v1'


def read_env(envpath):
    uid = None
    token = None
    try:
        with open(envpath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('CAREERONESTOP_USER_ID='):
                    uid = line.split('=',1)[1].strip()
                if line.startswith('CAREERONESTOP_TOKEN='):
                    token = line.split('=',1)[1].strip()
    except Exception:
        pass
    return uid, token


UID, TOKEN = read_env(os.path.join(os.path.dirname(__file__), '..', '.env'))
if not UID or not TOKEN:
    print('Warning: CAREERONESTOP_USER_ID or TOKEN not found in client/server/.env; API calls may fail.')


def fetch_html(keyword, onetcode=None):
    q = quote_plus(keyword)
    url = f"{BASE}?keyword={q}&location=texas"
    if onetcode:
        url += f"&onetcode={quote_plus(onetcode)}"
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=15) as r:
        return r.read().decode('utf-8', 'ignore'), url


def extract_meta(html, pattern):
    m = re.search(pattern, html, re.I)
    return m.group(1).strip() if m else None


def extract_title(html):
    t = extract_meta(html, r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']')
    if t: return t
    m = re.search(r'<div[^>]+id=["\']resulttabletitle["\'][^>]*>([^<]+)<', html, re.I)
    if m: return m.group(1).strip()
    m2 = re.search(r'<h1[^>]*>([^<]+)</h1>', html, re.I)
    if m2: return m2.group(1).strip()
    return None


def extract_description(html):
    d = extract_meta(html, r'<meta[^>]+name=["\']DESCRIPTION["\'][^>]+content=["\']([^"\']+)["\']')
    if d: return d
    d2 = extract_meta(html, r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']')
    if d2: return d2
    # paragraph that looks like intro
    m = re.search(r'<div[^>]+id=["\']resulttabletitle["\'][\s\S]*?<\/div>([\s\S]{0,500})<', html, re.I)
    if m:
        p = re.sub('<[^>]+>', '', m.group(1)).strip()
        if len(p) > 30: return ' '.join(p.split())
    # fallback: first long paragraph
    mp = re.search(r'<p[^>]*>([\s\S]{80,400}?)<\/p>', html, re.I)
    if mp:
        return re.sub('<[^>]+>', '', mp.group(1)).strip()
    return None


def extract_median_wage(html):
    # look for 'Annual wages' section and numbers; fallback to first $NN,NNN
    m = re.search(r'Annual wages[\s\S]{0,200}?\$([0-9,]{2,7})', html, re.I)
    if not m:
        m = re.search(r'Median[^\$\d]{0,40}\$([0-9,]+)', html, re.I)
    if not m:
        m = re.search(r'\$([0-9,]{2,7})', html)
    if m:
        try:
            return int(m.group(1).replace(',', ''))
        except:
            return None
    return None


def extract_education(html):
    m = re.search(r'Typical education:?</strong>\s*([^<]+)<', html, re.I)
    if m: return m.group(1).strip()
    # search for 'Typical education' label
    m2 = re.search(r'Typical education[^<]{0,60}([A-Za-z\'\-\s]+)', html, re.I)
    if m2: return m2.group(1).strip()
    return None


def extract_projected(html):
    # look for 'Employment projections' or 'Projected employment'
    m = re.search(r'Employment projections[\s\S]{0,200}?([0-9]{1,3}%|[+-]?[0-9]{1,3}\.?[0-9]?%?)', html, re.I)
    if m: return m.group(1)
    # look for 'Projected change' style
    m2 = re.search(r'Projected change[\s\S]{0,120}?([0-9]{1,3}%|[+-]?[0-9]{1,3}%?)', html, re.I)
    if m2: return m2.group(1)
    return None


def extract_video(html):
    # look for COSVideo or video links
    m = re.search(r'href=["\']([^"\']*COSVideo[^"\']*)["\']', html, re.I)
    if m: return m.group(1)
    m2 = re.search(r'<iframe[^>]+src=["\']([^"\']+)["\']', html, re.I)
    if m2 and 'youtube' in m2.group(1):
        return m2.group(1)
    return None


def extract_activities(html):
    # look for Tasks/List sections
    m = re.search(r'(?:Tasks|Typical tasks|Important tasks)[\s\S]{0,400}<ul[^>]*>([\s\S]*?)<\/ul>', html, re.I)
    if m:
        items = re.findall(r'<li[^>]*>([\s\S]*?)<\/li>', m.group(1), re.I)
        out = [re.sub('<[^>]+>', '', it).strip() for it in items]
        return [x for x in out if x]
    # fallback: look for 'they' paragraph and split
    return None


def extract_related(html):
    m = re.search(r'(?:Related occupations|Similar occupations)[\s\S]{0,300}<ul[^>]*>([\s\S]*?)<\/ul>', html, re.I)
    if m:
        items = re.findall(r'<li[^>]*>([\s\S]*?)<\/li>', m.group(1), re.I)
        out = [re.sub('<[^>]+>', '', it).strip() for it in items]
        return [x for x in out if x]
    # try alternate titles
    m2 = re.search(r'id=["\']ctl40_ctl00_lbltitles["\'][^>]*>([\s\S]*?)<', html, re.I)
    if m2:
        txt = re.sub('<[^>]+>', '', m2.group(1)).strip()
        parts = [p.strip() for p in re.split(r',|;|\(|\)', txt) if p.strip()]
        return parts[:8]
    return None


def build_entry(keyword):
    # Prefer API: search for keyword to get ONET code, then fetch details by ONET code
    try:
        if UID and TOKEN:
            search_url = f"{API_BASE}/occupation/{UID}/{quote_plus(keyword)}/N/0/50?datasettype=onet&searchby=title"
            req = Request(search_url, headers={**HEADERS, 'Authorization': f'Bearer {TOKEN}'})
            with urlopen(req, timeout=15) as r:
                raw = r.read().decode('utf-8', 'ignore')
                data = json.loads(raw)
                occ = data.get('OccupationList') or []
                if occ:
                    best = occ[0]
                    code = best.get('OnetCode') or best.get('Onet') or None
                    title = best.get('OnetTitle') or best.get('OnetTitle') or best.get('Onet') or keyword
                    # fetch details by onetcode
                    if code:
                        detail_url = f"{API_BASE}/occupation/{UID}/{quote_plus(code)}/TX?wages=true&skills=true&tasks=true&altTitles=true&knowledge=true&ability=true&training=true"
                        dreq = Request(detail_url, headers={**HEADERS, 'Authorization': f'Bearer {TOKEN}'})
                        with urlopen(dreq, timeout=15) as dr:
                            dtext = dr.read().decode('utf-8', 'ignore')
                        try:
                            ddata = json.loads(dtext)
                            detail = ddata.get('OccupationDetail') or ddata
                        except Exception:
                            detail = None
                        desc = (detail.get('OnetDescription') if detail else None) or (detail.get('OccupationDescription') if detail else None)
                        wages = detail.get('Wages') if detail else None
                        median = None
                        if wages:
                            nat = wages.get('NationalWagesList') or wages.get('NationalWages') or []
                            if isinstance(nat, list) and len(nat) and isinstance(nat[0], dict):
                                median = nat[0].get('Median') or nat[0].get('MedianHourly') or None
                        education = detail.get('TypicalEducation') if detail else None
                        projected = None
                        # try projections field
                        proj = detail.get('EmploymentProjection') if detail else None
                        if proj:
                            projected = proj
                        # tasks and skills
                        activities = []
                        for t in (detail.get('Tasks') or []):
                            txt = t.get('TaskDescription') if isinstance(t, dict) else t
                            if txt: activities.append(txt)
                        related = []
                        for alt in (detail.get('AlternateTitles') or [])[:8]:
                            if isinstance(alt, dict):
                                related.append(alt.get('Title') or alt.get('AlternateTitle') or '')
                            else:
                                related.append(alt)
                        video = detail.get('COSVideoURL') if detail else None
                        entry = {
                            'title': title,
                            'onetCode': code,
                            'keyword': keyword,
                            'sourceUrl': detail.get('DataSourceUrl') if detail else None,
                            'description': desc,
                            'medianWage': median,
                            'education': education,
                            'projectedEmployment': projected,
                            'careerVideoUrl': video,
                            'activities': activities if activities else None,
                            'relatedOccupations': related if related else None,
                            'dataSource': 'CareerOneStop',
                        }
                        return entry
        # fallback to scraping the profile page
    except Exception as e:
        print('API path failed for', keyword, 'error', e)
    try:
        html, url = fetch_html(keyword)
    except Exception as e:
        print(f"Failed to fetch {keyword}: {e}")
        return None
    title = extract_title(html) or keyword
    desc = extract_description(html)
    median = extract_median_wage(html)
    education = extract_education(html)
    projected = extract_projected(html)
    video = extract_video(html)
    activities = extract_activities(html)
    related = extract_related(html)
    entry = {
        'title': title,
        'keyword': keyword,
        'sourceUrl': url,
        'description': desc,
        'medianWage': median,
        'education': education,
        'projectedEmployment': projected,
        'careerVideoUrl': video,
        'activities': activities,
        'relatedOccupations': related,
        'dataSource': 'CareerOneStop'
    }
    return entry


def main():
    out = []
    for i, k in enumerate(KEYWORDS, start=1):
        print(f'[{i}/{len(KEYWORDS)}] Fetching: {k}')
        e = build_entry(k)
        if e:
            out.append(e)
            print('  -> got', {k:v for k,v in e.items() if v and k in ['title','medianWage','education']})
        else:
            print('  -> failed')
        time.sleep(1.2)

    # atomic write
    tmp = OUT_PATH + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    os.replace(tmp, OUT_PATH)
    print('\nWrote', OUT_PATH, 'entries=', len(out))

if __name__ == '__main__':
    main()
