import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full py-12 px-8 bg-neutral-950 border-t border-outline-variant/10 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-lg font-bold text-neutral-200 font-headline">SettleChain</span>
          <p className="text-neutral-500 font-body text-sm leading-relaxed">
            © 2026 SettleChain. Built on Algorand.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-neutral-500 font-body text-sm hover:text-white transition-colors" href="#">
            Documentation
          </a>
          <a className="text-neutral-500 font-body text-sm hover:text-white transition-colors" href="#">
            Privacy
          </a>
          <a className="text-neutral-500 font-body text-sm hover:text-white transition-colors" href="#">
            Terms
          </a>
          <a className="text-primary font-body text-sm hover:text-white transition-colors flex items-center gap-2" href="#">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            TestNet Status
          </a>
        </div>
      </div>
    </footer>
  );
}
