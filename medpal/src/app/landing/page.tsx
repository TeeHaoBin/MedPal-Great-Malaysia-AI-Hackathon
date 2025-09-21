'use client';
import React from 'react';
import { GoogleGeminiEffectDemo } from '@/components/GoogleGeminiEffectDemo';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function LandingPage() {
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

      {/* Hero Section with Google Gemini Effect */}
      <div className="pt-16">
        <GoogleGeminiEffectDemo />
      </div>

      {/* Content Section */}
      <div className="relative z-10 bg-black">
        {/* Introduction Section */}
        <section className="px-4 py-20 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Welcome to MedPal
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Empowering patients and laymen to understand medical reports better and gain meaningful insights into their health. 
              Our AI-powered platform transforms complex medical data into clear, actionable health guidance.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Medical Report Analysis
              </h3>
              <p className="text-gray-400">
                Upload your medical reports and get clear, understandable explanations of complex medical terminology and test results.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Health Insights</h3>
              <p className="text-gray-400">
                Get immediate, accurate interpretations of your health data with our secure AI processing pipeline.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-pink-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">AWS-Powered Security</h3>
              <p className="text-gray-400">
                Built on robust AWS cloud infrastructure ensuring your medical data is secure, processed accurately, and delivered timely.
              </p>
            </motion.div>
          </div>

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold mb-12 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              How MedPal Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Upload Medical Report',
                  desc: 'Upload your medical reports or lab results securely',
                },
                {
                  step: '2',
                  title: 'AI Processing',
                  desc: 'Our secure AWS-powered AI analyzes your medical data',
                },
                {
                  step: '3',
                  title: 'Get Clear Insights',
                  desc: 'Receive easy-to-understand explanations and health insights',
                },
                {
                  step: '4',
                  title: 'Seamless Experience',
                  desc: 'Access your results instantly without any inconvenience',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent -z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Core Principles Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Our Core Principles
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8"
              >
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center text-blue-400">Secure AI Data Processing</h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  We ensure that our AI data processing pipeline is secure, accurate, and timely. 
                  Your medical information is protected with enterprise-grade encryption and processed with the highest standards of data security.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8"
              >
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center text-purple-400">Seamless User Experience</h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  We are committed to ensuring that users do not experience any inconveniences while using our system. 
                  Our intuitive interface and streamlined processes make understanding medical reports effortless.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-br from-green-900/30 to-teal-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 md:col-span-2"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center text-green-400">Best-in-Class AWS Cloud Infrastructure</h3>
                <p className="text-gray-300 text-center leading-relaxed max-w-4xl mx-auto">
                  Our platform is built on Amazon Web Services (AWS) with a well-designed architecture that ensures scalability, reliability, and performance. 
                  We leverage AWS's robust cloud infrastructure to provide you with the best possible experience, from secure data storage to lightning-fast AI processing.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-gray-800 rounded-2xl p-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Understand Your Health Better?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join patients and laymen who trust MedPal to decode complex medical reports and gain valuable health insights through our secure, accurate, and timely AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Start Chatting Now
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border border-gray-600 text-white font-semibold rounded-xl hover:border-blue-500 transition-colors"
                >
                  Learn More
                </motion.button>
              </Link>
            </div>
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
