import { useState } from "react";
import PropTypes from "prop-types";

export default function CareerCard({ data, onRemoveToggle, defaultChecked = false, onFindColleges, onSelectToggle, onSelect, selected }) {
  const [expanded, setExpanded] = useState(false);
  // this card renders only PREPOP data (no runtime upstream calls)
  const displayTitle = data.keyword || data.onetTitle || data.title || 'Untitled Career';
  const salaryLabel = data.medianWage && Number.isFinite(data.medianWage) ? `$${Number(data.medianWage).toLocaleString()}` : 'Unknown';
  return (
    <div className={`rounded-xl border shadow-sm p-4 bg-white/80 backdrop-blur mb-3 ${selected ? 'ring-4 ring-indigo-300' : ''}`}>
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold pr-3">{displayTitle}</h3>
        <div className="text-xs opacity-70">{salaryLabel}<span className="ml-1"> Median wage</span></div>
      </div>
  {/* Minimal summary only on collapsed card for mobile friendliness */}
  <div className="mt-2 text-sm opacity-80">Tap "View details" for more information.</div>
      <div className="mt-3 flex gap-2">
  <button className="text-base underline px-2 py-1" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Hide details' : 'View details'}</button>
        {onFindColleges && (
          <button
            className="text-base underline px-2 py-1"
            onClick={() => onFindColleges(data.keyword || displayTitle)}
          >
            Explore Texas colleges for this career
          </button>
        )}
        {onSelect && (
          <button
            className="text-base underline px-2 py-1"
            onClick={() => onSelect(data)}
          >
            {selected ? 'Selected' : 'Select career'}
          </button>
        )}
        {data.sourceUrl && (
          <a
            className="text-sm underline"
            href={data.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
        )}
      </div>
      {expanded && (
        <div className="mt-3 text-sm opacity-90">
          {/* show any prepopulated description or metadata when expanded */}
      {(data.description || data.onetDescription || data.education || data.category || data.socCode) && (
            <div className="mb-2 text-sm leading-snug">
        {data.description && <p className="mb-2">{data.description}</p>}
        {data.onetDescription && !data.description && <p className="mb-2">{data.onetDescription}</p>}
        {data.education && <div className="mb-1"><span className="opacity-70">Education: </span><span className="font-medium">{data.education}</span></div>}
              {data.category && <div className="mb-1"><span className="opacity-70">Category: </span><span className="font-medium">{data.category}</span></div>}
              {data.socCode && <div className="mb-1 opacity-70">SOC: {data.socCode}</div>}
            </div>
          )}
          {/* Render prepopulated details only */}
          <div>
            {data.description && <p className="mb-2">{data.description}</p>}
            {data.onetDescription && !data.description && <p className="mb-2">{data.onetDescription}</p>}
            {data.education && <div className="mb-1"><span className="opacity-70">Education: </span><span className="font-medium">{data.education}</span></div>}
            {data.activities && data.activities.length > 0 && <div className="mb-1"><span className="opacity-70">Typical day: </span><span className="font-medium">{Array.isArray(data.activities) ? data.activities.slice(0,6).join('; ') : String(data.activities)}</span></div>}
            {data.relatedOccupations && data.relatedOccupations.length > 0 && <div className="mb-1"><span className="opacity-70">Related occupations: </span><span className="font-medium">{data.relatedOccupations.join(', ')}</span></div>}
            {data.medianWage && <div className="mb-1"><span className="opacity-70">Median wage: </span><span className="font-medium">${data.medianWage.toLocaleString()}</span></div>}
            {(() => {
              // prefer a canonical CareerOneStop videos URL
              const extractCode = (url = '') => {
                try {
                  const u = String(url || '');
                  const m = u.match(/videocode=(\d+)/i);
                  if (m && m[1]) return m[1];
                } catch {}
                return null;
              };
              const code = extractCode(data.careerVideoUrl) || extractCode(data.sourceUrl) || (data.onetCode ? data.onetCode.replace(/\D/g, '') : null);
              const videoUrl = code ? `https://www.careeronestop.org/Videos/careeronestop-videos.aspx?videocode=${code}` : (data.careerVideoUrl || null);
              return videoUrl ? (<div className="mt-2"><a className="underline text-sm" href={videoUrl} target="_blank" rel="noreferrer">Watch career video</a></div>) : null;
            })()}
            {!data.description && !data.onetDescription && !data.education && !data.activities && !data.relatedOccupations && !data.medianWage && !data.careerVideoUrl && (
              <div className="opacity-70">No additional details available for this prepopulated career.</div>
            )}
          </div>
        </div>
      )}
      <label className="mt-4 flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            const checked = e.target.checked;
            onRemoveToggle?.(checked);
            onSelectToggle?.({ checked, title: data.keyword || displayTitle, onetCode: data.onetCode || data.OnetCode || null, full: data });
          }}
        />
  <span>Add to compare</span>
      </label>
    </div>
  );
}

CareerCard.propTypes = {
  data: PropTypes.object.isRequired,
  onRemoveToggle: PropTypes.func,
  defaultChecked: PropTypes.bool,
  onFindColleges: PropTypes.func,
};
