'use client';
import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/landing"
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            MedPal
          </Link>
          <div className="flex gap-6">
            <Link
              href="/landing"
              className="hover:text-blue-400 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="hover:text-blue-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chat Now
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {/* Hero Section */}
        <section className="px-4 py-20 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              About MedPal
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Bridging the gap between technology and healthcare to make medical
              assistance accessible to everyone.
            </p>
          </motion.div>
        </section>

        {/* Mission Section */}
        <section className="px-4 py-16 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold mb-6 text-blue-400">
                Our Mission
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                At MedPal, we believe that everyone deserves access to quality
                medical guidance. Our AI-powered platform democratizes
                healthcare by providing instant, reliable, and personalized
                medical assistance.
              </p>
              <p className="text-lg text-gray-300">
                We&apos;re not here to replace doctors, but to complement
                healthcare by providing immediate support when you need it most,
                helping you make informed decisions about your health.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-gray-800 rounded-2xl p-8"
            >
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    24/7
                  </div>
                  <div className="text-gray-400">Availability</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    AI
                  </div>
                  <div className="text-gray-400">Powered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-pink-400 mb-2">
                    Secure
                  </div>
                  <div className="text-gray-400">& Private</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    Global
                  </div>
                  <div className="text-gray-400">Access</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="px-4 py-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-6 text-purple-400">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              MedPal leverages cutting-edge artificial intelligence and machine
              learning technologies to provide accurate and helpful medical
              insights.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Natural Language Processing
              </h3>
              <p className="text-gray-400">
                Advanced NLP understands your symptoms and medical concerns in
                natural language.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Machine Learning Models
              </h3>
              <p className="text-gray-400">
                Trained on vast medical datasets to provide accurate and
                relevant insights.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Privacy & Security</h3>
              <p className="text-gray-400">
                End-to-end encryption ensures your medical data remains
                completely private.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="px-4 py-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-6 text-green-400">
              Built for Malaysia
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Created as part of the Great Malaysia AI Hackathon, MedPal
              represents our commitment to advancing healthcare technology in
              Malaysia and beyond.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-gray-800 rounded-2xl p-12 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">
              Join the Healthcare Revolution
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Be part of the future of healthcare. Experience how AI can
              transform the way you access medical guidance and support.
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Try MedPal Now
              </motion.button>
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 px-4">
          <div className="max-w-6xl mx-auto text-center text-gray-400">
            <p>
              &copy; 2025 MedPal. All rights reserved. Built for the Great
              Malaysia AI Hackathon.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
