import React from 'react'

const SyedaLanding = () => {
  return (
   <>
      {/* SECTION 1: Value Proposition & Chat Bubble */}
      <section className="flex flex-col items-center text-center px-4 py-20 max-w-4xl mx-auto space-y-12">
        
        {/* Main Headline */}
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-800 tracking-tight leading-tight">
          Here's what changes in your <br /> business
        </h1>

        {/* Subtext */}
        <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
          You don't log into another platform. You don't remember to follow up. You don't write messages 💬.
        </p>

        {/* The Chat Bubble Graphic */}
        <div className="relative mt-8">
          {/* This simulates the white chat bubble card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 max-w-md mx-auto transform rotate-1 transition hover:rotate-0">
            <p className="text-lg font-medium text-slate-700">
              We text YOU. You forward it. You look like a hero ✨.
            </p>
          </div>
        </div>

        {/* Transition Text */}
        <div className="pt-16 space-y-4">
          <h2 className="text-2xl md:text-3xl font-medium text-slate-700">
            Everyone tells you to buy more leads. Spend more on ads. Cold call more prospects.
          </h2>
        </div>

      </section>


      {/* SECTION 2: The Data / Stats Grid */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-slate-500 uppercase border border-slate-300 rounded-full mb-4">
            The Numbers Don't Lie
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
            The Data tells something <span className="text-indigo-500">different..</span>
          </h2>
        </div>

        {/* Grid of Dark Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: 85% */}
          <div className="bg-[#1e1e2e] p-8 rounded-3xl text-white shadow-2xl">
            <div className="flex items-center space-x-2 mb-4 text-indigo-400 text-sm font-medium">
              <span>✦</span> <span>Market Reality</span>
            </div>
            <div className="text-6xl font-bold mb-4">85<span className="text-3xl">%</span></div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 h-2 rounded-full mb-4">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-slate-400 text-sm">of the market comes from repeat business and referrals</p>
            <p className="text-slate-600 text-xs mt-2">Source: National Association of Realtors</p>
          </div>

          {/* Card 2: 12% */}
          <div className="bg-[#1e1e2e] p-8 rounded-3xl text-white shadow-2xl">
            <div className="flex items-center space-x-2 mb-4 text-red-400 text-sm font-medium">
              <span>✦</span> <span>The Gap</span>
            </div>
            <div className="text-6xl font-bold mb-4">12<span className="text-3xl">%</span></div>
            <div className="w-full bg-slate-700 h-2 rounded-full mb-4">
              <div className="bg-red-400 h-2 rounded-full" style={{ width: '12%' }}></div>
            </div>
            <p className="text-slate-400 text-sm">is what most agents actually capture without follow-up</p>
            <p className="text-slate-600 text-xs mt-2">73% opportunity loss</p>
          </div>

          {/* Card 3: 81% */}
          <div className="bg-[#1e1e2e] p-8 rounded-3xl text-white shadow-2xl">
            <div className="flex items-center space-x-2 mb-4 text-purple-400 text-sm font-medium">
              <span>✦</span> <span>Critical Window</span>
            </div>
            <div className="text-6xl font-bold mb-4">81<span className="text-3xl">%</span></div>
            <div className="w-full bg-slate-700 h-2 rounded-full mb-4">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '81%' }}></div>
            </div>
            <p className="text-slate-400 text-sm">of sellers call only ONE agent when ready to list</p>
            <p className="text-slate-600 text-xs mt-2">You need to be that one agent</p>
          </div>

          {/* Card 4: Opportunity */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-2xl">
            <div className="flex items-center space-x-2 mb-4 text-blue-200 text-sm font-medium">
              <span>✦</span> <span>Your Opportunity</span>
            </div>
            <div className="text-4xl md:text-5xl font-bold mb-4">$15K-130K</div>
            <div className="w-full bg-blue-800 h-2 rounded-full mb-4">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <p className="text-blue-100 text-sm">additional annual revenue per agent with Viano</p>
            <p className="text-blue-200 text-xs mt-2">Based on average client lifetime value</p>
          </div>

        </div>
      </section>


      {/* SECTION 3: Large CTA Banner */}
      <section className="px-4 py-12 max-w-6xl mx-auto">
        <div className="bg-[#1e1e2e] rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
          
          {/* Decorative Stars (CSS only) */}
          <div className="absolute top-10 right-10 text-purple-500 text-6xl opacity-80">✦</div>
          <div className="absolute bottom-10 right-20 text-purple-400 text-4xl opacity-60">✦</div>

          <h2 className="text-3xl md:text-4xl font-medium text-white max-w-3xl mx-auto leading-normal mb-8">
            Viano keeps you top-of-mind with automated, valuable follow-up using inspection data only YOU have.
          </h2>
          
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-lg px-8 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/30">
            Get Started with Viano
          </button>
        </div>
      </section>


      {/* SECTION 4: Footer */}
      <footer className="bg-[#0f111a] text-slate-400 py-16 mt-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-white font-bold text-xl mb-4">viano systems®</h3>
            <p className="leading-relaxed">
              Property Intelligence AI for Elite Realtors
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Team Pricing</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
          © 2025 Viano. All rights reserved.
        </div>
      </footer>
   </>
  )
}

export default SyedaLanding
