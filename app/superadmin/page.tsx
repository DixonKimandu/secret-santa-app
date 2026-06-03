'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SuperAdminMatchView from '@/components/SuperAdminMatchView';
import Turnstile from '@/components/Turnstile';

interface Participant {
  id: string;
  name: string;
  email: string;
  has_spun: boolean;
}

interface Match {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  matched_id: string;
  matched_name: string;
  matched_email: string;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState(''); // Store password for API calls
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeRole, setPasswordChangeRole] = useState<'admin' | 'superadmin'>('admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeToken, setPasswordChangeToken] = useState<string | null>(null);
  
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    if (isAuthenticated) {
      fetchParticipants();
      fetchMatches();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Please complete the verification challenge');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.role || data.role !== 'superadmin') {
        setError('Invalid superadmin password');
        return;
      }

      setIsAuthenticated(true);
      setStoredPassword(password); // Store password for API calls
      setPassword(''); // Clear the input field
    } catch (err) {
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/participants', {
        headers: {
          Authorization: `Bearer ${storedPassword}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches', {
        headers: {
          Authorization: `Bearer ${storedPassword}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setError('Name and email are required');
      return;
    }

    setAddingParticipant(true);
    setError('');

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedPassword}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add participant');
        return;
      }

      setNewName('');
      setNewEmail('');
      await fetchParticipants();
    } catch (err) {
      setError('Failed to add participant. Please try again.');
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) {
      return;
    }

    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${storedPassword}`,
        },
      });

      if (response.ok) {
        await fetchParticipants();
        await fetchMatches();
      } else {
        setError('Failed to delete participant');
      }
    } catch (err) {
      setError('Failed to delete participant. Please try again.');
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        'Are you sure you want to reset all matches? This action cannot be undone.'
      )
    ) {
      return;
    }

    setResetting(true);
    setError('');

    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${storedPassword}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to reset matches');
        return;
      }

      await fetchParticipants();
      await fetchMatches();
    } catch (err) {
      setError('Failed to reset matches. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordChangeToken) {
      setPasswordChangeError('Please complete the verification challenge');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    setPasswordChangeError('');

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedPassword}`,
        },
        body: JSON.stringify({
          currentPassword: passwordChangeRole === 'superadmin' ? storedPassword : undefined, // Only need current password for superadmin
          newPassword,
          role: passwordChangeRole,
          turnstileToken: passwordChangeToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordChangeError(data.error || 'Failed to change password');
        return;
      }

      // Success - update stored password if changing superadmin password
      if (passwordChangeRole === 'superadmin') {
        setStoredPassword(newPassword);
      }

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChangeToken(null);
      setShowPasswordChange(false);
      setPasswordChangeError('');
      alert('Password changed successfully!');
    } catch (err) {
      setPasswordChangeError('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-3xl animate-pulse">👑</div>
        <div className="absolute bottom-4 left-4 text-3xl animate-bounce">🎄</div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border-4 border-red-200 dark:border-red-800 relative z-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            👑 Superadmin Login
          </h1>
          <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Full access to all matches and controls
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Superadmin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter superadmin password"
                required
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.p>
            )}
            {turnstileSiteKey && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onVerify={(token) => setTurnstileToken(token)}
                  onError={() => {
                    setTurnstileToken(null);
                    setError('Verification failed. Please reload the page and try again.');
                  }}
                  onExpire={() => setTurnstileToken(null)}
                  theme="auto"
                  size="normal"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !turnstileToken || !password.trim()}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 text-3xl animate-pulse">👑</div>
      <div className="absolute bottom-4 left-4 text-3xl animate-bounce">🎄</div>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border-4 border-red-200 dark:border-red-800"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                👑 Superadmin Panel
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Full access to matches and controls
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg transition-all shadow-lg border-2 border-white"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white rounded-lg transition-all shadow-lg border-2 border-white"
              >
                {resetting ? 'Resetting...' : 'Reset All Matches'}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all shadow-lg border-2 border-white"
              >
                Admin View
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                Home
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg"
            >
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Password Change Section */}
          {showPasswordChange && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 md:mb-8 p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-xl border-2 border-yellow-300 dark:border-yellow-700"
            >
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-yellow-800 dark:text-yellow-200">
                🔐 Change Admin Password
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
                <div>
                  <label
                    htmlFor="passwordRole"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Select Role
                  </label>
                  <select
                    id="passwordRole"
                    value={passwordChangeRole}
                    onChange={(e) => setPasswordChangeRole(e.target.value as 'admin' | 'superadmin')}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 dark:border-yellow-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 dark:border-yellow-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 dark:border-yellow-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                {passwordChangeError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-600 dark:text-red-400 text-sm"
                  >
                    {passwordChangeError}
                  </motion.p>
                )}
                {turnstileSiteKey && (
                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={turnstileSiteKey}
                      onVerify={(token) => setPasswordChangeToken(token)}
                      onError={() => {
                        setPasswordChangeToken(null);
                        setPasswordChangeError('Verification failed. Please reload the page and try again.');
                      }}
                      onExpire={() => setPasswordChangeToken(null)}
                      theme="auto"
                      size="normal"
                    />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordChangeError('');
                      setPasswordChangeToken(null);
                    }}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      changingPassword ||
                      !passwordChangeToken ||
                      !newPassword.trim() ||
                      !confirmPassword.trim() ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 6
                    }
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white">
              Add Participant
            </h2>
            <form onSubmit={handleAddParticipant} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={addingParticipant}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
              >
                {addingParticipant ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white">
              All Matches ({matches.length})
            </h2>
            <SuperAdminMatchView matches={matches} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white">
              All Participants ({participants.length})
            </h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-800 dark:text-white">
                        Name
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-800 dark:text-white">
                        Email
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-800 dark:text-white">
                        Status
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-800 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {participants.map((participant) => (
                        <motion.tr
                          key={participant.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 dark:text-white">
                            {participant.name}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 dark:text-white break-all">
                            {participant.email}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 dark:text-white">
                            {participant.has_spun ? (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                                Spun
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-2">
                            <button
                              onClick={() => handleDeleteParticipant(participant.id)}
                              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
            {participants.length === 0 && (
              <p className="text-center py-8 text-gray-600 dark:text-gray-400">
                No participants yet. Add some above!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

