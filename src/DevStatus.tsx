import { Target, AlertTriangle, FileText, CheckCircle, Code, Palette, Zap } from 'lucide-react';

export default function DevStatus() {
  const goal = "Build a Smart Connector Extension that acts as an Intelligent Networking AI CRM, automatically scraping, aligning, and scoring profiles across the web based on My Profile and Target Personas.";
  
  const targets = [
    { id: 1, text: "Finish core UI styling and ensure responsiveness.", status: "completed" },
    { id: 2, text: "Solidify content.js logic for better parsing of LinkedIn profiles.", status: "completed" },
    { id: 3, text: "Implement Intelligent 3-Pillar System (Capturer, Profile Aligner, Range Creator).", status: "completed" },
    { id: 4, text: "Integrate Full Context Scraping & Fuse.js Fuzzy Matching.", status: "completed" },
    { id: 5, text: "Build Multi-Profile Extractor for non-LinkedIn websites.", status: "completed" },
    { id: 6, text: "Add setting for auto-export or cloud sync capabilities.", status: "pending" }
  ];

  const issues = [
    { id: 1, text: "Monetization export alert is just a placeholder.", severity: "low" }
  ];

  const logs = [
    { date: "2026-08-11", type: "integration", text: "Implemented background and content scripts for basic email/phone/linkedin extraction." },
    { date: "2026-08-11", type: "ui", text: "Completely overhauled the UI using lucide-react and modern sleek tailwind design." },
    { date: "2026-08-11", type: "feature", text: "Updated content.js to extract LinkedIn Headline, Company, and Top Skills into Notes." },
    { date: "2026-08-11", type: "architecture", text: "Built Intelligent Scoring System, Target Radar tab, Domain Tagging, and Profile alignment algorithms." },
    { date: "2026-08-11", type: "ui", text: "Implemented advanced Form Controls (Sliders, Custom Tag Inputs, Presets) for Target Persona configuration." },
    { date: "2026-08-11", type: "feature", text: "Upgraded Target Radar to support a Saved Persona Library with an expandable accordion UI and dynamic matching stats." },
    { date: "2026-08-11", type: "feature", text: "Improved CSV Exporter by adding Target Name column when active persona is detected." },
    { date: "2026-08-11", type: "integration", text: "Fixed LinkedIn experience calculation regex for edge cases like '7 yrs 2 mos'." },
    { date: "2026-08-11", type: "architecture", text: "Built Multi-Profile Extractor to intelligently parse emails and multiple profiles from generic B2B websites without junk data." },
    { date: "2026-08-11", type: "integration", text: "Integrated Fuse.js for Fuzzy Matching and overhauled content.js to scrape full About & Experience context." },
    { date: "2026-08-11", type: "ui", text: "Added 'Add Lead Manually' button with intuitive dropdowns for quick manual entry." }
  ];

  return (
    <div className="flex flex-col gap-3 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Goal Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target size={64} />
        </div>
        <h2 className="font-black text-[15px] mb-1.5 flex items-center gap-2 text-white">
          <Target size={16} /> Ultimate Goal
        </h2>
        <p className="text-xs text-blue-100 font-medium leading-relaxed max-w-[90%] relative z-10">
          {goal}
        </p>
      </div>

      {/* Grid for Targets & Issues */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 shadow-sm">
          <h2 className="font-black text-[13px] text-slate-900 mb-2.5 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Next Targets
          </h2>
          <ul className="space-y-2">
            {targets.map(t => (
              <li key={t.id} className="text-[11px] flex items-start gap-2">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === 'completed' ? 'bg-emerald-500' : t.status === 'in-progress' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span className={t.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800 font-semibold'}>{t.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <h2 className="font-black text-[13px] text-rose-900 mb-2.5 flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-600" /> Needs Attention
          </h2>
          <ul className="space-y-2">
            {issues.length > 0 ? issues.map(i => (
              <li key={i.id} className="text-[11px] flex items-start gap-2">
                <span className="mt-0.5 text-rose-600 flex-shrink-0 font-bold">•</span>
                <span className="text-rose-800 font-medium">{i.text}</span>
              </li>
            )) : (
               <div className="text-[11px] text-rose-600/70 italic font-medium">No current issues. Great job!</div>
            )}
          </ul>
        </div>
      </div>

      {/* Dev Logs Section */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="bg-slate-200/50 p-2.5 border-b border-slate-300 flex justify-between items-center">
          <h2 className="font-black text-slate-900 text-[12px] flex items-center gap-1.5">
            <FileText size={14} className="text-indigo-600" /> Development & Testing Log
          </h2>
        </div>
        <div className="p-3.5 flex-1 overflow-y-auto max-h-[170px] custom-scrollbar">
          <div className="space-y-3.5">
            {[...logs].reverse().map((log, idx) => (
              <div key={idx} className="flex gap-3 border-l-2 border-slate-300 pl-3 relative">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-50"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold text-slate-500">{log.date}</span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${
                      log.type === 'feature' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      log.type === 'ui' ? 'bg-pink-100 text-pink-800 border-pink-300' :
                      log.type === 'architecture' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                      'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {log.type === 'feature' && <CheckCircle size={8} className="inline mr-1" />}
                      {log.type === 'ui' && <Palette size={8} className="inline mr-1" />}
                      {log.type === 'integration' && <Code size={8} className="inline mr-1" />}
                      {log.type === 'architecture' && <Zap size={8} className="inline mr-1" />}
                      {log.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-medium">{log.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
