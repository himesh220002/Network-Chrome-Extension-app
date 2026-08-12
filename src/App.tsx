import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import { Users, Target, User, Wrench, Download, Zap, Link as LinkIcon, Trash2, Mail, Phone, Search, Briefcase, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Save, ExternalLink, Radar, Globe, X, SlidersHorizontal, Info, RefreshCw, Library, Edit2 } from 'lucide-react'
import DevStatus from './DevStatus';

interface Connection {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  url: string;
  timestamp: number;
  status: 'Lead' | 'Contacted' | 'VIP' | 'Ignore';
  notes?: string;
  isBusiness?: boolean;
  careerStage?: 'Student' | 'Fresher' | 'Experienced';
  totalYearsExp?: number;
  fullProfileContext?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  cvLink: string;
  portfolio: string;
  skills: string;
  careerStage: 'Student' | 'Fresher' | 'Experienced';
  experienceHistory: { company: string; jobProfile: string; yearsOfExp: number; }[];
  totalYearsExp: number;
}

interface TargetPersona {
  id: string;
  name: string;
  intent: 'Hiring' | 'Job Seeking' | 'B2B Sales' | 'Networking';
  roles: string[];
  skills: string[];
  industry: string;
  location: string;
  seniority: 'Entry-level' | 'Mid-level' | 'Senior' | 'Executive' | 'Any';
  weights: {
    role: number;
    skills: number;
    industry: number;
    location: number;
  };
  autoSaveEnabled: boolean;
  autoSaveThreshold: number;
}

