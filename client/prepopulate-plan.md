# Prepopulation & Offline Career Data Plan

Goal
----
Stop relying on live CareerOneStop API calls at runtime. Pre-fetch and store career and college data for a fixed list of majors (provided by you). Serve that data from the local app and update the client to fetch local data. If a spoken or typed query is not found locally, show a link button to explore the career on CareerOneStop.

Requirements (from user)
------------------------
- Pre-fetch data for ~20 (user-provided) careers.
- Required fields per career: title, description, median wages, education needed, projected employment, career video, activities (day-to-day), related occupations.
- Keep college pages connected and clickable; pre-store required college info to avoid live lookups.
- Client behavior: cards show up to 3 fields on the collapsed card; "More details" expands to show the rest.
- If a career is not prepopulated, show a button linking to the CareerOneStop Occupation Profile page.
- Mobile-first, modern 2025 aesthetic.

Data model
----------
Career object (example):

{
  "title": "Registered Nurses",
  "onetCode": "29-1141.00",
  "description": "...short summary...",
  "medianWage": 64660,
  "education": "Bachelor's degree",
  "projectedEmployment": {
    "period": "2022-2032",
    "percentChange": 8,
    "notes": "..."
  },
  "careerVideoUrl": "https://...",
  "activities": ["Assess patient health","Administer medications"],
  "relatedOccupations": ["Licensed Practical Nurse","Nurse Practitioner"],
  "sourceUrl": "https://www.careeronestop.org/...",
  "dataSource": "CareerOneStop",
  "lastUpdated": "2025-07-24"
}

College object (example):

{
  "id": "uta",
  "name": "University of Texas at Arlington",
  "url": "https://www.uta.edu",
  "programs": ["Business","Marketing","Accounting"],
  "city": "Arlington",
  "state": "TX",
  "dataSource": "local"
}

Storage location
----------------
- `client/server/prepopulated-careers.json` — career objects (single source used by server route).
- `client/server/prepopulated-colleges.json` — college objects and program mapping.
- Server route: `GET /api/careers/local` and `GET /api/colleges/local` (or a single JSON endpoint `/api/data/prepopulated.json`).

Script to build prepopulated data
--------------------------------
- `scripts/build_prepop.py` or `scripts/build_prepop.js` (Node) run from `client/server`.
- Inputs: list of career titles (user-provided), optional ONET codes.
- For each career:
  1. Try CareerOneStop API (if API credentials available) to fetch canonical data.
  2. If API incomplete or unavailable, fetch the occupation-profile page and scrape fields (meta description, wages, projected employment, video link, activities/tasks, related occupations).
  3. Normalize fields and produce the career object.
  4. Log successes and any missing fields (for manual curation later).
- Save aggregated JSON to `client/server/prepopulated-careers.json` (atomic write).

Server changes
--------------
- Add a small route (in `career-routes.js`) that serves the prepopulated JSON:
  - `router.get('/local', (req, res) => res.json(PREPOP || []))`
  - `router.get('/local/:code', ...)` to fetch single career by onet/title.
- Add `colleges-routes.js` with `GET /api/colleges/local` serving `prepopulated-colleges.json`.

Client changes
--------------
- Update `client/src/pages/CareerExploration.jsx` to fetch `/api/careers/careeronestop/local` instead of upstream API for search results.
- Voice/resolve flow to search the local dataset first (fuzzy match on title and related occupations). If no match, show the external CTA button linking to CareerOneStop.
- Update `client/src/components/CareerCard.jsx`:
  - Collapsed card: show title + up to two of (median wage, education, short activity) — only if present.
  - On "More details" expand: description, projected employment, full activities list, related occupations, career video (embed or link).
  - Make layout mobile-first: large touch targets, readable typography, short paragraphs and bullets.

UX notes (mobile-first)
----------------------
- Cards should be vertically stacked with a comfortable vertical rhythm, 16px–20px tap targets for buttons.
- Collapsed content should be 1–2 lines of description max; show ellipses and a clear "More details" CTA.
- In the modal/expanded view, use stacked sections with headings: "About this career", "Median wage", "Education", "Typical day", "Related occupations", "Resources".

Testing & validation
--------------------
- Unit test: script validates each career contains the required fields (title + either onetCode or sourceUrl + description or wages).
- Manual checks: spot-check 5 careers in the browser, mobile viewport.
- Linting: run `npm run lint` and `npm run dev` to confirm no errors.

Security & compliance
---------------------
- Respect CareerOneStop terms of use. Only scrape public pages for data used in this internal app.
- Rate-limit fetches and add retries with backoff.

