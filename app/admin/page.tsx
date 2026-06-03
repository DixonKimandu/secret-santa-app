'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Turnstile from '@/components/Turnstile';

interface Participant {
  id: string;
  name: string;
  email: string;
  has_spun: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState(''); // Store password for API calls
  const [role, setRole] = useState<'admin' | 'superadmin' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    if (isAuthenticated && role) {
      fetchParticipants();
    }
  }, [isAuthenticated, role]);

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

      if (!response.ok || !data.role) {
        setError(data.error || 'Invalid password');
        return;
      }

      setRole(data.role);
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
      } else {
        setError('Failed to delete participant');
      }
    } catch (err) {
      setError('Failed to delete participant. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-3xl animate-pulse">🎄</div>
        <div className="absolute bottom-4 left-4 text-3xl animate-bounce">❄️</div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border-4 border-green-200 dark:border-green-800 relative z-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            🎅 Admin Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 dark:border-green-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter admin password"
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
              disabled={loading || !turnstileToken || !password.trim() || password.length === 0}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
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
      <div className="absolute top-4 right-4 text-3xl animate-pulse">🎄</div>
      <div className="absolute bottom-4 left-4 text-3xl animate-bounce">❄️</div>
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border-4 border-green-200 dark:border-green-800"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                🎅 Admin Panel
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Role: <span className="font-semibold capitalize">{role}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {role === 'superadmin' && (
                <button
                  onClick={() => router.push('/superadmin')}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all shadow-lg border-2 border-white"
                >
                  Superadmin View
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                Home
              </button>
            </div>
          </div>

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
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={addingParticipant}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
              >
                {addingParticipant ? 'Adding...' : 'Add'}
              </button>
            </form>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 dark:text-red-400 text-sm mt-2"
              >
                {error}
              </motion.p>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white">
              Participants ({participants.length})
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

