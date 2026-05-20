import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Save, Download, Wand2, ArrowLeft } from 'lucide-react';
import useResumeStore from '../context/resumeStore';
import useAuthStore from '../context/authStore';
import api from '../utils/api';

const defaultResume = {
  title: 'My Resume',
  template: 'classic',
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
};

export default function ResumeBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchResume, createResume, updateResume, downloadPDF } = useResumeStore();

  const [resume, setResume] = useState(defaultResume);
  const [jd, setJD] = useState('');
  const [atsScore, setATSScore] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [aiLoading, setAILoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResume(id).then(setResume);
    }
  }, [id]);

  const update = (path, value) => {
    const keys = path.split('.');
    setResume((prev) => {
      const next = { ...prev };
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await updateResume(id, resume);
        toast.success('Saved!');
      } else {
        const created = await createResume(resume);
        navigate(`/builder/${created._id}`, { replace: true });
        toast.success('Resume created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const handleOptimize = async () => {
    if (!jd) { toast.error('Paste a job description first'); return; }
    if (!id) { toast.error('Save your resume first'); return; }
    setAILoading(true);
    try {
      const res = await api.post(`/ai/optimize-resume/${id}`, { jobDescription: jd });
      setResume(res.data.resume);
      setATSScore(res.data.atsScore);
      setKeywords(res.data.resume.extractedKeywords || []);
      toast.success(`Resume optimized! ATS Score: ${res.data.atsScore}%`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Optimization failed');
    }
    setAILoading(false);
  };

  const addExperience = () => {
    setResume((r) => ({ ...r, experience: [...r.experience, { company: '', role: '', startDate: '', endDate: '', current: false, bullets: [''] }] }));
  };

  const addEducation = () => {
    setResume((r) => ({ ...r, education: [...r.education, { institution: '', degree: '', field: '', startDate: '', endDate: '' }] }));
  };

  const templates = ['classic', 'modern', 'minimal'];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <h1 className="font-bold text-indigo-700">Resume Builder</h1>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
          {id && (
            <button onClick={() => downloadPDF(id)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              <Download size={14} /> PDF
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form */}
        <div className="w-1/2 overflow-y-auto p-6 space-y-4">
          {/* Template Selector */}
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">Template</p>
            <div className="flex gap-2">
              {templates.map((t) => (
                <button key={t} onClick={() => update('template', t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize ${
                    resume.template === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500'
                  } ${t !== 'classic' && user?.plan !== 'pro' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={t !== 'classic' && user?.plan !== 'pro'}>
                  {t} {t !== 'classic' && user?.plan !== 'pro' ? '🔒' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-2">
            {['personal', 'experience', 'education', 'skills', 'ai'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Personal Info */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-gray-700">Personal Information</h3>
              {['fullName', 'email', 'phone', 'location', 'linkedin', 'github'].map((field) => (
                <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={resume.personalInfo[field] || ''}
                  onChange={(e) => update(`personalInfo.${field}`, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              ))}
              <textarea placeholder="Professional Summary" rows={3}
                value={resume.personalInfo.summary || ''}
                onChange={(e) => update('personalInfo.summary', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          )}

          {/* Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-3">
              {resume.experience.map((exp, i) => (
                <div key={i} className="bg-white rounded-xl p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Role/Title" value={exp.role || ''}
                      onChange={(e) => { const a = [...resume.experience]; a[i].role = e.target.value; update('experience', a); }}
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <input placeholder="Company" value={exp.company || ''}
                      onChange={(e) => { const a = [...resume.experience]; a[i].company = e.target.value; update('experience', a); }}
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <input placeholder="Start Date" value={exp.startDate || ''}
                      onChange={(e) => { const a = [...resume.experience]; a[i].startDate = e.target.value; update('experience', a); }}
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <input placeholder="End Date or Present" value={exp.endDate || ''}
                      onChange={(e) => { const a = [...resume.experience]; a[i].endDate = e.target.value; update('experience', a); }}
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  {(exp.bullets || []).map((b, j) => (
                    <input key={j} placeholder={`Bullet point ${j + 1}`} value={b}
                      onChange={(e) => { const a = [...resume.experience]; a[i].bullets[j] = e.target.value; update('experience', a); }}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  ))}
                  <button onClick={() => { const a = [...resume.experience]; a[i].bullets.push(''); update('experience', a); }}
                    className="text-xs text-indigo-600 hover:underline">+ Add Bullet</button>
                </div>
              ))}
              <button onClick={addExperience}
                className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-2 rounded-xl text-sm hover:bg-indigo-50">
                + Add Experience
              </button>
            </div>
          )}

          {/* Education */}
          {activeTab === 'education' && (
            <div className="space-y-3">
              {resume.education.map((edu, i) => (
                <div key={i} className="bg-white rounded-xl p-4 grid grid-cols-2 gap-2">
                  {['institution', 'degree', 'field', 'startDate', 'endDate', 'gpa'].map((f) => (
                    <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={edu[f] || ''}
                      onChange={(e) => { const a = [...resume.education]; a[i][f] = e.target.value; update('education', a); }}
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  ))}
                </div>
              ))}
              <button onClick={addEducation}
                className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-2 rounded-xl text-sm hover:bg-indigo-50">
                + Add Education
              </button>
            </div>
          )}

          {/* Skills */}
          {activeTab === 'skills' && (
            <div className="bg-white rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-600 mb-2">Skills (comma-separated)</p>
              <textarea rows={4}
                placeholder="React, Node.js, MongoDB, Python, Docker..."
                value={(resume.skills || []).join(', ')}
                onChange={(e) => update('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          )}

          {/* AI Optimizer */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Wand2 size={16} className="text-indigo-600" /> AI Optimizer
              </h3>
              <textarea rows={6} placeholder="Paste the Job Description here..."
                value={jd} onChange={(e) => setJD(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <button onClick={handleOptimize} disabled={aiLoading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Wand2 size={15} /> {aiLoading ? 'Optimizing...' : 'Optimize for this JD'}
              </button>
              {atsScore !== null && (
                <div>
                  <div className={`text-center font-bold text-2xl ${atsScore >= 70 ? 'text-green-600' : atsScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    ATS Score: {atsScore}%
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keywords.map((kw) => (
                      <span key={kw.keyword} className={`text-xs px-2 py-1 rounded-full ${kw.found ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                        {kw.found ? '✓' : '✗'} {kw.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="w-1/2 bg-gray-200 overflow-y-auto p-6">
          <div className="bg-white shadow-lg rounded-xl min-h-full p-8 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            {resume.personalInfo.fullName ? (
              <>
                <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', margin: 0 }}>{resume.personalInfo.fullName}</h1>
                <p style={{ color: '#555', fontSize: 12, margin: '4px 0 16px' }}>
                  {[resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location].filter(Boolean).join(' | ')}
                </p>
                {resume.personalInfo.summary && <p style={{ lineHeight: 1.6, marginBottom: 12 }}>{resume.personalInfo.summary}</p>}
                {resume.experience.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '2px solid #1a1a2e', paddingBottom: 4, marginTop: 16 }}>Experience</h2>
                    {resume.experience.map((e, i) => (
                      <div key={i} style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span>{e.role}</span><span style={{ color: '#555', fontSize: 11 }}>{e.startDate} – {e.current ? 'Present' : e.endDate}</span>
                        </div>
                        <div style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>{e.company}</div>
                        <ul style={{ paddingLeft: 16, margin: '4px 0' }}>
                          {(e.bullets || []).filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: 2, lineHeight: 1.5 }}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </>
                )}
                {resume.education.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '2px solid #1a1a2e', paddingBottom: 4, marginTop: 16 }}>Education</h2>
                    {resume.education.map((e, i) => (
                      <div key={i} style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 'bold' }}>{e.degree}{e.field ? ` in ${e.field}` : ''}</div>
                        <div style={{ color: '#555', fontSize: 11 }}>{e.institution}</div>
                      </div>
                    ))}
                  </>
                )}
                {resume.skills.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '2px solid #1a1a2e', paddingBottom: 4, marginTop: 16 }}>Skills</h2>
                    <p style={{ color: '#333', lineHeight: 2 }}>{resume.skills.join(' • ')}</p>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 80, color: '#aaa' }}>
                <p>Fill in your details on the left to see the live preview here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
