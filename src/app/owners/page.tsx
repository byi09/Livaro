'use client';

import { FaLightbulb, FaChartLine, FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function OwnerPlansPage() {
  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen font-sans">
      {/* Heading */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Livaro Owner Plans
        </h1>
        <p className="text-lg text-gray-600">
          Manage your rental properties with ease and efficiency
        </p>
      </div>

      {/* Plan Cards */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card Variants */}
          {[{
            icon: <FaLightbulb className="text-yellow-400 text-4xl mb-3" />,
            title: "Basic",
            desc: "For individual landlords just getting started.",
            features: [
              "24/7 tenant concern resolution",
              "Rent collection outreach",
              "Schedule maintenance & showings",
              "Basic communication tools"
            ]
          },
          {
            icon: <FaChartLine className="text-orange-500 text-4xl mb-3" />,
            title: "Growth",
            desc: "For landlords scaling up with more properties.",
            features: [
              "Everything in Basic",
              "Property alerts & monitoring",
              "Livaro Rewards for tenants",
              "Audio chat for showings",
              "Automation tools"
            ]
          },
          {
            icon: <FaRocket className="text-purple-600 text-4xl mb-3" />,
            title: "Pro",
            desc: "Complete hands-off property management.",
            features: [
              "Everything in Growth",
              "Tenant placement & screening",
              "Rent collection management",
              "Dispute resolution",
              "End-to-end automation"
            ]
          }].map((plan, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition"
            >
              <div className="flex flex-col items-center">
                {plan.icon}
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">{plan.title}</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">{plan.desc}</p>
                <ul className="text-gray-700 text-sm text-left mt-4 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i}>✔️ {f}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Hear from Our Owners
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <blockquote className="bg-white p-6 rounded-xl shadow">
            “Livaro helped me grow my rental portfolio with zero headaches.”
            <footer className="mt-3 text-sm text-gray-500">— Ankit, Delhi</footer>
          </blockquote>
          <blockquote className="bg-white p-6 rounded-xl shadow">
            “The automation tools changed the way I manage tenants.”
            <footer className="mt-3 text-sm text-gray-500">— Rhea, Bangalore</footer>
          </blockquote>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-blue-50 text-center py-12 px-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">Need a custom plan?</h3>
        <p className="text-gray-600 mb-4">
          We offer tailored solutions for property managers with large portfolios.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
          Contact Our Team
        </button>
      </div>
    </div>
  );
}
