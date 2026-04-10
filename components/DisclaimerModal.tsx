import React, { useState } from 'react';

const DisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-legal-900/80 backdrop-blur-sm px-4">
      <div className="bg-legal-50 rounded-xl shadow-2xl max-w-lg w-full p-8 border border-legal-200">
        <h2 className="text-2xl font-serif font-bold text-legal-900 mb-4">Legal Disclaimer</h2>
        <div className="prose prose-sm text-legal-700 mb-8 max-h-60 overflow-y-auto pr-2 font-serif leading-relaxed">
          <p className="mb-3"><strong className="text-legal-900">Family First is NOT a lawyer.</strong></p>
          <p className="mb-3">
            This application uses artificial intelligence to provide legal information, research, and drafting assistance based on Indiana law. It does not provide legal advice, and no attorney-client relationship is formed by using this app.
          </p>
          <p className="mb-3">
            Family law is complex and fact-specific. While this tool aims for high accuracy using advanced reasoning models, AI can make mistakes ("hallucinations"). You should always verify citations and generated documents with a qualified attorney licensed in Indiana before filing anything with a court.
          </p>
          <p>
            By continuing, you acknowledge that you are using this tool at your own risk and agree to the Terms of Service.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-full bg-legal-900 text-legal-50 font-medium uppercase tracking-wider text-sm py-4 rounded-lg hover:bg-legal-800 transition-colors border border-legal-800"
        >
          I Understand & Agree
        </button>
      </div>
    </div>
  );
};

export default DisclaimerModal;