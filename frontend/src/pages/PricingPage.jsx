import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../context/authStore';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 Resume', 'Classic Template', 'ATS Score Check', 'PDF Download'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    features: ['Unlimited Resumes', 'All 3 Templates', 'AI Bullet Rewriter', 'Full ATS Optimization', 'Cover Letter Generator', 'Resume Dashboard', 'Priority Support'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
];

export default function PricingPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!token) { navigate('/register'); return; }
    setLoading(true);
    try {
      const res = await api.post('/payment/create-checkout-session');
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Simple Pricing</h1>
      <p className="text-gray-500 mb-10">Start free, upgrade when you're ready</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        {plans.map((plan) => (
          <div key={plan.name}
            className={`rounded-2xl p-8 ${plan.highlight ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-white border shadow-md'}`}>
            <h2 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-800'}`}>{plan.name}</h2>
            <div className="flex items-end gap-1 mb-6">
              <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-800'}`}>{plan.price}</span>
              <span className={`text-sm mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>/{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check size={14} className={plan.highlight ? 'text-indigo-200' : 'text-green-500'} />
                  <span className={plan.highlight ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={plan.name === 'Pro' ? handleUpgrade : () => navigate(token ? '/dashboard' : '/register')}
              disabled={loading && plan.name === 'Pro'}
              className={`w-full py-3 rounded-xl font-semibold text-sm ${
                plan.highlight
                  ? 'bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}>
              {loading && plan.name === 'Pro' ? 'Redirecting...' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
