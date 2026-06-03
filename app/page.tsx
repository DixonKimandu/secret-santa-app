'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Christmas decorations */}
      <div className="absolute top-10 left-10 text-4xl animate-bounce">🎄</div>
      <div className="absolute top-20 right-20 text-3xl animate-pulse">❄️</div>
      <div className="absolute bottom-20 left-20 text-3xl animate-bounce delay-300">🎅</div>
      <div className="absolute bottom-10 right-10 text-4xl animate-pulse delay-500">🎁</div>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-8xl mb-6"
          >
            🎁
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent mb-4"
          >
            Secret Santa Wheel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 dark:text-gray-400 mb-8"
          >
            Spin the wheel and discover your Secret Santa match!
          </motion.p>
        </div>

        <div className="grid md:grid-cols-1 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/spin">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer border-2 border-transparent hover:border-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-800">
                <div className="text-4xl mb-4">🎰</div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Spin the Wheel
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Enter your email, verify with OTP, and spin to get your Secret
                  Santa match!
                </p>
              </div>
            </Link>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/admin">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-800">
                <div className="text-4xl mb-4">👤</div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  Admin Panel
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Manage participants, add names and emails, view participant
                  list.
                </p>
              </div>
            </Link>
          </motion.div> */}

          {/* <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/superadmin">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow cursor-pointer border-2 border-transparent hover:border-red-600 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-800">
                <div className="text-4xl mb-4">👑</div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Superadmin
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  View all matches, reset matching, and manage everything.
                </p>
              </div>
            </Link>
          </motion.div> */}
        </div>

        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 inline-block border-2 border-red-200 dark:border-red-900">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              How it works
            </h3>
            <ol className="text-left text-gray-700 dark:text-gray-300 space-y-2 max-w-md">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Admin adds participants with their email addresses</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>
                  Users enter their email and receive an OTP code via email
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>
                  After verifying OTP, users spin the 3D wheel to get matched
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>
                  Only superadmin can view all the matches - users don't see
                  their match!
                </span>
              </li>
            </ol>
          </div>
        </motion.div> */}
      </motion.main>
    </div>
  );
}