Phased implementation plan
--------------------------
Phase 1 (quick win):
- Create the plan and skeleton files (this commit).
- Build `prepopulated-colleges.json` with UTA, UNT, TCC entries and programs (seeded from user list).
- Add server route to serve the prepopulated JSON.

Phase 2 (fetch & populate):
- Run `scripts/build_prepop` to fetch and populate `prepopulated-careers.json` for the 20 careers. Save artifacts.

Phase 3 (client wiring):
- Update client search + voice to use local data and adjust UI to the new card rules.
- Add fallback CTA to CareerOneStop if a spoken career isn't prepopulated.

Phase 4 (polish & test):
- UI polish (spacing, fonts, accessible color contrasts).
- End-to-end testing and QA on mobile.

Files to be added/edited
------------------------
- Add: `client/docs/prepopulate-plan.md` (this document)
- Add: `client/server/prepopulated-colleges.json` (seeded)
- Add: `client/server/scripts/build_prepop.py` (or `js`) — fetch + scrape script
- Edit: `client/server/career-routes.js` — add `/local` serve route
- Edit: `client/src/pages/CareerExploration.jsx` — fetch local data
- Edit: `client/src/components/CareerCard.jsx` — collapsed/expanded UI changes

Sub-careers to fix (manual curation)
----------------------------------
Use the sub-career O*NET codes and CareerOneStop video pages below to populate missing fields in `client/server/prepopulated-careers.json` (fields to fill: `onetCode`, `careerVideoUrl`, `medianWage` if different per sub-career, `education`, `activities`, `relatedOccupations`). Match sub-careers to the prepop `keyword` entries.

1. Business / Finance / Accounting (keyword: "Business")
   - General & Operations Managers — O*NET `11-1021.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11102100
   - Financial Managers — O*NET `11-3031.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11303100
   - Accountants & Auditors — O*NET `13-2011.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=13201100

2. Psychology (keyword: "Psychology")
   - Clinical & Counseling Psychologists — O*NET `19-3033.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19303300

3. Biology / Biological Sciences (keyword: "Biology")
   - Biochemists & Biophysicists — O*NET `19-1021.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19102100

4. Marketing (keyword: "Marketing")
   - Market Research Analysts & Marketing Specialists — O*NET `13-1161.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=13116100

5. Information Science / IT / Information Systems (keyword: "Information Science")
   - Computer & Information Systems Managers — O*NET `11-3021.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11302100
   - Computer Systems Analysts — O*NET `15-1211.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15121100
   - Network & Computer Systems Administrators — O*NET `15-1244.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15124400

6. Nursing / Health Professions (keyword: "Nursing")
   - Registered Nurses — O*NET `29-1141.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29114100

7. Criminal Justice / Public Safety (keyword: "Criminal Justice")
   - Police & Sheriff's Patrol Officers — O*NET `33-3051.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=33305100

8. Education / Teaching / Kinesiology (keyword: "Education")
   - Elementary School Teachers — O*NET `25-2021.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25202100
   - Secondary School Teachers — O*NET `25-2031.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25203100
   - Special Education Teachers, Preschool — O*NET `25-2051.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25205100

9. Liberal Arts / Humanities (keyword: "Liberal Arts")
   - English Language & Literature Teachers, Postsecondary — O*NET `25-1123.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25112300

10. Engineering (keyword: "Engineering")
  - Aerospace Engineers — O*NET `17-2011.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17201100
  - Bioengineers & Biomedical Engineers — O*NET `17-2031.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17203100
  - Civil Engineers — O*NET `17-2051.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17205100
  - Mechanical Engineers — O*NET `17-2141.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17214100

11. Interdisciplinary Studies (keyword: "Interdisciplinary Studies")
  - Area, Ethnic, & Cultural Studies Teachers, Postsecondary — O*NET `25-1062.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25106200

12. Communications / Journalism / Media (keyword: "Communications")
  - News Analysts, Reporters, & Journalists — O*NET `27-3023.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27302300
  - Public Relations Specialists — O*NET `27-3031.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27303100
  - Public Relations Managers — O*NET `11-2032.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11203200

