/**
 * ProfileModal Component - Financial Profile Editor
 * ============================================================================
 * This component allows users to view and edit their financial profile.
 * The profile data is stored in the Durable Object and used to personalize
 * AI responses.
 * ============================================================================
 */
import { useState, useEffect } from 'react';

interface FinancialProfile {
  monthlyIncome?: number;
  totalDebt?: number;
  savingsGoal?: number;
  emergencyFund?: number;
  financialGoals?: string[];
  lastUpdated?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = '';

function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<FinancialProfile>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  // Fetch profile on open
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProfile(data.profile || {});
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to save profile');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      financialGoals: [...(prev.financialGoals || []), newGoal.trim()],
    }));
    setNewGoal('');
  };

  const removeGoal = (index: number) => {
    setProfile(prev => ({
      ...prev,
      financialGoals: prev.financialGoals?.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cf-orange to-cf-orange-dark">
          <div>
            <h2 className="text-xl font-bold text-white">Financial Profile</h2>
            <p className="text-sm text-white/80">Help me personalize your advice</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin w-8 h-8 text-cf-orange" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Profile saved successfully!</span>
                </div>
              )}

              {/* Monthly Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Income (after taxes)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.monthlyIncome || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, monthlyIncome: Number(e.target.value) || undefined }))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Include part-time jobs, allowances, scholarships</p>
              </div>

              {/* Total Debt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Debt
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.totalDebt || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, totalDebt: Number(e.target.value) || undefined }))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Student loans, credit cards, etc.</p>
              </div>

              {/* Savings Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Savings Goal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.savingsGoal || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, savingsGoal: Number(e.target.value) || undefined }))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Emergency Fund */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Emergency Fund
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.emergencyFund || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, emergencyFund: Number(e.target.value) || undefined }))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Savings set aside for emergencies</p>
              </div>

              {/* Financial Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Financial Goals
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                    placeholder="Add a financial goal..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent"
                  />
                  <button
                    onClick={addGoal}
                    className="px-4 py-2 bg-cf-orange hover:bg-cf-orange-dark text-white rounded-xl transition-colors"
                  >
                    Add
                  </button>
                </div>
                {profile.financialGoals && profile.financialGoals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.financialGoals.map((goal, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        <span>{goal}</span>
                        <button
                          onClick={() => removeGoal(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No goals added yet</p>
                )}
              </div>

              {/* Last Updated */}
              {profile.lastUpdated && (
                <p className="text-xs text-gray-400 text-center">
                  Last updated: {new Date(profile.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-cf-orange to-cf-orange-dark hover:from-cf-orange-dark hover:to-cf-orange text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Profile</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
