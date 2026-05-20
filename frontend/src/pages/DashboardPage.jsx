import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FileText, Trash2, Edit, Download, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import useResumeStore from '../context/resumeStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, logout } = useAuthStore();
  const { resumes, fetchResumes, deleteResume, downloadPDF, isLoading } = useResumeStore();

  useEffect(() => {
    fetchResumes();
    if (params.get('upgraded') === 'true') {
      toast.success('🎉 Welcome to Pro! All features unlocked.');
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    await deleteResume(id);
    toast.success('Resume deleted');
  };

  const handleNewResume = async () => {
    navigate('/builder');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-700">CareerForge Pro</h1>
        <div className="flex items-center gap-4">
          {user?.plan === 'pro' && (
            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-semibold">
              <Crown size={12} /> Pro
            </span>
          )}
          <span className="text-sm text-gray-600">Hello, {user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-sm text-gray-500 hover:text-red-500">Logout</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Plan banner */}
        {user?.plan === 'free' && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-indigo-700">You are on the Free plan</p>
              <p className="text-sm text-indigo-500">1 resume max • No cover letters • Classic template only</p>
            </div>
            <button onClick={() => navigate('/pricing')}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
              Upgrade to Pro
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Resumes</h2>
          <button onClick={handleNewResume}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 font-semibold">
            <Plus size={16} /> New Resume
          </button>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-400 py-20">Loading...</p>
        ) : resumes.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No resumes yet. Create your first one!</p>
            <button onClick={handleNewResume}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Create Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <div key={resume._id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{resume.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {resume.personalInfo?.fullName || 'Untitled'} • {resume.template}
                    </p>
                    {resume.atsScore > 0 && (
                      <span className={`text-xs font-bold mt-2 inline-block px-2 py-0.5 rounded-full ${
                        resume.atsScore >= 70 ? 'bg-green-100 text-green-700' :
                        resume.atsScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>ATS Score: {resume.atsScore}%</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/builder/${resume._id}`)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => downloadPDF(resume._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Download PDF">
                      <Download size={16} />
                    </button>
                    <button onClick={() => handleDelete(resume._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-300 mt-3">
                  Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
