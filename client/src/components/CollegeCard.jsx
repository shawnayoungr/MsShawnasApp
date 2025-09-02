import React, { useState } from "react";

export default function CollegeCard({ college }) {
  const [expanded, setExpanded] = useState(false);
  if (!college) return null;
  const {
    school,
    latest,
    id,
    ...rest
  } = college;
  const tuition = latest?.cost?.tuition?.in_state || latest?.cost?.tuition?.out_of_state || 0;
  const acceptance = latest?.admissions?.admission_rate?.overall || 0;
  const city = school?.city || "Unknown";
  const majors = (latest?.academics?.program_percentage && Object.entries(latest.academics.program_percentage)) || [];
  const topMajors = majors.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k.replace(/_/g, ' '));
  const moreMajors = majors.length > 3 ? majors.length - 3 : 0;
  const type = school?.ownership === 1 ? "Public" : school?.ownership === 2 ? "Private nonprofit" : "Private for-profit";
  const size = latest?.student?.size || "Unknown";

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-1">
        <h2 className="font-bold text-lg truncate" title={school?.name}>{school?.name}</h2>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{type}</span>
      </div>
      <div className="text-xs text-gray-500 mb-2">{city}, TX</div>
      <div className="flex flex-wrap gap-4 text-sm mb-2">
        <div><span className="material-icons text-base align-middle mr-1">attach_money</span> Tuition <br /> <span className="font-semibold">{tuition ? `$${tuition.toLocaleString()}` : "Unknown"}</span></div>
        <div><span className="material-icons text-base align-middle mr-1">percent</span> Acceptance <br /> <span className="font-semibold">{acceptance ? `${Math.round(acceptance * 100)}%` : "Unknown"}</span></div>
        <div><span className="material-icons text-base align-middle mr-1">groups</span> Size <br /> <span className="font-semibold">{size || "Unknown"}</span></div>
      </div>
      <div className="mb-2">
        <span className="font-semibold">Top Majors:</span> {topMajors.join(", ")}{moreMajors > 0 && ` +${moreMajors} more`}
      </div>
      <button onClick={() => setExpanded((e) => !e)} className="w-full mt-2 py-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-semibold text-indigo-800 transition">
        {expanded ? "Hide Details" : "Learn More"}
      </button>
      {expanded && (
        <div className="mt-3 text-xs text-gray-700 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(college, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
