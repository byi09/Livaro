'use client';

import { useEffect, useState } from 'react';
import { FaXTwitter, FaWhatsapp, FaLink } from 'react-icons/fa6';

function CustomWaitlistForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        console.log('✅ API success:');
        setSubmitted(true);
        setName('');
        setEmail('');
      } else {
        console.error('❌ API failed:');
        alert('Submission failed.');
      }
    } catch (err) {
      alert('Error submitting form.');
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl p-6 border border-gray-200">
      {submitted ? (
        <div className="text-green-600 font-semibold text-center">
          🎉 Thank you for joining the waitlist!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-700 text-center">
            Join the Waitlist
          </h2>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

const faqItems = [
  {
    question: 'What is this waitlist for?',
    answer:
      'The waitlist allows students to get early access to rental listings near their college before they go public.',
  },
  {
    question: 'Is it free to join?',
    answer:
      'Yes! Joining the waitlist is absolutely free and helps us prioritize your area.',
  },
  {
    question: 'How will I be contacted?',
    answer:
      'Once your preferred listings go live, we’ll contact you via the email you submit in the form.',
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
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">
          🎓 Join the Livaro Student Waitlist
        </h1>
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

      {/* Pricing Section */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 mb-12">
        {/* Basic Plan */}
        <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-md text-center">
          <h3 className="text-xl font-semibold text-blue-700 mb-4">Basic - Free</h3>
          <ul className="text-gray-700 space-y-2">
            <li>2 Active Searches</li>
            <li>10 Pre-Screen Applications</li>
            <li>Connect Profile to Contacts</li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-md text-center">
          <h3 className="text-xl font-semibold text-blue-700 mb-4">Pro - $10/mo</h3>
          <ul className="text-gray-700 space-y-2">
            <li>10 Active Searches</li>
            <li>Infinite Applications</li>
            <li>Can Post Sublease Listings</li>
          </ul>
        </div>
      </div>

      {/* Waitlist Form */}
      <CustomWaitlistForm />

      {/* FAQ Section */}
      <div className="max-w-3xl mt-16 w-full">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          Frequently Asked Questions
        </h2>
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

      {/* Footer */}
      <p className="mt-12 text-sm text-gray-400">
        ✨ Powered by Rentora — Helping students find homes with ease.
      </p>
    </div>
  );
}
