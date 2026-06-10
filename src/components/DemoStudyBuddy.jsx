import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Volume2, HelpCircle, Award, Languages, Cpu, Play, Square, MessageSquare } from 'lucide-react';

export default function DemoStudyBuddy({ onBack }) {
  const [selectedAgent, setSelectedAgent] = useState('SOCRATIC');
  const [topic, setTopic] = useState('Binary Search');
  const [userMsg, setUserMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Agent descriptions
  const agents = {
    SOCRATIC: {
      name: 'Socratic Tutor',
      description: 'Asks leading questions to help the student reach the solution independently. Never gives direct answers.',
      accent: 'var(--color-violet)',
      intro: 'Excellent topic! To understand Binary Search, let me ask you: if you had a physical dictionary, how would you look up the word "Algorithm"? Would you start from page 1 and turn them one by one?'
    },
    ANALOGY: {
      name: 'Analogy Mapper',
      description: 'Explains complex computer science and math concepts using everyday real-world metaphors.',
      accent: 'var(--color-cyan)',
      intro: 'Binary Search is like guessing a number between 1 and 100. If you guess 50 and I say "Too high", you instantly throw away all numbers from 50 to 100! That is Binary Search in action.'
    },
    EXAMINER: {
      name: 'Exam Proctor',
      description: 'Generates mock quiz questions, grades answers, and provides feedback to reinforce revision.',
      accent: 'var(--color-amber)',
      intro: 'Let us test your knowledge on Binary Search. Here is your question: What is the worst-case time complexity of searching a sorted array of size N?'
    }
  };

  // Conversation logs by Agent
  const [conversations, setConversations] = useState({
    SOCRATIC: [{ sender: 'agent', text: agents.SOCRATIC.intro }],
    ANALOGY: [{ sender: 'agent', text: agents.ANALOGY.intro }],
    EXAMINER: [{ sender: 'agent', text: agents.EXAMINER.intro }]
  });

  // LLM routing system log
  const [routingLog, setRoutingLog] = useState(
    `[Orchestrator] Selected Topic: Binary Search\n[Router] Query mapped to SOCRATIC agent node\n[System Prompt Injected] Role: Socratic, Constraint: No direct answers`
  );

  // Examiner Quiz States
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState('');

  // Audio summary player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userMsg.trim()) return;

    const currentMsg = userMsg;
    // Add user message
    setConversations(prev => ({
      ...prev,
      [selectedAgent]: [...prev[selectedAgent], { sender: 'user', text: currentMsg }]
    }));
    setUserMsg('');
    setIsTyping(true);

    // Update orchestrator logs
    setRoutingLog(prev => 
      `[Orchestrator] Input: "${currentMsg}"\n` + 
      `[Router] Forwarding to ${selectedAgent} Agent...\n` +
      `[LLM Context] Preserving conversation history (Ollama stateful feed)`
    );

    setTimeout(() => {
      let reply = "";
      if (selectedAgent === 'SOCRATIC') {
        if (currentMsg.toLowerCase().includes('middle') || currentMsg.toLowerCase().includes('half') || currentMsg.toLowerCase().includes('open')) {
          reply = "Precisely! You would open it somewhere in the middle. Now, if the word you found is 'Puzzles', and you want 'Algorithm', in which direction (left or right) will you search next, and why?";
        } else {
          reply = "Let's think. If you turned pages one by one, it would take too long. How can you find it faster using the alphabetical sorting of the book?";
        }
      } else if (selectedAgent === 'ANALOGY') {
        reply = "Exactly! Throwing away half the list at every step is why it's so fast. It's like ripping the phone book in half. In computer science, we call this O(log N) efficiency.";
      } else if (selectedAgent === 'EXAMINER') {
        reply = "Provide your answer below by selecting one of the multiple-choice options, and I will evaluate your understanding.";
      }

      setConversations(prev => ({
        ...prev,
        [selectedAgent]: [...prev[selectedAgent], { sender: 'agent', text: reply }]
      }));
      setIsTyping(false);
    }, 1500);
  };

  const handleQuizSubmit = () => {
    if (!selectedQuizAnswer) return;
    setQuizSubmitted(true);
    if (selectedQuizAnswer === 'O(log N)') {
      setQuizFeedback("Correct! In each iteration of Binary Search, we reduce the search space by half. Thus, the worst-case number of operations for array size N is log2(N). O(log N) is highly optimal!");
    } else {
      setQuizFeedback(`Incorrect. You selected ${selectedQuizAnswer}. Remember, we divide the search space in half at each step. Thus, the complexity is logarithmic: O(log N), not linear or quadratic.`);
    }
  };

  const toggleAudioPlayer = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      // simulate audio progress
      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 5;
        });
      }, 500);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>
        <span className="text-xs font-mono text-slate-500">Multi-Agent Cognitive Routing</span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">
          StudyBuddy <span className="text-violet-400 glow-text-violet">AI Learning Lab</span>
        </h2>
        <p className="text-slate-400 text-sm font-light mt-1">Chat with pedagogical specialist agents and generate interactive exams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Agent Selector & Controller */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Topic Select */}
          <div className="glass p-5">
            <span className="text-[10px] text-slate-500 font-mono uppercase">LEARNING TOPIC</span>
            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setRoutingLog(prev => `[Orchestrator] Topic updated to ${e.target.value}\n[Router] Resetting conversation context buffers`);
              }}
              className="w-full mt-2"
            >
              <option value="Binary Search">Binary Search</option>
              <option value="Recursion in Programming">Recursion in Programming</option>
              <option value="Database Indexing">Database Indexing</option>
            </select>
          </div>

          {/* Agent Persona selection */}
          <div className="glass p-5 flex flex-col gap-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase">CHOOSE COGNITIVE AGENT</span>
            
            {Object.keys(agents).map(key => {
              const isActive = selectedAgent === key;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedAgent(key);
                    setRoutingLog(prev => `[Router] Query mapped to ${key} agent node\n[System Prompt] Routing constraints updated.`);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-white">{agents[key].name}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agents[key].accent }}></span>
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">{agents[key].description}</p>
                </div>
              );
            })}
          </div>

          {/* Audio summaries module */}
          <div className="glass p-5 flex flex-col gap-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase">COQUI TTS PODCAST GENERATOR</span>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3">
              <Volume2 className="w-8 h-8 text-indigo-400" />
              <div className="text-center">
                <span className="text-xs text-slate-300 font-medium">Topic Summary Podcast</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Synthesized using Coqui multi-voice TTS</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-indigo-500" style={{ width: `${audioProgress}%` }}></div>
              </div>

              <button
                onClick={toggleAudioPlayer}
                className="btn-primary py-1 px-4 text-xs flex items-center gap-1.5"
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5" /> Stop summary
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Play audio summary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Chat box & Quiz / Logs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Chat dialogue wrapper */}
          <div className="glass p-6 flex flex-col justify-between h-[420px]">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                ACTIVE SESSION WITH {agents[selectedAgent].name}
              </span>
              
              <div className="h-[280px] overflow-y-auto pr-2 mt-4 flex flex-col gap-3 text-xs">
                {conversations[selectedAgent].map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl max-w-[80%] font-light leading-relaxed ${
                      msg.sender === 'agent' ? 'bg-white/5 border border-white/5 text-slate-300 self-start' : 'bg-indigo-600 text-white self-end'
                    }`}
                  >
                    <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1">
                      {msg.sender === 'agent' ? agents[selectedAgent].name : 'Student'}
                    </span>
                    {msg.text}
                  </div>
                ))}
                
                {isTyping && (
                  <span className="text-slate-500 text-xs italic self-start animate-pulse">
                    {agents[selectedAgent].name} is thinking...
                  </span>
                )}
              </div>
            </div>

            {selectedAgent !== 'EXAMINER' ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or reply to the tutor..."
                  value={userMsg}
                  onChange={(e) => setUserMsg(e.target.value)}
                  disabled={isTyping}
                  className="flex-grow text-xs"
                />
                <button
                  type="submit"
                  disabled={isTyping}
                  className="btn-primary"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* MCQ Quiz Interface for Examiner */
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex flex-col gap-2 mb-3">
                  {['O(N)', 'O(log N)', 'O(1)', 'O(N log N)'].map((opt) => (
                    <label
                      key={opt}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition-all ${
                        selectedQuizAnswer === opt ? 'bg-indigo-500/10 border-indigo-500' : 'bg-black/10 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="quiz"
                        value={opt}
                        checked={selectedQuizAnswer === opt}
                        onChange={(e) => setSelectedQuizAnswer(e.target.value)}
                        disabled={quizSubmitted}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={!selectedQuizAnswer}
                    className="w-full btn-primary text-xs py-2 justify-center"
                  >
                    Submit Practice Answer
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <p className="text-xs font-semibold text-slate-300">Examiner Feedback:</p>
                    <p className="text-xs font-light text-slate-400 bg-black/40 p-3 rounded-lg border border-white/5">{quizFeedback}</p>
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setSelectedQuizAnswer(null);
                        setQuizFeedback('');
                      }}
                      className="btn-secondary py-1 text-xs justify-center"
                    >
                      Reset Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Orchestrator Logs */}
          <div className="glass p-4 bg-slate-950/90 flex flex-col border border-white/5 rounded-xl font-mono text-[10px]">
            <span className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Agent Router Orchestration telemetry
            </span>
            <pre className="text-slate-400 max-h-32 overflow-y-auto pr-2 bg-black/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
              {routingLog}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
