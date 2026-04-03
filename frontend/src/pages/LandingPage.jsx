import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/walletContext";

export default function LandingPage() {
  const { address, role } = useWallet();
  const navigate = useNavigate();
  const [bounties, setBounties] = useState(0);
  const [locked, setLocked] = useState(0);
  const [validators, setValidators] = useState(0);

  useEffect(() => {
    animateCount(setBounties, 12482, 50);
    animateCount(setLocked, 4200000, 50);
    animateCount(setValidators, 840, 50);
  }, []);

  function animateCount(setter, target, steps) {
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setter(target);
        clearInterval(timer);
      } else {
        setter(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }

  const formatNum = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n.toLocaleString();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 overflow-hidden hero-glow">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start">
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter leading-none mb-6">
              SettleChain —<br />
              <span className="gradient-text">Trustless Bounties</span><br />
              on Algorand
            </h1>
            <p className="text-on-surface-variant text-xl md:text-2xl max-w-lg mb-10 leading-relaxed">
              Lock funds. Submit work. Get paid. No middlemen. The architect's choice for immutable work settlement.
            </p>
            <div className="flex flex-wrap gap-4">
              {address ? (
                <>
                  {role === 'sponsor' && (
                    <button
                      onClick={() => navigate('/sponsor')}
                      className="cta-gradient text-on-primary-container px-8 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all active:scale-95"
                    >
                      Post a Bounty
                    </button>
                  )}
                  {role === 'contributor' && (
                    <button
                      onClick={() => navigate('/contributor')}
                      className="bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-bright transition-all active:scale-95"
                    >
                      Find Work
                    </button>
                  )}
                  {(!role || role === 'validator') && (
                    <button
                      onClick={() => navigate('/validator')}
                      className="cta-gradient text-on-primary-container px-8 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all active:scale-95"
                    >
                      Validator Panel
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="cta-gradient text-on-primary-container px-8 py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all active:scale-95"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-bright transition-all active:scale-95"
                  >
                    Signup
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bounty Preview Card */}
          <div className="relative group hidden lg:block">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-tertiary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold tracking-widest text-primary uppercase">Active Bounty</span>
                <span className="text-xs font-medium text-on-surface-variant">#8829-X</span>
              </div>
              <h3 className="font-headline text-2xl font-bold mb-4">Smart Contract Auditor</h3>
              <div className="flex gap-4 mb-8">
                <div className="bg-surface-container-high px-3 py-1 rounded text-sm text-on-surface-variant">TEAL</div>
                <div className="bg-surface-container-high px-3 py-1 rounded text-sm text-on-surface-variant">Security</div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Locked Reward</p>
                  <p className="text-3xl font-headline font-bold text-primary">2,500 ALGO</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant mb-1">Status</p>
                  <p className="text-sm font-bold text-tertiary">Escrow Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-headline font-bold text-primary mb-2">{bounties.toLocaleString()}</span>
              <span className="text-on-surface-variant font-medium uppercase tracking-widest text-xs">Bounties settled</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-headline font-bold text-primary mb-2">{formatNum(locked)}</span>
              <span className="text-on-surface-variant font-medium uppercase tracking-widest text-xs">Total locked (ALGO)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-headline font-bold text-primary mb-2">{validators.toLocaleString()}</span>
              <span className="text-on-surface-variant font-medium uppercase tracking-widest text-xs">Active validators</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-left">
            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4">Architectural Integrity</h2>
            <p className="text-on-surface-variant text-lg">Beyond standard escrows—a cryptographic guarantee of payment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "analytics", title: "Objective Validation Oracles", desc: "External data points are cryptographically signed before being ingested by the bounty engine." },
              { icon: "fingerprint", title: "Immutable Brief Hashing", desc: "Scope of work is hashed on-chain at creation, preventing \"requirement creep\" post-start." },
              { icon: "published_with_changes", title: "Reverse Escrow", desc: "Contingent funds are locked in a sovereign smart-contract account, not a multisig wallet." },
              { icon: "encrypted", title: "ZK Proof of Work", desc: "Validate output completion without exposing sensitive intellectual property to the public ledger." },
            ].map((f, i) => (
              <div key={i} className="bento-card-hover bg-surface-container-low p-8 rounded-xl flex flex-col h-full border border-outline-variant/5">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h4 className="font-headline text-xl font-bold mb-4">{f.title}</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-surface-container-low/30 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/3">
              <h2 className="font-headline text-4xl font-bold mb-6">The Lifecycle of a Bounty</h2>
              <p className="text-on-surface-variant leading-relaxed">Seamless settlement engineered for high-performance teams on Algorand.</p>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 gap-12">
              {[
                { step: 1, title: "Sponsor locks funds", desc: "Asset is moved to a locked escrow state with specific release conditions hashed into the transaction metadata." },
                { step: 2, title: "Contributor submits", desc: "The contributor pushes work metadata or ZK proof of completion directly to the SettleChain portal." },
                { step: 3, title: "Smart contract settles", desc: "Validators or automated oracles verify conditions; funds are instantly released to the contributor's Algorand address." },
              ].map((s) => (
                <div key={s.step} className="flex gap-8 group">
                  <div className="flex-none w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center font-headline font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{s.title}</h4>
                    <p className="text-on-surface-variant">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto bg-surface-container-high rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/10 blur-[100px]"></div>
          <h2 className="font-headline text-4xl md:text-6xl font-bold mb-8 relative z-10">Ready to Build Trust?</h2>
          <p className="text-on-surface-variant text-xl max-w-2xl mx-auto mb-12 relative z-10">
            Join the growing ecosystem of developers and sponsors settling work without the risk of non-payment.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
            <button
              onClick={() => address ? (role === 'sponsor' ? navigate('/sponsor') : navigate('/contributor')) : navigate('/login')}
              className="cta-gradient text-on-primary-container px-10 py-5 rounded-2xl font-bold text-xl active:scale-95 transition-transform"
            >
              Get Started Now
            </button>
            <button className="bg-surface-container-lowest text-on-surface px-10 py-5 rounded-2xl font-bold text-xl hover:bg-black transition-all active:scale-95">
              Read Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