13. Exercise Science / Kinesiology (keyword: "Exercise Science")
  - Exercise Physiologists — O*NET `29-1128.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29112800

14. Biotechnology / Biomedical Technology (keyword: "Biotechnology")
  - Bioengineers & Biomedical Engineers — O*NET `17-2031.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17203100
  - Medical Scientists (except Epidemiologists) — O*NET `19-1042.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19104200

15. Mechanic & Repair / Engineering Technologies (keyword: "Mechanic Repair")
  - Automotive Service Technicians & Mechanics — O*NET `49-3023.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=49302300
  - Industrial Engineering Technologists & Technicians — O*NET `17-3026.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17302600

16. Computer & Information Sciences / Cybersecurity (keyword: "Computer Science")
  - Information Security Analysts — O*NET `15-1212.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15121200
  - Software Developers — O*NET `15-1252.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15125200
  - Computer Programmers — O*NET `15-1251.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15125100

17. Hospitality / Tourism Management (keyword: "Hospitality")
  - Lodging Managers — O*NET `11-9081.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11908100
  - Food Service Managers — O*NET `11-9051.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11905100
  - Meeting, Convention, & Event Planners — O*NET `13-1121.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=13112100

18. Music / Performing Arts (keyword: "Music")
  - Musicians & Singers — O*NET `27-2042.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27204200

19. Architecture / Urban Planning / Design (keyword: "Architecture")
  - Architects (except Landscape & Naval) — O*NET `17-1011.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17101100
  - Urban & Regional Planners — O*NET `19-3051.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19305100
  - Landscape Architects — O*NET `17-1012.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17101200
  - Interior Designers — O*NET `27-1025.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27102500

20. Radiologic Technology / Imaging (keyword: "Radiologic Technology")
  - Radiologic Technologists & Technicians — O*NET `29-2034.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29203400

21. Diagnostic Imaging (keyword: "Diagnostic Medical Sonography")
  - Diagnostic Medical Sonographers — O*NET `29-2032.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29203200
  - Magnetic Resonance Imaging Technologists — O*NET `29-2035.00` — https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29203500

Notes:
- Use the `codes_with_videos.txt` in `client/docs/` as a reference for additional skill/ability videos if needed.
- After you review and confirm these mappings I can run a small script to inject `onetCode` and `careerVideoUrl` into `client/server/prepopulated-careers.json` for the matching `keyword` entries.

Next steps for me (I will do these unless you want to modify the plan):
1. Create `prepopulated-colleges.json` seeded from your provided list (UTA, UNT, TCC).
2. Implement the server route `GET /api/careers/careeronestop/local` and `GET /api/colleges/local` (simple static JSON serve).
3. Create the `scripts/build_prepop.py` script to fetch and scrape data for the careers (I will run it for the 21 majors you listed). I will rate-limit and honor timeouts.
4. Run the script and save `prepopulated-careers.json`.
5. Wire the client to use the local endpoint and update the UI components.

Please confirm and paste the exact 20 careers you want (your list of 21 majors is fine — I will use these), and I will proceed with Phase 1 and Phase 2.
# Top 21 Career Degree Areas (Combined Across UTA, TCC, and UNT)

1. Business / Finance / Accounting  
2. Psychology  
3. Biology / Biological Sciences  
4. Marketing  
5. Information Science / IT / Information Systems  
6. Nursing / Health Professions  
7. Criminal Justice / Public Safety  
8. Education / Teaching / Kinesiology  
9. Liberal Arts / Humanities / General Studies  
10. Engineering (multiple disciplines)  
11. Multi-/Interdisciplinary Studies  
12. Communications / Journalism / Media  
13. Exercise Science / Kinesiology  
14. Biotechnology / Biomedical Technology  
15. Mechanic & Repair / Engineering Technologies  
16. Computer Sciences / Cybersecurity  
17. Hospitality / Tourism Management  
18. Music / Performing Arts  
19. Architecture / Urban Planning / Design  
20. Radiologic Technology / Imaging (General)  
21. Diagnostic Medical Sonographer (Sonogram Technician)  
21. Magnetic Resonance Imaging (MRI) Technician  
--
## data pulled for reference:##  
https://www.onetcenter.org/database.html#occ

# Top 21 Career Majors Across UTA, TCC, and UNT  
*(Texas median wages shown at the cluster level; sub‑careers inherit the cluster’s TX median unless otherwise noted. O*NET codes and video links verified from CareerOneStop crosswalk.)*

1. **Business / Business Administration / Finance / Accounting**  
   - **UTA**: Business, Banking & Finance, Marketing, Accounting  
   - **UNT**: Business, Accounting, Finance  
   - **TCC**: Business, Management, Marketing  
   - **Median Wage (TX)**: ~$76,850/yr (varies by specialty)  
   - **Degree Required**: Bachelor’s  
   - **Sub‑careers (with code + video):**  
     - General and Operations Managers — **O*NET `11-1021.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11102100  
     - Financial Managers — **O*NET `11-3031.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11303100  
     - Accountants and Auditors — **O*NET `13-2011.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=13201100  

2. **Psychology**  
   - **UNT**: Psychology  
   - **Median Wage (TX)**: ~$54,290/yr (higher with graduate licensure)  
   - **Degree Required**: Bachelor’s (practice requires Master’s/Doctoral + license)  
   - Clinical and Counseling Psychologists — **O*NET `19-3033.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19303300  

