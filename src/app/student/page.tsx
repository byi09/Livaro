'use client';

import { useEffect, useState } from 'react';
import { FaXTwitter, FaWhatsapp, FaLink } from 'react-icons/fa6';

const faqItems = [
  {
    question: 'What is this waitlist for?',
    answer: 'The waitlist allows students to get early access to rental listings near their college before they go public.',
  },
  {
    question: 'Is it free to join?',
    answer: 'Yes! Joining the waitlist is absolutely free and helps us prioritize your area.',
  },
  {
    question: 'How will I be contacted?',
    answer: 'Once your preferred listings go live, we’ll contact you via the email you submit in the form.',
  },
];

export default function StudentWaitlistPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(index === activeFaq ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 py-12 px-4 flex flex-col items-center">
      {/* Hero Section */}
      <div className="max-w-4xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">🎓 Join the Livaro Student Waitlist</h1>
        <p className="text-lg text-gray-600 mb-4">
          Get notified the moment new rental listings go live near your campus. Be the first to claim the best spots!
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => window.open(`https://x.com/intent/post?url=${shareUrl}`, '_blank')}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            <FaXTwitter />
            <span>Share on X</span>
          </button>
          <button
            onClick={() => window.open(`https://wa.me/?text=Check%20this%20out:%20${shareUrl}`, '_blank')}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            <FaWhatsapp />
            <span>Share on WhatsApp</span>
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="flex items-center space-x-2 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            <FaLink />
            <span>Copy Link</span>
          </button>
        </div>
      </div>

      {/* Embedded Form */}
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl p-6 border border-gray-200">
        <iframe
          src="https://forms.gle/U5tNfDZLSrd97UpV8"
          width="100%"
          height="900"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Student Waitlist Form"
          className="rounded-md"
        >
          Loading…
        </iframe>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mt-16 w-full">
        <h2 className="text-3xl font-bold text-blue-700 mb-6"> Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((faq, idx) => (
            <div key={idx} className="border border-gray-300 rounded-md">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-4 py-3 font-medium bg-gray-100 hover:bg-gray-200 transition"
              >
                {faq.question}
              </button>
              {activeFaq === idx && (
                <div className="px-4 py-3 text-gray-700 bg-white">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="mt-12 text-sm text-gray-400">✨ Powered by Rentora — Helping students find homes with ease.</p>
    </div>
  );
}
