"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ subsets: ['latin'] })

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${montserrat.className} text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text`}
          >
            ATMA
          </motion.h1>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button 
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20 border-0 font-semibold"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button 
                className="bg-white text-purple-900 hover:bg-white/90 font-semibold"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <main className="py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h2 className={`${montserrat.className} text-6xl font-bold mb-6 leading-tight`}>
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  ATMA
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-12">
                Attendance Tracking & Management Application - Streamline your university's attendance system
                with our modern, efficient solution.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            >
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="text-blue-400 text-4xl mb-4">🎓</div>
                <h3 className={`${montserrat.className} text-xl font-semibold mb-4`}>
                  Smart Tracking
                </h3>
                <p className="text-gray-300">
                  Effortlessly manage attendance with our intelligent tracking system.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="text-purple-400 text-4xl mb-4">📊</div>
                <h3 className={`${montserrat.className} text-xl font-semibold mb-4`}>
                  Real-time Analytics
                </h3>
                <p className="text-gray-300">
                  Get instant insights with comprehensive attendance analytics.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="text-pink-400 text-4xl mb-4">📱</div>
                <h3 className={`${montserrat.className} text-xl font-semibold mb-4`}>
                  Mobile Friendly
                </h3>
                <p className="text-gray-300">
                  Access your attendance data anywhere, anytime.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90 text-lg px-8 py-6">
                  Start Your Journey
                </Button>
              </Link>
            </motion.div>
          </div>
        </main>

        <footer className="text-center text-gray-400 mt-20">
          <p>© 2024 ATMA. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
