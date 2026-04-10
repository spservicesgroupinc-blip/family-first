import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DisclaimerModal from './components/DisclaimerModal';
import { ViewMode, CaseFile, ChatMessage } from './types';
import { Icons } from './constants';
import { geminiService } from './services/geminiService';
import { Part } from '@google/genai';
import { generatePDF } from './lib/pdf';

// --- FILE MANAGER COMPONENT ---
const FileManager: React.FC<{ files: CaseFile[]; onUpload: (f: CaseFile) => void; onDelete: (id: string) => void }> = ({ files, onUpload, onDelete }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let content = "";
    let inlineData = undefined;

    // Handle Binary Files (PDF, Images)
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // remove "data:application/pdf;base64," prefix
                    const b64 = result.split(',')[1]; 
                    resolve(b64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            content = `[Binary File: ${file.type}]`;
            inlineData = {
                mimeType: file.type,
                data: base64
            };
        } catch (error) {
            alert("Error reading file.");
            return;
        }
    } else {
        // Fallback for text-based files
        content = await file.text();
    }

    const newFile: CaseFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        content: content,
        inlineData: inlineData,
        dateAdded: Date.now(),
    };
    onUpload(newFile);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full overflow-y-auto legal-scroll pb-safe">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-8">
        <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-3xl font-serif font-bold text-legal-900">Case Files</h2>
            <p className="text-xs md:text-base text-legal-600 mt-1">Upload motions, orders, and evidence (PDF, Text, Images).</p>
        </div>
        <label className="w-full sm:w-auto flex justify-center items-center gap-2 bg-legal-900 hover:bg-legal-800 text-legal-50 px-4 py-3 md:py-2.5 rounded-lg cursor-pointer transition shadow-sm border border-legal-800 min-h-[44px]">
          <Icons.Upload className="w-4 h-4 shrink-0" />
          <span className="text-xs md:text-sm font-medium uppercase tracking-wider">Upload</span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".txt,.md,.json,.csv,.pdf,.jpg,.jpeg,.png"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {files.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-legal-200">
                <Icons.Document className="w-8 h-8 mx-auto text-legal-300" />
                <p className="text-legal-500 mt-4">No files stored. Upload documents to give the AI context.</p>
            </div>
        )}
        {files.map(file => (
          <div key={file.id} className="bg-white p-6 rounded-xl shadow-sm border border-legal-200 hover:border-legal-400 hover:shadow-md transition relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-legal-50 text-legal-700 rounded-lg border border-legal-100">
                <Icons.Document className="w-5 h-5" />
              </div>
              <button 
                onClick={() => onDelete(file.id)} 
                className="text-legal-300 hover:text-red-600 transition-colors"
                title="Delete File"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
              </button>
            </div>
            <h3 className="font-serif font-bold text-legal-900 truncate" title={file.name}>{file.name}</h3>
            <p className="text-xs text-legal-500 mt-1 uppercase tracking-wider">Added: {new Date(file.dateAdded).toLocaleDateString()}</p>
            <div className="mt-4 pt-4 border-t border-legal-100">
               {file.inlineData ? (
                   <div className="flex items-center gap-2 text-xs text-legal-700 bg-legal-50 p-2 rounded border border-legal-100">
                       <span className="font-bold uppercase tracking-wider">{file.type.split('/')[1]} Document</span>
                       <span className="text-legal-400">• Ready for AI</span>
                   </div>
               ) : (
                   <p className="text-xs text-legal-500 line-clamp-3 font-mono bg-legal-50 p-2 rounded border border-legal-100 break-all">{file.content.substring(0, 150)}</p>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- RESEARCH COMPONENT ---
const ResearchTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: { title: string; uri: string }[] } | null>(null);

  const handleResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await geminiService.researchLegalPrecedent(query);
      setResult(data);
    } catch (e) {
      alert("Research failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col pb-safe">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-2">
        <h2 className="text-xl md:text-3xl font-serif font-bold text-legal-900">Deep Legal Research</h2>
        {result && (
          <button
            onClick={() => generatePDF('research-report', 'Legal_Research_Report.pdf')}
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-legal-100 hover:bg-legal-200 text-legal-800 px-4 py-2.5 rounded-lg font-medium transition-colors border border-legal-200 text-xs md:text-sm uppercase tracking-wider min-h-[44px]"
          >
            <Icons.Download className="w-4 h-4 shrink-0" />
            Save PDF
          </button>
        )}
      </div>
      <p className="text-xs md:text-base text-legal-600 mb-4 md:mb-8">
        <span className="bg-legal-100 text-legal-800 border border-legal-200 text-[10px] px-2 py-1 rounded-full font-bold mr-2 uppercase tracking-wider">MULTI-MODEL</span>
        Running parallel analysis with Gemini 3 Pro (Case Law) and Gemini 3 Flash (Statutes).
      </p>

      <div className="relative mb-4 md:mb-8">
        <div className="flex flex-col sm:flex-row gap-2">
            <input
            type="text"
            className="w-full p-3 md:p-4 pl-4 md:pl-5 rounded-lg border border-legal-200 focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none shadow-sm font-serif text-sm md:text-base min-h-[44px]"
            placeholder="e.g., Criteria for modifying child custody in Indiana..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            />
            <button
                onClick={handleResearch}
                disabled={loading}
                className="w-full sm:w-auto bg-legal-900 text-legal-50 px-8 py-3 md:py-2.5 rounded-lg font-medium hover:bg-legal-800 disabled:opacity-50 transition-colors uppercase tracking-wider text-sm border border-legal-800 min-h-[44px]"
            >
                {loading ? 'Analyzing...' : 'Research'}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto legal-scroll bg-white rounded-xl shadow-sm border border-legal-200 p-4 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-legal-400 animate-pulse">
            <Icons.Search className="w-8 h-8 mb-4" />
            <p className="font-serif font-bold text-lg text-legal-800">Deploying Multi-Agent Swarm...</p>
            <p className="text-sm mt-2 text-legal-500">Gemini 3 Pro: Analyzing Case Law</p>
            <p className="text-sm text-legal-500">Gemini 3 Flash: Checking Title 31</p>
          </div>
        ) : result ? (
          <div id="research-report" className="space-y-6 p-4">
             <div className="prose max-w-none text-legal-800 font-serif leading-relaxed whitespace-pre-wrap">
                <div dangerouslySetInnerHTML={{ __html: result.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold text-legal-900 mb-4 pb-2 border-b border-legal-200">$1</h1>')
                    .replace(/^## (.*)/gm, '<h2 class="text-xl font-bold text-legal-800 mb-3 mt-6">$1</h2>') 
                    .replace(/Case Law Analysis/g, '🏛️ Case Law Analysis')
                    .replace(/Statutory & Procedural Framework/g, '📜 Statutory & Procedural Framework')
                }} />
             </div>
             
             {result.sources.length > 0 && (
                 <div className="mt-8 pt-6 border-t border-legal-100">
                     <h3 className="text-xs font-bold text-legal-500 uppercase tracking-widest mb-4">Citations & Sources</h3>
                     <div className="grid gap-3">
                         {result.sources.map((source, idx) => (
                             <a key={idx} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-legal-50 hover:bg-legal-100 border border-legal-100 rounded-lg group transition text-sm">
                                 <span className="font-medium text-legal-800 truncate max-w-[80%]">{source.title}</span>
                                 <span className="text-legal-400 group-hover:text-legal-600 shrink-0 uppercase tracking-wider text-[10px] font-bold">Open &rarr;</span>
                             </a>
                         ))}
                     </div>
                 </div>
             )}
          </div>
        ) : (
          <div className="text-center text-legal-400 mt-20">
            <p className="font-serif italic">Enter a legal query to begin deep research.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MOTION DRAFTER COMPONENT ---
const MotionDrafter: React.FC<{ files: CaseFile[] }> = ({ files }) => {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    if (!topic || !instructions) return;
    setLoading(true);
    try {
      const result = await geminiService.draftMotion(topic, files, instructions);
      setDraft(result);
    } catch (e) {
      alert("Drafting failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:overflow-hidden overflow-y-auto pb-safe">
      {/* Inputs */}
      <div className="w-full md:w-1/3 p-4 md:p-6 border-b md:border-b-0 md:border-r border-legal-200 bg-legal-50 md:overflow-y-auto shrink-0">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-legal-900 mb-3 md:mb-6">Draft Motion</h2>

        <div className="space-y-3 md:space-y-4">
            <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-legal-600 mb-1 md:mb-2">Motion Type</label>
                <input
                    className="w-full p-3 border border-legal-200 rounded focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none font-serif min-h-[44px]"
                    placeholder="e.g., Motion to Modify Parenting Time"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-legal-600 mb-1 md:mb-2">Specific Facts/Instructions</label>
                <textarea
                    className="w-full p-3 border border-legal-200 rounded focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none h-32 md:h-40 font-serif"
                    placeholder="Enter key facts (dates, names, events) to be included..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                />
            </div>

            <div className="p-3 md:p-4 bg-white rounded border border-legal-200">
                <p className="text-[10px] text-legal-500 uppercase tracking-widest font-bold mb-2 md:mb-3">Context ({files.length} files)</p>
                <div className="flex flex-wrap gap-1 md:gap-2">
                    {files.map(f => (
                        <span key={f.id} className="text-[10px] bg-legal-100 text-legal-800 border border-legal-200 px-2 py-1 rounded truncate max-w-[120px] md:max-w-[150px] font-medium">{f.name}</span>
                    ))}
                    {files.length === 0 && <span className="text-[10px] text-legal-400 italic font-serif">No files. Draft will be generic.</span>}
                </div>
            </div>

            <button
                onClick={handleDraft}
                disabled={loading}
                className="w-full py-3 bg-legal-900 hover:bg-legal-800 text-legal-50 font-medium uppercase tracking-wider text-sm rounded shadow-sm transition disabled:opacity-50 border border-legal-800 min-h-[44px]"
            >
                {loading ? 'Drafting...' : 'Generate Motion'}
            </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="w-full md:w-2/3 p-4 md:p-8 bg-white md:overflow-y-auto legal-scroll relative min-h-[300px] md:min-h-0">
        {draft ? (
            <div className="max-w-3xl mx-auto shadow-sm border border-legal-200 p-4 md:p-12 min-h-[500px] md:min-h-[800px] font-serif leading-relaxed text-legal-900 whitespace-pre-wrap bg-white relative text-sm md:text-base">
                <div className="sticky top-2 flex gap-2 justify-end mb-4">
                    <button
                        onClick={handleCopy}
                        className="text-[10px] uppercase tracking-widest font-bold bg-legal-100 hover:bg-legal-200 px-3 py-2 rounded text-legal-700 transition-colors min-h-[44px] flex items-center"
                    >
                        Copy Text
                    </button>
                    <button
                        onClick={() => generatePDF('motion-draft', 'Drafted_Motion.pdf')}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold bg-legal-100 hover:bg-legal-200 px-3 py-2 rounded text-legal-700 transition-colors min-h-[44px]"
                    >
                        <Icons.Download className="w-3 h-3" />
                        Save PDF
                    </button>
                </div>
                <div id="motion-draft" className="pt-4 md:pt-8">
                    {draft}
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-legal-300 p-8">
                <Icons.Scale className="w-12 h-12 mb-4" />
                <p className="font-serif font-bold text-lg text-legal-600">Draft preview will appear here</p>
                <p className="text-sm mt-2 text-legal-400 max-w-xs text-center italic font-serif">AI will apply standard Indiana Trial Rules formatting.</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- ASSISTANT (CHAT) COMPONENT ---
const Assistant: React.FC<{ files: CaseFile[] }> = ({ files }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hello. I am Family First, your AI Partner in Family Court. I can help you understand statutes, analyze your case files, or plan your legal strategy. How can I help you today?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if(!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setThinking(true);

        const history: {role: string, parts: Part[]}[] = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        try {
            const responseText = await geminiService.chatWithExpert(userMsg.text, files, history);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: Date.now() }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I encountered an error. Please try again.", timestamp: Date.now() }]);
        } finally {
            setThinking(false);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, thinking]);

    return (
        <div className="flex flex-col h-full bg-legal-50 relative">
            <div className="flex justify-between items-center p-3 md:p-4 border-b border-legal-200 bg-white min-h-[56px]">
                <h2 className="text-base md:text-xl font-serif font-bold text-legal-900">AI Assistant</h2>
                <button
                    onClick={() => generatePDF('chat-history', 'Chat_History.pdf')}
                    className="flex items-center gap-1 md:gap-2 bg-legal-100 hover:bg-legal-200 text-legal-800 px-2 py-1.5 md:px-3 md:py-2 rounded font-medium transition-colors border border-legal-200 text-[10px] md:text-xs uppercase tracking-wider min-h-[44px]"
                >
                    <Icons.Download className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">Save Chat PDF</span>
                    <span className="sm:hidden">Save</span>
                </button>
            </div>
            <div id="chat-history" className="flex-1 overflow-y-auto p-3 md:p-8 space-y-3 md:space-y-6">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] p-3 md:p-5 rounded-2xl shadow-sm ${
                            msg.role === 'user'
                            ? 'bg-legal-900 text-legal-50 rounded-br-sm border border-legal-800'
                            : 'bg-white text-legal-900 border border-legal-200 rounded-bl-sm'
                        }`}>
                            <div className="prose prose-sm max-w-none font-serif leading-relaxed text-sm md:text-[15px]">
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        </div>
                    </div>
                ))}
                {thinking && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 md:p-5 rounded-2xl rounded-bl-sm border border-legal-200 shadow-sm flex gap-2 items-center">
                            <div className="w-2 h-2 bg-legal-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-legal-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-legal-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-2 md:p-4 bg-white border-t border-legal-200 pb-safe">
                <div className="max-w-4xl mx-auto flex gap-2 md:gap-3">
                    <input
                        type="text"
                        className="flex-1 border border-legal-200 rounded-lg px-3 py-2.5 md:px-4 md:py-3 focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none font-serif text-sm md:text-base min-h-[44px]"
                        placeholder="Ask about Indiana law or your case files..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={thinking}
                    />
                    <button
                        onClick={handleSend}
                        disabled={thinking || !input.trim()}
                        className="bg-legal-900 text-legal-50 px-4 py-2 md:px-8 md:py-3 rounded-lg font-medium uppercase tracking-wider text-xs md:text-sm hover:bg-legal-800 disabled:opacity-50 transition-colors border border-legal-800 min-h-[44px] shrink-0"
                    >
                        Send
                    </button>
                </div>
                <p className="text-center text-[8px] md:text-[10px] text-legal-400 mt-1 md:mt-3 uppercase tracking-widest font-bold">Family First can make mistakes. Verify important information.</p>
            </div>
        </div>
    );
};

// --- PROFILE & SETTINGS COMPONENT ---
const ProfileSettings: React.FC<{ onClearData: () => void }> = ({ onClearData }) => {
    const [name, setName] = useState(localStorage.getItem('ff_name') || 'Jane Doe');
    const [email, setEmail] = useState(localStorage.getItem('ff_email') || 'jane.doe@example.com');
    const [role, setRole] = useState(localStorage.getItem('ff_role') || 'Pro Se Litigant');
    const [saveMessage, setSaveMessage] = useState('');
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    const handleSave = () => {
        localStorage.setItem('ff_name', name);
        localStorage.setItem('ff_email', email);
        localStorage.setItem('ff_role', role);
        setSaveMessage('Settings saved successfully.');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleClear = () => {
        onClearData();
        setShowConfirmClear(false);
        setSaveMessage('All local data cleared.');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto legal-scroll pb-safe">
            <h2 className="text-xl md:text-3xl font-serif font-bold text-legal-900 mb-4 md:mb-8">Profile & Settings</h2>

            <div className="space-y-4 md:space-y-6">
                {/* Personal Info Card */}
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-legal-200 relative">
                    <h3 className="text-base md:text-lg font-serif font-bold text-legal-900 mb-3 md:mb-4 border-b border-legal-100 pb-2">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-legal-600 mb-1">Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-legal-200 rounded focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none font-serif text-sm min-h-[44px]" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-legal-600 mb-1">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-legal-200 rounded focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none font-serif text-sm min-h-[44px]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-legal-600 mb-1">Role</label>
                            <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 border border-legal-200 rounded focus:border-legal-500 focus:ring-1 focus:ring-legal-500 outline-none font-serif text-sm bg-white min-h-[44px]">
                                <option>Pro Se Litigant</option>
                                <option>Attorney</option>
                                <option>Paralegal</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs text-green-600 font-bold uppercase tracking-wider">{saveMessage}</span>
                        <button onClick={handleSave} className="w-full sm:w-auto bg-legal-900 text-legal-50 px-6 py-2.5 rounded-lg font-medium hover:bg-legal-800 transition-colors uppercase tracking-wider text-xs min-h-[44px]">Save Changes</button>
                    </div>
                </div>

                {/* Data Management Card */}
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-legal-200">
                    <h3 className="text-base md:text-lg font-serif font-bold text-legal-900 mb-3 md:mb-4 border-b border-legal-100 pb-2">Data & Privacy</h3>
                    <p className="text-xs md:text-sm text-legal-600 mb-3 md:mb-4">Your case files and chat history are stored locally. Clearing data will permanently delete all uploaded files and reset your session.</p>

                    {!showConfirmClear ? (
                        <button onClick={() => setShowConfirmClear(true)} className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors uppercase tracking-wider text-xs min-h-[44px]">Clear All Local Data</button>
                    ) : (
                        <div className="bg-red-50 border border-red-200 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs md:text-sm text-red-800 font-bold text-center sm:text-left">Are you sure? This cannot be undone.</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={() => setShowConfirmClear(false)} className="flex-1 sm:flex-none bg-white text-legal-600 border border-legal-200 px-4 py-2.5 rounded-lg font-medium hover:bg-legal-50 transition-colors uppercase tracking-wider text-xs min-h-[44px]">Cancel</button>
                                <button onClick={handleClear} className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors uppercase tracking-wider text-xs min-h-[44px]">Yes, Delete</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subscription Card */}
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-legal-200">
                    <h3 className="text-base md:text-lg font-serif font-bold text-legal-900 mb-3 md:mb-4 border-b border-legal-100 pb-2">Subscription</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-legal-900">Free Tier</p>
                            <p className="text-xs text-legal-500">Local storage only. Standard AI models.</p>
                        </div>
                        <span className="bg-legal-100 text-legal-800 border border-legal-200 text-[10px] px-2 md:px-3 py-1 rounded-full font-bold uppercase tracking-wider">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [totalTokens, setTotalTokens] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Persistent State for Files
  const [files, setFiles] = useState<CaseFile[]>(() => {
    try {
        const saved = localStorage.getItem('hoosierFiles');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hoosierFiles', JSON.stringify(files));
  }, [files]);

  // Subscribe to Token Updates
  useEffect(() => {
      geminiService.setTokenListener((count) => {
          setTotalTokens(prev => prev + count);
      });
  }, []);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
  
  const Dashboard = () => (
    <div className="p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto h-full pb-safe">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-legal-900 mb-1">Welcome to Family First</h1>
          <p className="text-sm md:text-lg text-legal-600">Your AI Partner in Family Court.</p>
        </div>
        {!!deferredPrompt && (
          <button onClick={handleInstallClick} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-legal-900 text-legal-50 px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold shadow-sm min-h-[44px]">
            <Icons.Download className="w-4 h-4 shrink-0" />
            Install App
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
         <div onClick={() => setView('assistant')} className="bg-legal-900 p-5 md:p-6 rounded-2xl shadow-sm text-legal-50 cursor-pointer transform hover:scale-[1.02] transition border border-legal-800">
            <div className="bg-legal-800 w-10 h-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 border border-legal-700">
                <Icons.Chat className="w-5 h-5 text-legal-200" />
            </div>
            <h3 className="text-lg md:text-xl font-serif font-bold mb-2">AI Assistant</h3>
            <p className="text-legal-300 text-sm leading-relaxed">Chat with an expert about your case strategy and questions.</p>
         </div>

         <div onClick={() => setView('research')} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-legal-200 cursor-pointer hover:border-legal-400 hover:shadow-md transition">
            <div className="bg-legal-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 text-legal-700 border border-legal-100">
                <Icons.Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg md:text-xl font-serif font-bold text-legal-900 mb-2">Legal Research</h3>
            <p className="text-legal-600 text-sm leading-relaxed">Find Indiana precedents, statutes (Title 31), and rules.</p>
         </div>

         <div onClick={() => setView('drafting')} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-legal-200 cursor-pointer hover:border-legal-400 hover:shadow-md transition">
            <div className="bg-legal-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 text-legal-700 border border-legal-100">
                <Icons.Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg md:text-xl font-serif font-bold text-legal-900 mb-2">Draft Motions</h3>
            <p className="text-legal-600 text-sm leading-relaxed">Generate court-ready motions tailored to your facts.</p>
         </div>

         <div onClick={() => setView('files')} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-legal-200 cursor-pointer hover:border-legal-400 hover:shadow-md transition">
            <div className="bg-legal-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 text-legal-700 border border-legal-100">
                <Icons.Document className="w-5 h-5" />
            </div>
            <h3 className="text-lg md:text-xl font-serif font-bold text-legal-900 mb-2">Case Files</h3>
            <p className="text-legal-600 text-sm leading-relaxed">Manage your evidence and documents securely.</p>
         </div>
      </div>

      <div className="mt-8 md:mt-12 p-4 md:p-8 bg-white rounded-xl border border-legal-200">
          <h2 className="text-lg md:text-xl font-serif font-bold text-legal-900 mb-3 md:mb-4">Recent Case Files</h2>
          {files.length === 0 ? (
              <p className="text-legal-400 italic text-sm">No recent files.</p>
          ) : (
              <ul className="divide-y divide-legal-100">
                  {files.slice(0, 3).map(f => (
                      <li key={f.id} className="py-3 flex justify-between text-sm">
                          <span className="font-medium text-legal-700 truncate mr-2">{f.name}</span>
                          <span className="text-legal-400 shrink-0">{new Date(f.dateAdded).toLocaleDateString()}</span>
                      </li>
                  ))}
              </ul>
          )}
      </div>
    </div>
  );

  const handleClearData = () => {
    setFiles([]);
    localStorage.removeItem('ff_files');
  };

  return (
    <div className="flex flex-col-reverse md:flex-row bg-legal-50 h-[100dvh] font-sans overflow-hidden">
      <DisclaimerModal />
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        tokenUsage={totalTokens}
        onInstall={handleInstallClick}
        canInstall={!!deferredPrompt}
      />
      
      <main className="flex-1 h-full overflow-hidden relative pt-safe">
        {view === 'dashboard' && <Dashboard />}
        {view === 'assistant' && <Assistant files={files} />}
        {view === 'research' && <ResearchTool />}
        {view === 'drafting' && <MotionDrafter files={files} />}
        {view === 'files' && (
            <FileManager 
                files={files} 
                onUpload={(f) => setFiles([...files, f])} 
                onDelete={(id) => setFiles(files.filter(f => f.id !== id))} 
            />
        )}
        {view === 'profile' && <ProfileSettings onClearData={handleClearData} />}
      </main>
    </div>
  );
};

export default App;