const DEFAULT_TARGET_PERSONA: TargetPersona = {
  id: 'default_1',
  name: 'Default Tech Radar',
  intent: 'Job Seeking',
  roles: ['Recruiter', 'Engineering Manager', 'Founder'],
  skills: ['Hiring', 'Startups'],
  industry: 'Tech',
  location: 'Global',
  seniority: 'Any',
  weights: { role: 40, skills: 30, industry: 15, location: 15 },
  autoSaveEnabled: true,
  autoSaveThreshold: 70
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'connections' | 'radar' | 'ats' | 'profile' | 'dev'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: '', email: '', phone: '', cvLink: '', portfolio: '', skills: 'React, TypeScript, Next.js, Node.js',
    careerStage: 'Fresher', experienceHistory: [], totalYearsExp: 0
  });
  
  const [savedPersonas, setSavedPersonas] = useState<TargetPersona[]>([DEFAULT_TARGET_PERSONA]);
  const [activePersonaId, setActivePersonaId] = useState<string>('default_1');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['connections', 'profile', 'savedPersonas', 'activePersonaId'], (result) => {
        if (result.connections) setConnections(result.connections as Connection[]);
        if (result.profile) setProfile(result.profile as UserProfile);
        
        if (result.savedPersonas && (result.savedPersonas as TargetPersona[]).length > 0) {
          setSavedPersonas(result.savedPersonas as TargetPersona[]);
        }
        if (result.activePersonaId) {
          setActivePersonaId(result.activePersonaId as string);
        }
      });
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'POPUP_OPENED' }).catch(() => {});
      }
    } else {
      setConnections([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Technical Recruiter at Acme Corp', url: 'https://linkedin.com/in/johndoe', timestamp: Date.now(), status: 'VIP', notes: '💡 Tech Hiring • Startups' },
        { id: '2', email: 'hello@startup.io', url: 'https://startup.io', timestamp: Date.now() - 10000, status: 'Lead', isBusiness: true, notes: '🏢 Startup Inc' },
        { id: '3', name: 'Jane Smith', phone: '+1 (555) 123-4567', role: 'Software Engineer', url: 'https://linkedin.com/in/janesmith', timestamp: Date.now() - 50000, status: 'Contacted', notes: '💡 React • Node.js' },
      ]);
    }
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({ profile: newProfile });
  };

  const updateConnections = (newConnections: Connection[]) => {
    setConnections(newConnections);
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({ connections: newConnections });
  };

  const updatePersonas = (newPersonas: TargetPersona[], newActiveId: string) => {
    setSavedPersonas(newPersonas);
    setActivePersonaId(newActiveId);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ savedPersonas: newPersonas, activePersonaId: newActiveId });
    }
  };

  const exportCSV = () => {
    if (connections.length === 0) return alert("No connections to export.");

    const rows = [
      ["Name", "Target Detected", "Target Name", "Role", "Platform", "Exp Level", "Exp Years", "Status", "Match Score", "Email", "Phone", "Notes & Links"]
    ];

    const escapeCSV = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    connections.forEach(c => {
      let score = 0;
      const baseText = `${c.role || ''} ${c.notes || ''} ${c.fullProfileContext || ''}`;
      
      if (baseText.trim()) {
         const fuseTextSearch = new Fuse([baseText], { includeScore: true, threshold: 0.3 });

         if (activePersona.roles.length > 0) {
            let roleMatch = false;
            activePersona.roles.forEach(r => {
                if (fuseTextSearch.search(r).length > 0) roleMatch = true;
            });
            if (roleMatch) score += activePersona.weights.role;
         }
         
         if (activePersona.skills.length > 0) {
            let skillMatchCount = 0;
            activePersona.skills.forEach(s => { 
                if (fuseTextSearch.search(s).length > 0) skillMatchCount++; 
            });
            if (skillMatchCount > 0) score += activePersona.weights.skills * Math.min(1, skillMatchCount / Math.max(1, activePersona.skills.length - 1));
         }
         
         const pSkills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
         pSkills.forEach(s => { 
             if (fuseTextSearch.search(s).length > 0) score += 10; 
         });
         
         if (c.email || c.phone) score += 5;
      }
      
      const finalScore = Math.min(Math.round(score), 100);
      const isTarget = finalScore >= 40 ? "Yes" : "No";
      const targetName = isTarget === "Yes" ? activePersona.name : "";

      let domain = "Website";
      try {
        const hostname = new URL(c.url).hostname.replace('www.', '');
        if (hostname.includes('linkedin')) domain = "LinkedIn";
        else if (hostname.includes('google')) domain = "Google";
        else domain = hostname;
      } catch {}

      const notesAndLinks = `[Primary] ${c.url} | ${c.notes || ''}`;

      rows.push([
        escapeCSV(c.name || 'Unknown'),
        escapeCSV(isTarget),
        escapeCSV(targetName),
        escapeCSV(c.role),
        escapeCSV(domain),
        escapeCSV(c.careerStage),
        escapeCSV(c.totalYearsExp),
        escapeCSV(c.status || 'Lead'),
        escapeCSV(`${finalScore}%`),
        escapeCSV(c.email),
        escapeCSV(c.phone),
        escapeCSV(notesAndLinks)
      ]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `smart-connector-leads-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerRefresh = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['connections'], (result) => {
        if (result.connections) setConnections(result.connections as Connection[]);
      });
      if (chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_NOW' }).catch(() => {});
          }
        });
      }
    }
  };

  const tabs = [
    { id: 'connections', label: 'CRM', icon: Users },
    { id: 'radar', label: 'Radar', icon: Radar },
    { id: 'ats', label: 'Matcher', icon: Target },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'dev', label: 'Dev', icon: Wrench },
  ] as const;

  const activePersona = savedPersonas.find(p => p.id === activePersonaId) || savedPersonas[0] || DEFAULT_TARGET_PERSONA;

  return (
    <div className="w-[600px] h-[550px] flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <header className="bg-white px-5 py-3 flex items-center justify-between border-b border-slate-200/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Zap size={18} className="fill-current" />
          </div>
          <h1 className="font-extrabold text-[17px] text-slate-900 tracking-tight flex items-center gap-2">
            Smart Connector
            <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold border border-indigo-100/50">Pro</span>
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={triggerRefresh} className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg transition-all font-semibold border border-slate-200 shadow-sm active:scale-95" title="Force Extract & Reload">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg transition-all font-semibold border border-slate-200 shadow-sm active:scale-95">
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 pb-2 bg-slate-50">
        <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5 scale-100' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 scale-[0.98]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-5 pt-2 custom-scrollbar relative">
        {activeTab === 'connections' && <ConnectionsList connections={connections} onDelete={deleteConnection} onUpdate={updateConnection} onAdd={addConnection} profile={profile} targetPersona={activePersona} />}
        {activeTab === 'radar' && <TargetRadarManager savedPersonas={savedPersonas} activePersonaId={activePersonaId} updatePersonas={updatePersonas} connections={connections} />}
        {activeTab === 'profile' && <ProfileForm profile={profile} onSave={saveProfile} />}
        {activeTab === 'ats' && <ATSMatcher profile={profile} />}
        {activeTab === 'dev' && <DevStatus />}
      </main>
    </div>
  )

  function updateConnection(id: string, updates: Partial<Connection>) {
    const updated = connections.map(c => c.id === id ? { ...c, ...updates } : c);
    updateConnections(updated);
  }
  
  function deleteConnection(id: string) {
    const updated = connections.filter(c => c.id !== id);
    updateConnections(updated);
  }

  function addConnection(newConnection: Connection) {
    updateConnections([newConnection, ...connections]);
  }
}

// ---------------------------------------------------------------------------
// Reusable Tag Input Component
// ---------------------------------------------------------------------------
function TagInput({ tags, setTags, placeholder, icon: Icon }: { tags: string[], setTags: (t: string[]) => void, placeholder: string, icon: any }) {
  const [val, setVal] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (val.trim() && !tags.includes(val.trim())) {
        setTags([...tags, val.trim()]);
        setVal('');
      }
    }
  };
  return (
    <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 focus-within:bg-white">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
            {t}
            <X size={10} className="cursor-pointer hover:text-indigo-900" onClick={() => setTags(tags.filter(x => x !== t))} />
          </span>
        ))}
        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
          {tags.length === 0 && <Icon size={12} className="text-slate-400 ml-1" />}
          <input 
            type="text" value={val} onChange={e => setVal(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : 'Type and hit Enter...'}
            className="w-full text-xs bg-transparent outline-none placeholder:text-slate-400 py-1"
          />
        </div>
      </div>
    </div>
  )
}

function WeightSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className="text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{value}%</span>
      </div>
      <input 
        type="range" min="0" max="100" step="5" value={value} 
        onChange={e => onChange(Number(e.target.value))} 
        className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Target Radar Manager (Form + Accordion List)
// ---------------------------------------------------------------------------
function TargetRadarManager({ savedPersonas, activePersonaId, updatePersonas, connections }: { savedPersonas: TargetPersona[], activePersonaId: string, updatePersonas: (p: TargetPersona[], active: string) => void, connections: Connection[] }) {
  
  const [formData, setFormData] = useState<TargetPersona>(() => {
    return savedPersonas.find(p => p.id === activePersonaId) || savedPersonas[0] || {
      id: Date.now().toString(), name: '', intent: 'Networking', roles: [], skills: [], industry: 'Tech', location: 'Global', seniority: 'Any', weights: { role: 40, skills: 40, industry: 10, location: 10 }, autoSaveEnabled: false, autoSaveThreshold: 70
    };
  });
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Re-sync form if active persona changes externally
  useEffect(() => {
    const active = savedPersonas.find(p => p.id === activePersonaId);
    if (active) setFormData(active);
  }, [activePersonaId, savedPersonas]);

  const applyPreset = (preset: 'Recruiter' | 'Founder' | 'Tech') => {
    if (preset === 'Recruiter') {
      setFormData({ ...formData, name: 'Tech Recruiters', intent: 'Job Seeking', roles: ['Recruiter', 'HR', 'Talent', 'Hiring Manager'], skills: ['Hiring', 'Startups'], industry: 'Tech', weights: { role: 60, skills: 20, industry: 10, location: 10 } });
    } else if (preset === 'Founder') {
      setFormData({ ...formData, name: 'B2B Founders', intent: 'B2B Sales', roles: ['Founder', 'CEO', 'CTO', 'Director'], skills: ['Leadership', 'Venture'], industry: 'Startups', weights: { role: 50, skills: 10, industry: 30, location: 10 } });
    } else {
      setFormData({ ...formData, name: 'Tech Talent', intent: 'Hiring', roles: ['Software Engineer', 'Developer', 'Architect'], skills: ['React', 'Node', 'TypeScript', 'AI'], industry: 'Tech', weights: { role: 30, skills: 60, industry: 5, location: 5 } });
    }
  };

  const handleSave = (e: React.FormEvent | React.MouseEvent, asNew = false) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Please name your Radar Profile.");
    
    let targetData = { ...formData };
    
    if (asNew) {
      targetData.id = Date.now().toString();
      const newSaved = [...savedPersonas, targetData];
      updatePersonas(newSaved, targetData.id);
    } else {
      const exists = savedPersonas.find(p => p.id === targetData.id);
      let newSaved;
      if (exists) {
        newSaved = savedPersonas.map(p => p.id === targetData.id ? targetData : p);
      } else {
        newSaved = [...savedPersonas, targetData];
      }
      updatePersonas(newSaved, targetData.id);
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCreateNew = () => {
    setFormData({
      id: Date.now().toString(), name: 'New Custom Radar', intent: 'Networking', roles: [], skills: [], industry: 'Any', location: 'Global', seniority: 'Any', weights: { role: 40, skills: 40, industry: 10, location: 10 }, autoSaveEnabled: false, autoSaveThreshold: 50
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = savedPersonas.filter(p => p.id !== id);
    if (newSaved.length === 0) return alert("You must have at least one Radar Profile.");
    const newActiveId = activePersonaId === id ? newSaved[0].id : activePersonaId;
    updatePersonas(newSaved, newActiveId);
  };

  // Shared scoring function just to count matches
  const countMatches = (p: TargetPersona) => {
    let count = 0;
    connections.forEach(c => {
      const searchString = `${c.role || ''} ${c.notes || ''}`.toLowerCase();
      if (!searchString.trim()) return;
      let score = 0;
      if (p.roles.length > 0 && p.roles.some(r => searchString.includes(r.toLowerCase()))) score += p.weights.role;
      if (p.skills.length > 0) {
        let skillMatchCount = 0;
        p.skills.forEach(s => { if (searchString.includes(s.toLowerCase())) skillMatchCount++; });
        if (skillMatchCount > 0) score += p.weights.skills * Math.min(1, skillMatchCount / Math.max(1, p.skills.length - 1));
      }
      if (score >= 40) count++; // Consider it a valid match if score >= 40
    });
    return count;
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* The Configuration Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
        <div className="absolute top-4 right-5">
           <button type="button" onClick={handleCreateNew} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">+ New Radar</button>
        </div>

        <div className="pr-20">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Radar Profile Name</label>
          <input 
            type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full text-sm font-black bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800"
            placeholder="e.g. Tech Founders in AI" required
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => applyPreset('Recruiter')} className="flex-1 text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">🎯 Recruiter</button>
          <button type="button" onClick={() => applyPreset('Founder')} className="flex-1 text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 py-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors">👔 Founder</button>
          <button type="button" onClick={() => applyPreset('Tech')} className="flex-1 text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">💻 Tech Talent</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Intent</label>
            <div className="relative">
              <select value={formData.intent} onChange={e => setFormData({...formData, intent: e.target.value as any})} className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer">
                <option value="Job Seeking">🚀 Job Seeking</option><option value="Hiring">🤝 Hiring</option><option value="B2B Sales">💼 B2B Sales</option><option value="Networking">🌐 Networking</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry</label>
            <div className="relative">
              <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer">
                <option>Tech</option><option>Startups</option><option>Finance</option><option>Healthcare</option><option>Any</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Roles</label>
          <TagInput tags={formData.roles} setTags={(t) => setFormData({...formData, roles: t})} placeholder="Recruiter, Manager, Founder..." icon={Briefcase} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Required Skills / Keywords</label>
          <TagInput tags={formData.skills} setTags={(t) => setFormData({...formData, skills: t})} placeholder="React, Hiring, Startups..." icon={Zap} />
        </div>

        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 shadow-inner">
          <h3 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 mb-3">
            <SlidersHorizontal size={14} className="text-slate-500" /> Priority Weighting Engine
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <WeightSlider label="Role Importance" value={formData.weights.role} onChange={(v) => setFormData({...formData, weights: {...formData.weights, role: v}})} />
            <WeightSlider label="Skills Importance" value={formData.weights.skills} onChange={(v) => setFormData({...formData, weights: {...formData.weights, skills: v}})} />
            <WeightSlider label="Industry" value={formData.weights.industry} onChange={(v) => setFormData({...formData, weights: {...formData.weights, industry: v}})} />
            <WeightSlider label="Location" value={formData.weights.location} onChange={(v) => setFormData({...formData, weights: {...formData.weights, location: v}})} />
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <button type="button" onClick={(e) => handleSave(e, false)} className={`flex-1 font-bold py-2.5 rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
            {saved ? <><CheckCircle2 size={16} /> Saved</> : <><Save size={16} /> Update Profile</>}
          </button>
          <button type="button" onClick={(e) => handleSave(e, true)} className="flex-1 font-bold py-2.5 rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
            <Library size={16} /> Save as New
          </button>
        </div>
      </form>

      {/* Accordion Library List */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
         <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center gap-2">
            <Library size={16} className="text-indigo-600" />
            <h2 className="font-bold text-[13px] text-slate-800">Saved Radar Profiles</h2>
            <span className="ml-auto text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{savedPersonas.length}</span>
         </div>
         
         <div className="flex flex-col">
            {savedPersonas.map((p) => {
              const isExpanded = expandedId === p.id;
              const isActive = activePersonaId === p.id;
              const matches = countMatches(p);

              return (
                <div key={p.id} className="border-b border-slate-100 last:border-0 relative">
                  {/* Collapsed Bar */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${isActive ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-indigo-500 ring-4 ring-indigo-100' : 'bg-slate-300'}`}></div>
                    
                    <div className="flex-1 flex flex-col">
                       <span className={`font-bold text-[13px] ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{p.name}</span>
                       <span className="text-[10px] text-slate-500 font-medium">{p.intent} • {p.industry}</span>
                    </div>

                    <div className="flex items-center gap-3">
                       <div className="flex flex-col items-end">
                         <span className="text-[10px] font-bold text-emerald-600">{matches} Matched</span>
                         <span className="text-[9px] text-slate-400">Total Connections</span>
                       </div>
                       <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-3 px-8 text-xs flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Roles</span>
                            <div className="flex flex-wrap gap-1">
                              {p.roles.slice(0, 3).map(r => <span key={r} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">{r}</span>)}
                              {p.roles.length > 3 && <span className="text-[10px] text-slate-500">+{p.roles.length - 3}</span>}
                              {p.roles.length === 0 && <span className="text-[10px] text-slate-400 italic">None</span>}
                            </div>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {p.skills.slice(0, 3).map(s => <span key={s} className="bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-indigo-700">{s}</span>)}
                              {p.skills.length > 3 && <span className="text-[10px] text-slate-500">+{p.skills.length - 3}</span>}
                              {p.skills.length === 0 && <span className="text-[10px] text-slate-400 italic">None</span>}
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200/60">
                          <button onClick={(e) => handleDelete(p.id, e)} className="text-[10px] font-bold text-red-500 hover:text-red-700 px-2 py-1 flex items-center gap-1">
                            <Trash2 size={12} /> Delete
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setFormData(p); setExpandedId(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm flex items-center gap-1">
                            <Edit2 size={12} /> Edit
                          </button>
                          {!isActive && (
                            <button onClick={(e) => { e.stopPropagation(); updatePersonas(savedPersonas, p.id); }} className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded shadow-sm flex items-center gap-1">
                              <Radar size={12} /> Activate Filter
                            </button>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded flex items-center gap-1">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              )
            })}
         </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Connections List (CRM) Component with Intelligent Scoring
function ConnectionsList({ connections, onDelete, onUpdate, onAdd, profile, targetPersona }: { connections: Connection[], onDelete: (id: string) => void, onUpdate: (id: string, updates: Partial<Connection>) => void, onAdd: (c: Connection) => void, profile: UserProfile, targetPersona: TargetPersona }) {
  const [showAddForm, setShowAddForm] = useState(false);

  if (connections.length === 0 && !showAddForm) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-10">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner ring-1 ring-indigo-100/50">
          <Search size={28} />
        </div>
        <div>
          <h3 className="font-bold text-[15px] text-slate-800">No connections found</h3>
          <p className="text-slate-500 text-sm max-w-[300px] mt-1.5 leading-relaxed">Browse LinkedIn, corporate websites, or Google Maps to start auto-extracting leads.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all shadow-sm">
           + Add Manually
        </button>
      </div>
    );
  }

  const analyzeConnection = (c: Connection) => {
    let score = 0;
    const searchString = `${c.role || ''} ${c.notes || ''}`.toLowerCase();
    const breakdown = { roles: [] as string[], skills: [] as string[], profile: [] as string[], total: 0 };
    
    if (!searchString.trim()) return { score: 0, breakdown };
    
    if (targetPersona.roles.length > 0) {
      let roleMatched = false;
      targetPersona.roles.forEach(r => {
        if (searchString.includes(r.toLowerCase())) { roleMatched = true; breakdown.roles.push(r); }
      });
      if (roleMatched) score += targetPersona.weights.role;
    }

    if (targetPersona.skills.length > 0) {
      let skillMatchCount = 0;
      targetPersona.skills.forEach(s => {
        if (searchString.includes(s.toLowerCase())) { skillMatchCount++; breakdown.skills.push(s); }
      });
      if (skillMatchCount > 0) {
        score += targetPersona.weights.skills * Math.min(1, skillMatchCount / Math.max(1, targetPersona.skills.length - 1));
      }
    }

    const pSkills = profile.skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    pSkills.forEach(s => {
      if (searchString.includes(s)) { score += 10; breakdown.profile.push(s); }
    });

    if (c.email || c.phone) score += 5;

    const finalScore = Math.min(Math.round(score), 100);
    breakdown.total = finalScore;
    
    return { score: finalScore, breakdown };
  };

  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      if (hostname.includes('linkedin')) return { name: 'LinkedIn', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      if (hostname.includes('google')) return { name: 'Google', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      return { name: hostname, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    } catch {
      return { name: 'Website', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const scoredConnections = connections.map(c => ({ ...c, ...analyzeConnection(c) }));
  const sortedConnections = scoredConnections.sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-3">
      {/* Target Active Info Bar */}
      <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-bold px-3 py-2 rounded-lg flex items-center justify-between shadow-sm">
         <span className="flex items-center gap-1.5"><Radar size={12} className="text-indigo-500" /> Active Radar: {targetPersona.name}</span>
         <div className="flex items-center gap-3">
             <span className="text-indigo-500 font-medium hidden sm:inline">Auto-sorting {connections.length} leads</span>
             <button onClick={() => setShowAddForm(!showAddForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition flex items-center gap-1">
                 {showAddForm ? 'Cancel' : '+ Add Lead'}
             </button>
         </div>
      </div>
      
      {showAddForm && <AddConnectionForm onAdd={(c) => { onAdd(c); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} />}

      {sortedConnections.map(c => {
        const domain = getDomain(c.url);
        
        return (
          <div key={c.id} className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-visible flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
            
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/50 flex items-center justify-center font-bold text-indigo-700 text-sm shadow-inner flex-shrink-0">
                  {c.isBusiness ? <Briefcase size={16} className="text-indigo-600" /> : (c.name ? c.name.substring(0, 2).toUpperCase() : '??')}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[15px] flex flex-wrap items-center gap-2 leading-none mb-1.5">
                    {c.name || 'Unknown Contact'}
                    {c.isBusiness && <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-slate-200">B2B</span>}
                    {c.score >= 40 && <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-indigo-200 shadow-sm flex items-center gap-1">🎯 Target Detected</span>}
                  </div>
                  {c.role && <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] mb-1.5" title={c.role}>{c.role}</div>}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-bold uppercase tracking-wider flex items-center gap-1 ${domain.color}`}>
                      <Globe size={8} /> {domain.name}
                    </span>
                    <div className="relative group/exptag">
                      <select 
                         value={c.careerStage || ''} 
                         onChange={e => onUpdate(c.id, { careerStage: e.target.value as any })}
                         className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider appearance-none cursor-pointer pr-4 border ${c.careerStage === 'Experienced' ? 'bg-amber-50 text-amber-700 border-amber-200' : c.careerStage === 'Fresher' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.careerStage === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      >
                         <option value="">Exp = ?</option>
                         <option value="Student">Student</option>
                         <option value="Fresher">Fresher</option>
                         <option value="Experienced">Experienced</option>
                      </select>
                      <ChevronDown size={8} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                    {c.careerStage === 'Experienced' && (
                       <div className="flex items-center gap-1">
                         <input 
                           type="number" 
                           value={c.totalYearsExp || ''} 
                           onChange={e => onUpdate(c.id, { totalYearsExp: Number(e.target.value) })}
                           className="w-10 text-[9px] font-bold bg-white border border-slate-200 text-slate-700 px-1 py-0.5 rounded outline-none focus:border-amber-400 text-center shadow-sm" 
                           placeholder="Yrs" min="0"
                         />
                         <span className="text-[9px] text-slate-400 font-medium">Yrs</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1.5">
                <div className="relative group/dropdown">
                  <select 
                    value={c.status || 'Lead'}
                    onChange={(e) => onUpdate(c.id, { status: e.target.value as any })}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md border-0 ring-1 ring-inset appearance-none pr-6 cursor-pointer transition-colors ${
                      c.status === 'VIP' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100' : 
                      c.status === 'Contacted' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100' : 
                      c.status === 'Ignore' ? 'bg-slate-100 text-slate-600 ring-slate-300/50 hover:bg-slate-200' :
                      'bg-blue-50 text-blue-700 ring-blue-600/20 hover:bg-blue-100'
                    }`}
                  >
                    <option value="Lead">🔵 Lead</option>
                    <option value="Contacted">🟢 Contacted</option>
                    <option value="VIP">⭐ VIP</option>
                    <option value="Ignore">⚪ Ignore</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-[5px] pointer-events-none text-current opacity-60" />
                </div>
                
                {c.score > 0 && (
                  <div className="relative group/score">
                    <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm cursor-help ${
                      c.score >= 80 ? 'bg-emerald-500 text-white' : 
                      c.score >= 40 ? 'bg-amber-400 text-amber-900' : 
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {c.score >= 80 ? '🔥' : c.score >= 40 ? '⭐' : '⚪'} {c.score}% Match
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 p-3 opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all z-20">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                        <Info size={12} /> Match Breakdown
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Role Match:</span>
                          <span className={c.breakdown.roles.length ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            {c.breakdown.roles.length ? '✔' : '✘'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Target Skills:</span>
                          <span className={c.breakdown.skills.length ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            {c.breakdown.skills.length} matched
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-700 pt-1.5">
                          <span className="text-slate-300">My Profile Alignment:</span>
                          <span className={c.breakdown.profile.length ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            {c.breakdown.profile.length} shared
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {(c.email || c.phone) && (
              <div className="grid grid-cols-2 gap-2 mt-1 relative z-0">
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Mail size={12} className="text-slate-400" />
                    <span className="truncate" title={c.email}>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Phone size={12} className="text-slate-400" />
                    <span className="truncate">{c.phone}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="relative mt-1 z-0">
              <textarea 
                placeholder="Add personal notes or skills..." 
                value={c.notes || ''}
                onChange={(e) => onUpdate(c.id, { notes: e.target.value })}
                className="w-full text-xs text-slate-600 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 px-3 py-2 outline-none transition-all placeholder:text-slate-400 resize-none h-12"
              />
            </div>

            <div className="flex justify-between items-center mt-0.5 pt-2.5 border-t border-slate-100 z-0">
              <a href={c.url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold hover:underline flex items-center gap-1.5">
                <ExternalLink size={12} /> Open Profile
              </a>
              <button onClick={() => onDelete(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1">
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ATSMatcher({ profile }: { profile: UserProfile }) {
  const [jobDesc, setJobDesc] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<{found: string[], missing: string[], reqExp: number, hasRequiredExp: boolean} | null>(null);

  const analyzeATS = () => {
    if (!jobDesc.trim()) return;
    
    const userSkills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
    const commonKeywords = ['react', 'typescript', 'javascript', 'node', 'python', 'sql', 'aws', 'agile', 'management', 'leadership', 'design', 'figma', 'next', 'tailwind', 'api', 'docker'];
    
    const jdFuse = new Fuse([jobDesc], { includeScore: true, threshold: 0.3 });
    const requiredKeywords = commonKeywords.filter(k => jdFuse.search(k).length > 0);
    
    // Experience Parsing Logic
    let reqExp = 0;
    const expMatch = jobDesc.match(/(\d+)(?:\s*-\s*\d+)?\+?\s*(?:years?|yrs?)/i);
    if (expMatch && expMatch[1]) {
       reqExp = parseInt(expMatch[1], 10);
    } else if (jdFuse.search('fresher').length > 0 || jdFuse.search('entry level').length > 0) {
       reqExp = 0;
    }

    const hasRequiredExp = (profile.totalYearsExp || 0) >= reqExp;
    let expScorePenalty = 0;
    if (reqExp > 0 && !hasRequiredExp) {
       expScorePenalty = Math.min(45, (reqExp - (profile.totalYearsExp || 0)) * 15);
    }

    if (requiredKeywords.length === 0 && reqExp === 0) {
      setScore(0); setAnalysis({ found: [], missing: [], reqExp: 0, hasRequiredExp: true }); return;
    }
    
    const found: string[] = [];
    const missing: string[] = [];
    
    // User skills can be matched fuzzily against JD keywords
    const userSkillsFuse = new Fuse(userSkills, { includeScore: true, threshold: 0.4 });
    const fullExpText = profile.experienceHistory.map(e => `${e.company} ${e.jobProfile}`).join(' ');
    const userContextFuse = new Fuse([fullExpText], { includeScore: true, threshold: 0.3 });

    requiredKeywords.forEach(req => {
      // Is the required keyword present in the user's explicit skills?
      const matchInSkills = userSkillsFuse.search(req).length > 0;
      // Is it present anywhere in their job history?
      const matchInContext = userContextFuse.search(req).length > 0;
      
      if (matchInSkills || matchInContext) found.push(req); 
      else missing.push(req);
    });
    
    let baseScore = requiredKeywords.length > 0 ? Math.round((found.length / requiredKeywords.length) * 100) : 100;
    const finalScore = Math.max(0, baseScore - expScorePenalty);
    
    setScore(finalScore); 
    setAnalysis({ found, missing, reqExp, hasRequiredExp });
  };

  return (
    <div className="flex flex-col gap-3 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
        <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-500 shrink-0 ring-1 ring-violet-100">
            <Target size={20} />
          </div>
          <div>
            <h2 className="font-bold text-[15px] text-slate-800 leading-tight">ATS Compatibility Analyzer</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Paste a job description to check your keyword match.</p>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <textarea className="w-full min-h-[120px] border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none resize-y transition-all placeholder:text-slate-400" placeholder="Paste the job description here..." value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} />
          <button onClick={analyzeATS} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2 active:scale-[0.98]">
            <Search size={14} /> Analyze Match Score
          </button>
        </div>
      </div>
      
      {score !== null && analysis && (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-slate-50 shadow-sm ring-1 ring-slate-200">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-200" />
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className={score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'} strokeDasharray={`${(score / 100) * 150} 150`} strokeLinecap="round" />
              </svg>
              <span className={`relative text-sm font-black ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Compatibility Score</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {score >= 80 ? 'Great match! You are highly compatible.' : score >= 50 ? 'Fair match. Consider adding missing keywords.' : 'Low match. Tailor your resume for this role.'}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {analysis.reqExp > 0 && (
              <div className={`p-2.5 rounded-lg border ${analysis.hasRequiredExp ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} flex items-center gap-2`}>
                {analysis.hasRequiredExp ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                <div className="flex flex-col">
                   <span className={`text-[11px] font-bold ${analysis.hasRequiredExp ? 'text-emerald-800' : 'text-amber-800'}`}>Experience Check</span>
                   <span className={`text-[10px] ${analysis.hasRequiredExp ? 'text-emerald-600' : 'text-amber-700'}`}>
                     Required: {analysis.reqExp}+ years | You have: {profile.totalYearsExp || 0} years
                   </span>
                </div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CheckCircle2 size={12} /> Found Keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.found.length > 0 ? analysis.found.map(k => <span key={k} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold capitalize border border-emerald-100 shadow-sm">{k}</span>) : <span className="text-xs text-slate-400 italic">None found</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><AlertCircle size={12} /> Missing Keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missing.length > 0 ? analysis.missing.map(k => <span key={k} className="bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-200 text-[10px] font-bold capitalize shadow-sm">{k}</span>) : <span className="text-xs text-slate-400 italic">Perfect match! No keywords missing.</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileForm({ profile, onSave }: { profile: UserProfile, onSave: (p: UserProfile) => void }) {
  const [formData, setFormData] = useState(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!formData.careerStage) {
      setFormData(prev => ({ ...prev, careerStage: 'Fresher', experienceHistory: [], totalYearsExp: 0 }));
    }
  }, []);

  const handleExpChange = (index: number, field: string, value: any) => {
    const newHistory = [...(formData.experienceHistory || [])];
    newHistory[index] = { ...newHistory[index], [field]: value };
    const total = newHistory.reduce((sum, item) => sum + (Number(item.yearsOfExp) || 0), 0);
    setFormData({ ...formData, experienceHistory: newHistory, totalYearsExp: total });
  };

  const addExp = () => {
    const newHistory = [...(formData.experienceHistory || []), { company: '', jobProfile: '', yearsOfExp: 0 }];
    setFormData({ ...formData, experienceHistory: newHistory });
  };

  const removeExp = (index: number) => {
    const newHistory = (formData.experienceHistory || []).filter((_, i) => i !== index);
    const total = newHistory.reduce((sum, item) => sum + (Number(item.yearsOfExp) || 0), 0);
    setFormData({ ...formData, experienceHistory: newHistory, totalYearsExp: total });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); onSave(formData); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
          <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" placeholder="Jane Doe" /></div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
          <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" /></div>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
        <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CV Link</label>
          <div className="relative"><LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="url" value={formData.cvLink} onChange={e => setFormData({...formData, cvLink: e.target.value})} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" /></div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Portfolio / LinkedIn</label>
          <div className="relative"><LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="url" value={formData.portfolio} onChange={e => setFormData({...formData, portfolio: e.target.value})} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
        <div>
           <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Career Stage</label>
           <div className="relative">
             <select value={formData.careerStage || 'Fresher'} onChange={e => setFormData({...formData, careerStage: e.target.value as any})} className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer">
               <option value="Student">🎓 Student</option>
               <option value="Fresher">🌱 Fresher</option>
               <option value="Experienced">💼 Experienced</option>
             </select>
             <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
           </div>
        </div>
        {formData.careerStage === 'Experienced' && (
           <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Experience</label>
             <div className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-200">{formData.totalYearsExp || 0} Years</div>
           </div>
        )}
      </div>
      
      {formData.careerStage === 'Experienced' && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience History</label>
            <button type="button" onClick={addExp} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">+ Add Role</button>
          </div>
          {(formData.experienceHistory || []).map((exp, i) => (
             <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
               <input type="text" placeholder="Company" value={exp.company} onChange={e => handleExpChange(i, 'company', e.target.value)} className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400 focus:bg-white" />
               <input type="text" placeholder="Role" value={exp.jobProfile} onChange={e => handleExpChange(i, 'jobProfile', e.target.value)} className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400 focus:bg-white" />
               <input type="number" placeholder="Yrs" value={exp.yearsOfExp} onChange={e => handleExpChange(i, 'yearsOfExp', Number(e.target.value))} className="w-14 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-center focus:border-indigo-400 focus:bg-white" min="0" step="0.5" />
               <button type="button" onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
             </div>
          ))}
          {(!formData.experienceHistory || formData.experienceHistory.length === 0) && <div className="text-[10px] text-slate-400 italic text-center py-2">No experience added. Click + Add Role.</div>}
        </div>
      )}

      <div className="border-t border-slate-100 pt-4 mt-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
          <span>Core Skills</span><span className="text-[9px] text-indigo-500 normal-case bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">Used for CRM Aligning</span>
        </label>
        <textarea value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none h-16 placeholder:text-slate-300" placeholder="React, Next.js, Project Management, Agile..." />
      </div>
      <button type="submit" className={`mt-2 w-full font-bold py-2.5 rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
        {saved ? <><CheckCircle2 size={16} /> Profile Saved</> : <><Save size={16} /> Save Profile Information</>}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Add Connection Form Component
// ---------------------------------------------------------------------------
function AddConnectionForm({ onAdd, onCancel }: { onAdd: (c: Connection) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState<Partial<Connection>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    url: '',
    notes: '',
    status: 'Lead',
    careerStage: undefined,
    totalYearsExp: undefined,
    isBusiness: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && !formData.role && !formData.email) {
       alert("Please fill at least a Name, Role, or Email to add a lead.");
       return;
    }
    const newConnection: Connection = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      url: formData.url || 'manual_entry',
      ...formData as any
    };
    onAdd(newConnection);
  };

  return (
    <div className="bg-white border border-indigo-200 p-4 rounded-xl shadow-sm relative animate-in fade-in slide-in-from-top-2">
      <h3 className="font-bold text-slate-800 text-sm mb-3">Add Lead Manually</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Name</label>
            <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Role / Title</label>
            <input type="text" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Software Engineer" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="john@example.com" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
            <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="+1 234 567 8900" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer">
              <option value="Lead">Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="VIP">VIP</option>
              <option value="Ignore">Ignore</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Career Stage</label>
            <select value={formData.careerStage || ''} onChange={e => setFormData({ ...formData, careerStage: e.target.value as any || undefined })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer">
              <option value="">Unknown</option>
              <option value="Student">Student</option>
              <option value="Fresher">Fresher</option>
              <option value="Experienced">Experienced</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Years Exp</label>
            <input type="number" min="0" max="50" value={formData.totalYearsExp || ''} onChange={e => setFormData({ ...formData, totalYearsExp: e.target.value ? parseInt(e.target.value, 10) : undefined })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. 5" disabled={formData.careerStage && formData.careerStage !== 'Experienced'} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Profile URL / Link</label>
          <input type="text" value={formData.url || ''} onChange={e => setFormData({ ...formData, url: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="https://linkedin.com/in/johndoe" />
        </div>
        
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Notes / Skills</label>
          <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all custom-scrollbar resize-none" placeholder="React, Node.js, great communication skills..." rows={2}></textarea>
        </div>
        
        <div className="flex gap-2 justify-end mt-2">
          <button type="button" onClick={onCancel} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
          <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
            <Save size={12} /> Save Lead
          </button>
        </div>
      </form>
    </div>
  );
}

