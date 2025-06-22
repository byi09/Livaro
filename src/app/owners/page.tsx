// src/app/owners/page.tsx

export default function OwnerPlansPage() {
  return (
    <div className="bg-blue-600 min-h-screen text-white font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Choose the Livaro that works for your needs</h1>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-white text-black p-6 rounded-xl shadow-md flex flex-col items-center transform transition duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="text-2xl font-semibold mb-2">01</div>
            <button className="text-blue-600 font-bold bg-blue-100 px-4 py-1 rounded-full mb-4">Basic - Free</button>
            <p className="text-center mb-4">Perfect for getting started with basic property management features.</p>
            <ul className="text-green-700 space-y-2 mb-6">
              <li>✔️ Ask tenants to resolve concerns 24/7</li>
              <li>✔️ Handle rent collection outreach</li>
              <li>✔️ Schedule showings and maintenance</li>
              <li>✔️ Basic tenant communication</li>
            </ul>
            <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-50">Get Started</button>
          </div>

          {/* Growth Plan */}
          <div className="bg-white text-black p-6 rounded-xl shadow-md flex flex-col items-center transform transition duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute -top-4 px-4 py-1 text-sm bg-orange-500 text-white rounded-full">Best Value</div>
            <div className="text-2xl font-semibold mb-2">02</div>
            <button className="text-blue-600 font-bold bg-blue-100 px-4 py-1 rounded-full mb-4">Growth - $29.99/month</button>
            <p className="text-center mb-4">Ideal for growing property portfolios with advanced automation.</p>
            <ul className="text-green-700 space-y-2 mb-6">
              <li>✔️ Everything in Basic</li>
              <li>✔️ Property monitoring & maintenance alerts</li>
              <li>✔️ Livaro Rewards for tenants</li>
              <li>✔️ Live audio chat for showings</li>
              <li>✔️ Advanced automation features</li>
            </ul>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Start Free Trial</button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white text-black p-6 rounded-xl shadow-md flex flex-col items-center transform transition duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="text-2xl font-semibold mb-2">03</div>
            <button className="text-blue-600 font-bold bg-blue-100 px-4 py-1 rounded-full mb-4">Pro - $59.99/month</button>
            <p className="text-center mb-4">Complete hands-off property management for serious investors.</p>
            <ul className="text-green-700 space-y-2 mb-6">
              <li>✔️ Everything in Growth</li>
              <li>✔️ Full tenant placement & screening</li>
              <li>✔️ Complete rent collection management</li>
              <li>✔️ Dispute resolution handling</li>
              <li>✔️ Hands-off property management</li>
            </ul>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Contact Sales</button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white text-black py-12 px-6">
        <h2 className="text-3xl font-bold text-center mb-8">What you get with each plan</h2>
        <div className="overflow-x-auto max-w-6xl mx-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50 text-left">
                <th className="p-4">Features</th>
                <th className="p-4 text-center">Basic</th>
                <th className="p-4 text-center">
                  Pro <span className="text-orange-500 font-semibold text-sm">Best Value</span>
                </th>
                <th className="p-4 text-center">Complete</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'Ask tenants to resolve concerns and questions 24/7 every day',
                  basic: true, pro: true, complete: true
                },
                {
                  name: 'Ask renters to resolving issues & disputes on their own',
                  basic: true, pro: true, complete: true
                },
                {
                  name: 'Handles outreach for rent, lease renewals, and delinquent payments',
                  basic: true, pro: true, complete: true
                },
                {
                  name: 'Schedules showings, maintenance, and walk-throughs',
                  basic: true, pro: true, complete: true
                },
                {
                  name: 'Monitors your property & renter concerns to suggest preventative maintenance & actions',
                  basic: false, pro: true, complete: true
                },
                {
                  name: 'Incentivizes renters to resolve most maintenance tasks and collect property health info with Livaro Rewards',
                  basic: false, pro: true, complete: true
                },
                {
                  name: 'Markets your properties to self-showing prospects using live audio chat with Livaro Talk-Through',
                  basic: false, pro: true, complete: true
                },
                {
                  name: 'Handles all tenant placement and screening, rent collection, and dispute resolution with hands-off property management',
                  basic: false, pro: false, complete: true
                }
              ].map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-4">{row.name}</td>
                  <td className="p-4 text-center">{row.basic ? "✔️" : ""}</td>
                  <td className="p-4 text-center">{row.pro ? "✔️" : ""}</td>
                  <td className="p-4 text-center">{row.complete ? "✔️" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 mb-2">*Enterprise Plan - Portfolio analytics, API access</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Contact Sales for Enterprise</button>
          </div>
        </div>
      </div>
    </div>
  );
}
