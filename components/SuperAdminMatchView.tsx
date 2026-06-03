'use client';

import { motion } from 'framer-motion';

interface Match {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  matched_id: string;
  matched_name: string;
  matched_email: string;
}

interface SuperAdminMatchViewProps {
  matches: Match[];
}

export default function SuperAdminMatchView({
  matches,
}: SuperAdminMatchViewProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No matches yet. Participants need to spin the wheel first.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-red-100 via-white to-green-100 dark:from-red-900 dark:via-gray-800 dark:to-green-900">
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-gray-800 dark:text-white font-semibold">
              Participant
            </th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-gray-800 dark:text-white font-semibold">
              Email
            </th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-gray-800 dark:text-white font-semibold">
              →
            </th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-gray-800 dark:text-white font-semibold">
              Matched With
            </th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-gray-800 dark:text-white font-semibold">
              Matched Email
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => (
            <motion.tr
              key={match.participant_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-white font-medium">
                {match.participant_name}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                {match.participant_email}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-2xl">
                🎁
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-white font-medium">
                {match.matched_name}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                {match.matched_email}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

