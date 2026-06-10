import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Database, Cpu, Send, Layers, HelpCircle } from 'lucide-react';

export default function DemoRAGChatbot({ onBack }) {
  const [ingestedFile, setIngestedFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [matchedChunkIds, setMatchedChunkIds] = useState([]);
  const [chatLog, setChatLog] = useState([
    { role: 'assistant', text: 'Hello! I have loaded the system manuals. Ingest any PDF or ask questions about security guidelines.' }
  ]);
  const [systemLogs, setSystemLogs] = useState({
    retrievedContext: '',
    generatedPrompt: '',
    embeddingOutput: ''
  });

  // Pre-configured document library
  const docLibrary = {
    'policy.txt': `COMPANY REFUND POLICY: All standard digital subscriptions qualify for a full 100% refund within 14 business days of initial invoice registration. Account modifications and partial credits are handled automatically by the API gateway billing service, executing adjustments over high-speed gRPC nodes. Cancellations beyond 14 days do not qualify for refunds but account remains active until end of billing cycle.`,
    'security_rules.pdf': `SECURITY ACCESS CONTROLS: Granular authentication boundaries are managed via Gateway-level token claims. System roles include ADMIN, RECEPTIONIST, PHYSICIAN, and PATIENT. Admin credentials contain authorization scopes to query Elasticsearch logs and Kafka metrics. Receptionists can register patient demography and modify scheduling ledgers. Physicians view clinician calendars.`
  };

  const handleDocumentIngest = (fileName) => {
    setIsIngesting(true);
    setSystemLogs({ retrievedContext: '', generatedPrompt: '', embeddingOutput: 'Calculating document hashes...' });
    
    setTimeout(() => {
      const text = docLibrary[fileName];
      // Split into 3 chunks for visualization
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const items = sentences.map((sentence, idx) => ({
        id: `chunk-${idx + 1}`,
        text: sentence.trim(),
        coords: { x: 30 + Math.random() * 50, y: 30 + Math.random() * 50 }, // Random spatial embedding coordinates
        vector: Array.from({ length: 6 }, () => (Math.random() * 2 - 1).toFixed(3))
      }));

      setIngestedFile(fileName);
      setChunks(items);
      setIsIngesting(false);
      setSystemLogs(prev => ({
        ...prev,
        embeddingOutput: `Successfully created ${items.length} vector chunks.\nIngested vectors generated using Cohere Multilingual v3 dimension mapping.\n` + 
                         items.map(item => `[${item.id}]: [${item.vector.join(', ')}]`).join('\n')
      }));
    }, 1200);
  };

  const handleSearchQuery = (e) => {
    e.preventDefault();
    if (!query) return;

    setIsQuerying(true);
    // Add User Message
    setChatLog(prev => [...prev, { role: 'user', text: query }]);

    setTimeout(() => {
      // Find matching chunks based on simple keyword checks to simulate Cosine Similarity
      let matches = [];
      if (query.toLowerCase().includes('refund') || query.toLowerCase().includes('cancel') || query.toLowerCase().includes('credit')) {
        matches = chunks.filter(c => c.id === 'chunk-1' || c.id === 'chunk-2');
      } else if (query.toLowerCase().includes('security') || query.toLowerCase().includes('role') || query.toLowerCase().includes('admin')) {
        matches = chunks.filter(c => c.id === 'chunk-3' || c.id === 'chunk-4');
      } else {
        // Default select random 2
        matches = chunks.slice(0, 2);
      }

      const matchIds = matches.map(m => m.id);
      setMatchedChunkIds(matchIds);

      const retrievedText = matches.map(m => `[${m.id}] ${m.text}`).join('\n\n');
      
      const promptTemplate = `[System Context Retrieval Injected]\n` + 
                             `You are an AI assistant. Answer the user question strictly using the provided context chunks. If unknown, reply "not found".\n\n` +
                             `Context:\n${retrievedText}\n\n` +
                             `User Question: ${query}\n` +
                             `Response:`;

      // Formulate LLM response
      let answerText = "I couldn't locate specific information about that in the ingested documents. Please ensure the relevant file is loaded.";
      if (matches.length > 0) {
        if (query.toLowerCase().includes('refund')) {
          answerText = "According to the Company Refund Policy, standard digital subscriptions qualify for a 100% refund if requested within 14 business days. Ledger cancellations and credits are automated via gRPC in the billing module.";
        } else if (query.toLowerCase().includes('security') || query.toLowerCase().includes('role')) {
          answerText = "Security credentials are bound by role authorization at the gateway. The roles configured in the access matrix are ADMIN, RECEPTIONIST, PHYSICIAN, and PATIENT, with Admin having access to ELK logs and Kafka event topics.";
        } else {
          answerText = `Based on the ingested document, ${matches[0]?.text.slice(0, 100)}...`;
        }
      }

      setSystemLogs(prev => ({
        ...prev,
        retrievedContext: retrievedText || 'None matched.',
        generatedPrompt: promptTemplate
      }));

      setChatLog(prev => [...prev, { role: 'assistant', text: answerText }]);
      setIsQuerying(false);
      setQuery('');
    }, 1500);
  };

  return (
    <div className="page-container">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>
        <span className="text-xs font-mono text-slate-500">Retrieval-Augmented Generation visualizer</span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">
          RAGChatbot <span className="text-violet-400 glow-text-violet">Vector Search Engine</span>
        </h2>
        <p className="text-slate-400 text-sm font-light mt-1">Ingest document structures, visualize embedding vector indexes, and run LLM QA prompts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Ingestion pipeline & Vector Map */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Document ingestion Console */}
          <div className="glass p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Document Vector Ingestion Pipeline
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-light">
              Select an enterprise asset file. The document parser will slice paragraphs into discrete chunks and project them into the vector database.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleDocumentIngest('policy.txt')}
                disabled={isIngesting}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  ingestedFile === 'policy.txt' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5'
                }`}
              >
                Ingest policy.txt
              </button>
              <button
                onClick={() => handleDocumentIngest('security_rules.pdf')}
                disabled={isIngesting}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  ingestedFile === 'security_rules.pdf' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5'
                }`}
              >
                Ingest security_rules.pdf
              </button>
            </div>

            {isIngesting && (
              <div className="text-center py-6 text-xs text-indigo-400 font-mono flex items-center justify-center gap-2">
                <Database className="w-4 h-4 animate-spin" /> Chunking raw text and generating embeddings...
              </div>
            )}

            {chunks.length > 0 && !isIngesting && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Document text chunks (character length check)</span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                  {chunks.map((chk, idx) => (
                    <div
                      key={chk.id}
                      className={`p-2.5 rounded-lg border text-xs font-light transition-all ${
                        matchedChunkIds.includes(chk.id) ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100 font-medium' : 'bg-black/30 border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-slate-500">
                        <span>{chk.id}</span>
                        <span>Len: {chk.text.length} chars</span>
                      </div>
                      "{chk.text}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Spatial Vector Search Visualizer */}
          <div className="glass p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Embedding Vector Space Projection
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-light">
              SVG 2D coordinate mapping of the vector store database. Shows relative distance between query and index nodes.
            </p>

            <div className="h-56 bg-slate-950 rounded-xl border border-white/5 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Coordinate Grid */}
                <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                
                {/* Ingested Chunk Nodes */}
                {chunks.map(chk => {
                  const isMatched = matchedChunkIds.includes(chk.id);
                  return (
                    <g key={chk.id} transform={`translate(${chk.coords.x}, ${chk.coords.y})`}>
                      <circle
                        r={isMatched ? "5" : "3.5"}
                        fill={isMatched ? "var(--color-emerald)" : "var(--color-violet)"}
                        className={isMatched ? "animate-pulse" : ""}
                        style={{ transition: 'all 0.5s' }}
                      />
                      <text y="-6" fill="var(--color-text-secondary)" fontSize="5" textAnchor="middle" fontFamily="var(--font-mono)">{chk.id}</text>
                      {/* Connection trace to query node if matched */}
                      {isMatched && (
                        <line
                          x1="0" y1="0" x2={50 - chk.coords.x} y2={50 - chk.coords.y}
                          stroke="var(--color-emerald)" strokeWidth="0.5" strokeDasharray="2, 2"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Query Node */}
                {matchedChunkIds.length > 0 && (
                  <g transform="translate(50, 50)">
                    <circle r="4.5" fill="var(--color-rose)" />
                    <text y="-7" fill="var(--color-rose)" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">Query</text>
                  </g>
                )}
              </svg>
              {chunks.length === 0 && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs text-slate-500 italic">
                  Ingest a document to populate the vector space.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat interface & Injected Prompts */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Chat simulator */}
          <div className="glass p-6 flex flex-col justify-between h-[450px]">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                RAG Ingestion Query Console
              </h3>
              
              <div className="h-[280px] overflow-y-auto pr-2 flex flex-col gap-3 text-xs mb-4">
                {chatLog.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl max-w-[85%] font-light leading-relaxed ${
                      chat.role === 'assistant' ? 'bg-white/5 border border-white/5 text-slate-300 self-start' : 'bg-indigo-600 text-white self-end'
                    }`}
                  >
                    <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1">{chat.role}</span>
                    {chat.text}
                  </div>
                ))}
                {isQuerying && (
                  <div className="text-slate-500 text-xs italic self-start animate-pulse">
                    VectorDB querying, consolidating contexts, executing prompt...
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSearchQuery} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about refunds or security roles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={chunks.length === 0 || isQuerying}
                className="flex-grow text-xs"
              />
              <button
                type="submit"
                disabled={chunks.length === 0 || isQuerying}
                className="btn-primary"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Prompt Engineering Console */}
          <div className="glass p-4 bg-slate-950 flex flex-col border border-white/5 rounded-xl font-mono text-[10px]">
            <span className="text-xs font-bold text-indigo-400 mb-3 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Augmented Prompt & System Logs
            </span>

            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
              {systemLogs.embeddingOutput && (
                <div>
                  <span className="text-slate-500">EMBEDDING VECTORS INGESTION LOG:</span>
                  <pre className="text-slate-400 bg-black/40 p-2 rounded mt-1 overflow-x-auto max-w-full">{systemLogs.embeddingOutput}</pre>
                </div>
              )}
              {systemLogs.retrievedContext && (
                <div>
                  <span className="text-emerald-400">RETRIEVED VECTOR CONTEXTS:</span>
                  <pre className="text-slate-300 bg-black/40 p-2 rounded mt-1 overflow-x-auto max-w-full">{systemLogs.retrievedContext}</pre>
                </div>
              )}
              {systemLogs.generatedPrompt && (
                <div>
                  <span className="text-violet-400">LLM REASONING PROMPT TEMPLATE:</span>
                  <pre className="text-slate-300 bg-black/40 p-2 rounded mt-1 overflow-x-auto max-w-full">{systemLogs.generatedPrompt}</pre>
                </div>
              )}
              {!systemLogs.embeddingOutput && (
                <div className="text-center py-6 text-slate-600 italic">
                  Logs are generated here as document indices are computed and queries are triggered.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
