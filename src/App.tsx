import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RotateCcw, 
  Trophy,
  Loader2,
  AlertCircle,
  Clock,
  Upload,
  Play,
  FileText
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: { letter: string; text: string }[];
  correctAnswers: string[];
}

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: string[]; submitted: boolean }>>({});
  
  // Phase management
  const [appState, setAppState] = useState<'landing' | 'quiz' | 'results'>('landing');

  // Enhanced parsing logic for better compatibility with various .md files
  const parseMarkdown = (text: string) => {
    // 1. Remove frontmatter if present
    let content = text;
    if (text.startsWith('---')) {
      const parts = text.split('---');
      if (parts.length >= 3) {
        content = parts.slice(2).join('---');
      }
    }

    // 2. Normalize line endings and whitespace
    content = content.replace(/\r\n/g, '\n').trim();

    // 3. Split into blocks by question numbers (e.g., "1. ", "10. ", etc.)
    // We look for a digits followed by a dot at the start of a line
    const blocks = content.split(/\n(?=\d+[\.\)])/).filter(b => b.trim() !== "");
    
    if (blocks.length === 0) return [];

    const parsed = blocks.map((block, index) => {
      // Normalize block
      const lines = block.split('\n').map(l => l.trimRight());
      
      // Question text: lines before the first option
      const optionsStartIndex = lines.findIndex(l => l.trim().match(/^[-*+]\s+([A-E])[\.\)]/));
      let questionText = "";
      if (optionsStartIndex !== -1) {
        questionText = lines.slice(0, optionsStartIndex).join('\n')
          .replace(/^\d+[\.\)]\s*/, '') // Remove numbering
          .trim();
      } else {
        questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
      }

      // Extract Options: Handle leading whitespace
      const optionMatches = [...block.matchAll(/^[ \t]*[-*+]\s+([A-E])[\.\)]\s+(.*)/gm)];
      let options = optionMatches.map(m => ({ letter: m[1], text: m[2].trim() }));

      // Fallback for options if markers are missing
      if (options.length === 0) {
        const bulletMatches = [...block.matchAll(/^[ \t]*[-*+]\s+(?!Correct answer:)(.*)/gm)];
        options = bulletMatches
          .filter(m => !m[1].toLowerCase().includes('<details') && !m[1].toLowerCase().includes('<summary'))
          .map((m, i) => ({ 
            letter: String.fromCharCode(65 + i), 
            text: m[1].trim() 
          }));
      }
      
      // Extract Correct Answer: Look for "Correct answer:" and take only the relevant letters from that line
      const ansLineMatch = block.match(/Correct answer:\s*(.*)/i);
      let correctAnswers: string[] = [];
      if (ansLineMatch) {
        // Clean the line: stop at any HTML tags or newlines
        const rawAnsLine = ansLineMatch[1].split(/<|\n/)[0].trim();
        // Pick out only the letters A, B, C, D, or E
        const letters = rawAnsLine.match(/[A-E]/gi);
        if (letters) {
          correctAnswers = [...new Set(letters.map(l => l.toUpperCase()))];
        }
      }
      
      return {
        id: index,
        text: questionText,
        options,
        correctAnswers
      };
    }).filter(q => q.options.length > 0 && q.correctAnswers.length > 0);

    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = parseMarkdown(content);
        if (parsed.length === 0) throw new Error("No valid questions found. Ensure format: '1. Question Text\n- A. Option\nCorrect answer: A'");
        setQuestions(parsed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const loadDefaultExam = async () => {
    setLoading(true);
    try {
      const response = await fetch('/practice-exam-1.md');
      if (!response.ok) throw new Error('Failed to load default exam');
      const text = await response.text();
      const parsed = parseMarkdown(text);
      setQuestions(parsed);
      setError(null);
    } catch (err) {
      setError("Error loading default exam.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (qId: number, letter: string, multi: boolean) => {
    if (answers[qId]?.submitted) return;

    setAnswers(prev => {
      const current = prev[qId]?.selected || [];
      let next: string[];

      if (multi) {
        next = current.includes(letter) 
          ? current.filter(l => l !== letter)
          : [...current, letter];
      } else {
        next = [letter];
      }

      return {
        ...prev,
        [qId]: { selected: next, submitted: false }
      };
    });
  };

  const submitAnswer = (qId: number) => {
    const q = questions[qId];
    const userAnswers = answers[qId]?.selected || [];
    if (userAnswers.length === 0) return;

    const isCorrect = userAnswers.length === q.correctAnswers.length && 
                      userAnswers.every(val => q.correctAnswers.includes(val));

    if (isCorrect) setScore(s => s + 1);
    setAnsweredCount(c => c + 1);

    setAnswers(prev => {
      const newState = {
        ...prev,
        [qId]: { ...prev[qId], submitted: true }
      };
      
      if (Object.keys(newState).filter(id => newState[Number(id)].submitted).length === questions.length) {
        setAppState('results');
      }
      
      return newState;
    });
  };

  const startQuiz = () => {
    if (questions.length === 0) return;
    setScore(0);
    setAnsweredCount(0);
    setAnswers({});
    setAppState('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetQuiz = () => {
    setAppState('landing');
    setQuestions([]);
    setAnswers({});
    setScore(0);
    setAnsweredCount(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-aws-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-aws-orange animate-spin" />
          <p className="text-slate-600 font-medium tracking-tight">Processing exam data...</p>
        </div>
      </div>
    );
  }

  // --- RENDERING LANDING PAGE ---
  if (appState === 'landing') {
    return (
      <div className="min-h-screen bg-aws-bg text-aws-text font-sans flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-aws-border p-10 text-center"
        >
          <div className="bg-aws-squid w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <BookOpen className="w-10 h-10 text-aws-orange" />
          </div>
          <h1 className="text-3xl font-black text-aws-squid mb-4 uppercase tracking-tight">AWS CCP Exam Simulator</h1>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Prepare for your AWS Certified Cloud Practitioner certification with our interactive simulation.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-4 bg-slate-50 rounded-xl border border-aws-border">
              <Clock className="w-6 h-6 text-aws-orange mx-auto mb-2" />
              <p className="text-sm font-bold text-aws-squid">Unlimited</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Time Limit</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-aws-border">
              <FileText className="w-6 h-6 text-aws-orange mx-auto mb-2" />
              <p className="text-sm font-bold text-aws-squid">{questions.length || '--'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Questions Found</p>
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <label className="group h-16 border-2 border-dashed border-aws-border rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:border-aws-orange hover:bg-[#fffaf0] transition-all">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-aws-orange transition-colors" />
                <span className="text-sm font-bold text-slate-500 group-hover:text-aws-orange transition-colors">
                  {questions.length > 0 ? `Loaded ${questions.length} Questions` : 'Upload Custom .md Quiz'}
                </span>
                <input type="file" accept=".md" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="flex gap-4">
                <button 
                  onClick={loadDefaultExam}
                  className="flex-1 h-14 bg-white border-2 border-aws-squid text-aws-squid rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Load Sample
                </button>
                <button 
                  onClick={startQuiz}
                  disabled={questions.length === 0}
                  className="flex-[2] h-14 bg-aws-orange text-aws-squid rounded-xl font-black uppercase tracking-widest hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play className="fill-current" />
                  Begin Session
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDERING QUIZ OR RESULTS ---
  return (
    <div className="min-h-screen bg-aws-bg text-aws-text font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 bg-aws-squid text-white flex items-center justify-between px-6 shadow-md shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-aws-orange w-1 h-6 rounded-full" />
          <h1 className="text-lg font-semibold tracking-tight">AWS Certified Cloud Practitioner - Practice Session</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Score Estimate:</span>
              <strong className="text-aws-orange font-mono">
                {answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0}%
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Attempted:</span>
              <strong className="font-mono">{answeredCount} / {questions.length}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-6">
        {/* Main Content Area */}
        <main className="space-y-6">
          <AnimatePresence mode="popLayout">
            {appState === 'results' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-aws-squid rounded-lg p-12 text-center text-white shadow-xl mb-12"
              >
                <Trophy className="w-16 h-16 text-aws-orange mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Session Completed</h2>
                <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto mb-10">
                  <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                    <p className="text-aws-orange text-3xl font-mono font-black">{score}</p>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Total Points</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                    <p className="text-aws-orange text-3xl font-mono font-black">{Math.round((score/questions.length)*100)}%</p>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Accuracy</p>
                  </div>
                </div>
                <button
                  onClick={resetQuiz}
                  className="px-10 py-4 bg-aws-orange text-aws-squid rounded font-black text-sm uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-lg"
                >
                  Return to Home
                </button>
              </motion.div>
            ) : (
              questions.map((q, idx) => {
                const answerState = answers[q.id];
                const isSubmitted = answerState?.submitted;
                const isMulti = q.correctAnswers.length > 1;

                return (
                  <motion.section 
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-aws-border shadow-sm overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                          Question {idx + 1} of {questions.length}
                        </div>
                        {isSubmitted && (
                          <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            q.correctAnswers.every(lv => answerState?.selected.includes(lv)) && 
                            answerState?.selected.length === q.correctAnswers.length 
                            ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {q.correctAnswers.every(lv => answerState?.selected.includes(lv)) && 
                            answerState?.selected.length === q.correctAnswers.length 
                            ? 'Correct' : 'Incorrect'}
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-medium leading-relaxed mb-8 text-[#16191f]">
                        {q.text}
                      </h3>

                      <div className="flex flex-col gap-3">
                        {q.options.map((opt) => {
                          const isSelected = answerState?.selected.includes(opt.letter);
                          const isCorrect = q.correctAnswers.includes(opt.letter);
                          
                          let stateClasses = "border-aws-border hover:bg-[#f8f9fa] hover:border-[#aab7b7]";
                          if (isSubmitted) {
                            if (isCorrect) stateClasses = "border-green-500 bg-green-50";
                            else if (isSelected) stateClasses = "border-red-400 bg-red-50";
                            else stateClasses = "opacity-60 border-slate-100";
                          } else if (isSelected) {
                            stateClasses = "border-aws-orange bg-[#fffaf0] ring-1 ring-aws-orange/20";
                          }

                          return (
                            <button
                              key={opt.letter}
                              disabled={isSubmitted}
                              onClick={() => toggleOption(q.id, opt.letter, isMulti)}
                              className={`flex items-start p-4 border rounded-md transition-all duration-150 text-left group ${stateClasses}`}
                            >
                              <div className={`w-5 h-5 rounded-sm border-2 mr-4 flex-shrink-0 flex items-center justify-center text-[11px] font-bold transition-colors mt-0.5 ${
                                isSelected 
                                  ? 'bg-aws-orange border-aws-orange text-white' 
                                  : 'border-[#687078] text-[#687078]'
                              }`}>
                                {opt.letter}
                              </div>
                              <div className="text-[15px] leading-snug">
                                {opt.text}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {!isSubmitted && (
                        <div className="mt-10 flex justify-end">
                          <button
                            onClick={() => submitAnswer(q.id)}
                            disabled={!answerState || answerState.selected.length === 0}
                            className="px-6 py-2.5 bg-aws-orange text-aws-squid rounded font-bold text-sm hover:brightness-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-aws-orange group"
                          >
                            Submit Answer
                          </button>
                        </div>
                      )}

                      {isSubmitted && (
                        <div className="mt-8 p-6 bg-slate-50 border-l-4 border-aws-squid rounded-r-lg">
                          <p className="text-sm font-bold text-aws-squid mb-1 uppercase tracking-wider">Correct Answer(s)</p>
                          <p className="text-lg font-bold text-aws-orange">{q.correctAnswers.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </motion.section>
                );
              })
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-[88px] h-fit">
          <div className="bg-white border border-aws-border rounded-lg p-5">
            <h4 className="text-[12px] font-bold text-aws-squid mb-4 uppercase tracking-[0.5px]">Progress Map</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const answerState = answers[q.id];
                const isSubmitted = answerState?.submitted;
                const isCorrect = isSubmitted && 
                                 answerState?.selected.length === q.correctAnswers.length && 
                                 answerState?.selected.every(val => q.correctAnswers.includes(val));

                return (
                  <div 
                    key={q.id}
                    title={`Question ${i + 1}`}
                    className={`aspect-square rounded border flex items-center justify-center text-[11px] font-bold transition-all ${
                      isSubmitted 
                        ? (isCorrect ? 'bg-aws-squid text-white border-aws-squid' : 'bg-red-500 text-white border-red-500')
                        : (answerState?.selected.length > 0 ? 'border-aws-orange text-aws-orange font-black' : 'border-aws-border text-slate-400 hover:border-slate-400 cursor-pointer')
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-aws-border rounded-lg p-5">
            <h4 className="text-[12px] font-bold text-aws-squid mb-4 uppercase tracking-[0.5px]">Final Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Attempted</span>
                <span className="font-bold">{answeredCount} / {questions.length}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Remaining</span>
                <span className="font-bold">{questions.length - answeredCount}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  className="h-full bg-aws-orange"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#fff3cd] border border-[#ffeeba] rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#856404] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#856404] leading-relaxed italic">
              <strong>Tip:</strong> You can upload any standard <code>README.md</code> or <code>.md</code> file as long as it follows the question format.
            </p>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-16 bg-white border-t border-aws-border flex items-center justify-between px-6 shrink-0 z-50">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          AWS Training and Certification Session
        </div>
        <div className="flex gap-3">
          <button 
            onClick={resetQuiz}
            className="px-6 py-2 border border-aws-border rounded text-sm font-bold text-aws-squid hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Exit Session
          </button>
        </div>
      </footer>
    </div>
  );
}