3. **Biology / Biological Sciences**  
   - **UTA**: Biology  • **UNT**: Biological Sciences  
   - **Median Wage (TX)**: varies by role (~$65k+)  
   - **Degree Required**: Bachelor’s (many roles prefer graduate study)  
   - Biochemists & Biophysicists — **O*NET `19-1021.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19102100  

4. **Marketing**  
   - **UTA**: Marketing  • **UNT**: Marketing  
   - **Median Wage (TX)**: ~$73,340/yr (market research; managers higher)  
   - **Degree Required**: Bachelor’s  
   - Market Research Analysts & Marketing Specialists — **O*NET `13-1161.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=13116100  

5. **Information Science / IT / Information Systems**  
   - **UTA**: Information Science / IS  • **UNT**: IT & Decision Sciences  
   - **Median Wage (TX)**: ~$95,000/yr (role‑dependent)  
   - **Degree Required**: Bachelor’s  
   - **Sub‑careers (with code + video):**  
     - Computer & Information Systems Managers — **O*NET `11-3021.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11302100  
     - Computer Systems Analysts — **O*NET `15-1211.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15121100  
     - Network & Computer Systems Administrators — **O*NET `15-1244.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15124400  

6. **Nursing / Health Professions**  
   - **UTA**: Nursing  • **TCC**: Health Professions (ADN)  
   - **Median Wage (TX)**: ~$81,220/yr (Registered Nurse)  
   - **Degree Required**: Associate’s or Bachelor’s (BSN preferred)  
   - Registered Nurses — **O*NET `29-1141.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29114100  

7. **Criminal Justice / Public Safety**  
   - **UNT**: Criminal Justice  • **TCC**: Security & Protective Services  
   - **Median Wage (TX)**: ~$53,400/yr (law enforcement officers)  
   - **Degree Required**: Varies (academy/cert; AS/BS often preferred)  
   - Police & Sheriff’s Patrol Officers — **O*NET `33-3051.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=33305100  

8. **Education / Teaching / Kinesiology**  
   - **UNT**: Education, Kinesiology  • **TCC**: Education AA  
   - **Median Wage (TX)**: ~$61,690/yr (K–12 teachers)  
   - **Degree Required**: Bachelor’s + certification  
   - **Sub‑careers (with code + video):**  
     - Elementary School Teachers (except Special Ed) — **O*NET `25-2021.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25202100  
     - Secondary School Teachers (except Special/Career/Tech) — **O*NET `25-2031.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25203100  
     - Special Education Teachers, Preschool — **O*NET `25-2051.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25205100  

9. **Liberal Arts / Humanities / General Studies**  
   - **UNT**: Liberal Arts/General Studies  • **TCC**: Liberal Arts & Sciences AA  
   - **Median Wage (TX)**: varies (~$50k median across roles)  
   - **Degree Required**: Associate’s or Bachelor’s  
   - English Language & Literature Teachers, Postsecondary — **O*NET `25-1123.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25112300  

10. **Engineering (Civil, Mechanical, Aerospace, Bioengineering)**  
    - **UTA**: Multiple engineering disciplines  
    - **Median Wage (TX)**: ~$95,600/yr (discipline‑dependent)  
    - **Degree Required**: Bachelor’s  
    - **Sub‑careers (with code + video):**  
      - Aerospace Engineers — **O*NET `17-2011.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17201100  
      - Bioengineers & Biomedical Engineers — **O*NET `17-2031.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17203100  
      - Civil Engineers — **O*NET `17-2051.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17205100  
      - Mechanical Engineers — **O*NET `17-2141.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17214100  

11. **Multi‑/Interdisciplinary Studies**  
    - **UNT**: Interdisciplinary Studies (various)  
    - **Median Wage (TX)**: varies (~$52k)  
    - **Degree Required**: Bachelor’s  
    - Area, Ethnic, & Cultural Studies Teachers, Postsecondary — **O*NET `25-1062.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=25106200  

12. **Communications / Journalism / Media**  
    - **UTA**: Communications  • **UNT**: Journalism (Mayborn)  
    - **Median Wage (TX)**: ~$55,310/yr (reporters/PR vary)  
    - **Degree Required**: Bachelor’s  
    - **Sub‑careers (with code + video):**  
      - News Analysts, Reporters, & Journalists — **O*NET `27-3023.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27302300  
      - Public Relations Specialists — **O*NET `27-3031.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27303100  
      - Public Relations Managers — **O*NET `11-2032.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11203200  

13. **Exercise Science / Kinesiology**  
    - **UNT**: Kinesiology / Exercise Science  
    - **Median Wage (TX)**: ~$48,940/yr (entry roles; PT/OT require advanced degrees)  
    - **Degree Required**: Bachelor’s (advanced degrees for clinical roles)  
    - Exercise Physiologists — **O*NET `29-1128.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29112800  

14. **Biotechnology / Biomedical Technology**  
    - **TCC**: Biomedical Technology certificates  
    - **Median Wage (TX)**: ~$70,620/yr (lab/biotech roles vary)  
    - **Degree Required**: Associate’s or Bachelor’s  
    - **Sub‑careers (with code + video):**  
      - Bioengineers & Biomedical Engineers — **O*NET `17-2031.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17203100  
      - Medical Scientists (except Epidemiologists) — **O*NET `19-1042.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19104200  

15. **Mechanic & Repair / Engineering Technologies**  
    - **TCC**: Automotive, Construction, Electronics Tech  
    - **Median Wage (TX)**: ~$54,000/yr (varies by trade)  
    - **Degree Required**: Certificate or Associate’s  
    - **Sub‑careers (with code + video):**  
      - Automotive Service Technicians & Mechanics — **O*NET `49-3023.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=49302300  
      - Industrial Engineering Technologists & Technicians — **O*NET `17-3026.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17302600  

16. **Computer & Information Sciences / Cybersecurity**  
    - **TCC**: Computer Info & Support  • **UNT**: Cybersecurity  
    - **Median Wage (TX)**: ~$104,070/yr (security analysts)  
    - **Degree Required**: Bachelor’s  
    - **Sub‑careers (with code + video):**  
      - Information Security Analysts — **O*NET `15-1212.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15121200  
      - Software Developers — **O*NET `15-1252.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15125200  
      - Computer Programmers — **O*NET `15-1251.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=15125100  

17. **Hospitality / Tourism Management**  
    - **UTA**: Hospitality Management  • **UNT**: Hospitality & Tourism  
    - **Median Wage (TX)**: ~$59,440/yr (managers; frontline roles lower)  
    - **Degree Required**: Associate’s or Bachelor’s  
    - **Sub‑careers (with code + video):**  
      - Lodging Managers — **O*NET `11-9081.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11908100  
      - Food Service Managers — **O*NET `11-9051.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=11905100  
      - Meeting, Convention, & Event Planners — **O*NET `13-1121.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=13112100  

18. **Music / Performing Arts**  
    - **UNT**: College of Music  
    - **Median Wage (TX)**: highly variable (~$52,800 median; wide range)  
    - **Degree Required**: Bachelor’s  
    - Musicians & Singers — **O*NET `27-2042.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27204200  

19. **Architecture / Urban Planning / Design**  
    - **UTA**: Architecture, Interior, Landscape (CAPPA)  
    - **Median Wage (TX)**: ~$82,640/yr (architects)  
    - **Degree Required**: Bachelor’s (NAAB‑accredited)  
    - **Sub‑careers (with code + video):**  
      - Architects (except Landscape & Naval) — **O*NET `17-1011.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17101100  
      - Urban & Regional Planners — **O*NET `19-3051.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=19305100  
      - Landscape Architects — **O*NET `17-1012.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=17101200  
      - Interior Designers — **O*NET `27-1025.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=27102500  

20. **Radiologic Technology / Imaging**  
    - **TCC**: Radiologic Technology  
    - **Median Wage (TX)**: ~$69,980/yr  
    - **Degree Required**: Associate’s  
    - Radiologic Technologists & Technicians — **O*NET `29-2034.00`** — Video: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29203400  

21. **Diagnostic Imaging Careers (Sonography & MRI)**  
    - **School**: TCC (Selective‑admission programs)  
    - **A. Diagnostic Medical Sonographers** — **O*NET `29-2032.00`**  
      - **Degree Required**: Associate’s (certificates also common)  
      - **Video**: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29203200  
    - **B. Magnetic Resonance Imaging Technologists** — **O*NET `29-2035.00`**  
      - **Degree Required**: Associate’s or postsecondary certificate  
      - **Video**: https://www.careeronestop.org/careeronestop-videos.aspx?videocode=29203500
