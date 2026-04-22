/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Download, 
  MessageCircle, 
  GraduationCap, 
  Pencil, 
  Volume2, 
  ChevronRight, 
  Languages,
  Loader2,
  Trash2,
  Play
} from 'lucide-react';
import { DifficultyLevel, LessonChapter, VocabularyItem, DialogueLine, GrammarPoint, Exercise } from './types';
import { generateLesson } from './services/geminiService';
import { exportLessonToHTML, downloadHTML } from './lib/exporter';

export default function App() {
  const [chapters, setChapters] = useState<LessonChapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'vocab' | 'grammar' | 'exercises'>('dialogue');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [courseLanguage, setCourseLanguage] = useState('Inglese');
  const [courseLevel, setCourseLevel] = useState<DifficultyLevel>('A1');
  const [newTopic, setNewTopic] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('LINGUACRAFT_API_KEY') || '');
  const [showSettings, setShowSettings] = useState(false);

  const activeChapter = chapters[activeChapterIndex];

  // Helper for TTS
  const speak = (text: string) => {
    const langMap: Record<string, string> = {
      'Inglese': 'en-US',
      'Francese': 'fr-FR',
      'Spagnolo': 'es-ES',
      'Tedesco': 'de-DE',
      'Giapponese': 'ja-JP',
      'Coreano': 'ko-KR',
      'Russo': 'ru-RU',
      'Cinese': 'zh-CN'
    };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[courseLanguage] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerate = async () => {
    if (!newTopic) return;
    setIsGenerating(true);
    try {
      const lesson = await generateLesson(courseLanguage, courseLevel, newTopic, apiKey);
      setChapters(prev => [...prev, lesson]);
      setActiveChapterIndex(chapters.length);
      setShowGenModal(false);
      setNewTopic('');
    } catch (error: any) {
      console.error(error);
      alert(`Errore: ${error.message || 'imprevisto durante la generazione'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteChapter = (index: number) => {
    const newChapters = chapters.filter((_, i) => i !== index);
    setChapters(newChapters);
    if (activeChapterIndex >= newChapters.length) {
      setActiveChapterIndex(Math.max(0, newChapters.length - 1));
    }
  };

  const handleExport = () => {
    if (chapters.length === 0) return;
    const html = exportLessonToHTML(`${courseLanguage} - Livello ${courseLevel}`, chapters);
    downloadHTML(`lezione_${courseLanguage.toLowerCase()}.html`, html);
  };

  useEffect(() => {
    localStorage.setItem('LINGUACRAFT_API_KEY', apiKey);
  }, [apiKey]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl ring-4 ring-blue-50">L</div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">LinguaCraft</h1>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Configura API Key"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">LIVELLO CORRENTE</p>
            <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-sm font-semibold">{courseLanguage} {courseLevel}</span>
              <span className="text-[9px] font-bold uppercase bg-blue-200 px-2 py-0.5 rounded text-blue-800 tracking-tighter">Attivo</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Capitoli</h3>
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4 opacity-40">
              <BookOpen size={40} className="text-slate-300" />
              <p className="text-xs font-medium">Nessun capitolo disponibile. Inizia cliccando su "Crea Lezione".</p>
            </div>
          ) : (
            chapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`group flex items-center justify-between gap-3 p-3 rounded-lg transition-all text-left cursor-pointer ${
                  activeChapterIndex === idx 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded shrink-0 ${
                    activeChapterIndex === idx ? 'bg-slate-700' : 'bg-slate-100 text-slate-400'
                  }`}>{idx + 1}</span>
                  <div className="truncate font-medium text-sm">{chapter.title}</div>
                </div>
                <div 
                  role="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteChapter(idx); }}
                  className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity cursor-pointer ${
                    activeChapterIndex === idx ? 'text-slate-400 hover:text-white' : 'text-slate-300 hover:text-red-500'
                  }`}
                >
                  <Trash2 size={12} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={() => setShowGenModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 active:scale-95"
          >
            <Plus size={18} />
            <span className="text-sm">Crea Lezione</span>
          </button>
          <button 
            onClick={handleExport}
            disabled={chapters.length === 0}
            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
          >
            <Download size={16} strokeWidth={2.5} />
            Esporta HTML
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!activeChapter ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-8 bg-white"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 blur-3xl opacity-30 rounded-full scale-150"></div>
                <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center relative border border-slate-200">
                  <Languages size={64} strokeWidth={1} className="text-blue-600" />
                </div>
              </div>
              <div className="max-w-md space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-sans">Pronto a imparare?</h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Crea moduli didattici professionali con dialoghi, grammatica ed esercizi interattivi.
                </p>
                <div className="pt-4">
                  <button 
                    onClick={() => setShowGenModal(true)}
                    className="bg-blue-600 px-8 py-4 rounded-xl shadow-xl shadow-blue-100 font-bold text-white hover:bg-blue-700 transition-all active:scale-95 inline-flex items-center gap-3"
                  >
                    Genera nuovo corso <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeChapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col h-full bg-[#F8FAFC]"
            >
              <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm relative z-10">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Capitolo {activeChapterIndex + 1}</span>
                    <h2 className="text-xl font-bold text-slate-900 truncate max-w-[400px]">{activeChapter.title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 flex items-center gap-1.5 capitalize">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      Pronto all'uso
                   </div>
                   <div className="w-px h-6 bg-slate-200"></div>
                   <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">{activeChapter.difficulty}</span>
                </div>
              </header>

              <nav className="bg-white px-10 border-b border-slate-200 flex gap-10">
                {[
                  { id: 'dialogue', label: 'Dialoghi', icon: <MessageCircle size={16} /> },
                  { id: 'vocab', label: 'Vocaboli', icon: <BookOpen size={16} /> },
                  { id: 'grammar', label: 'Grammatica', icon: <GraduationCap size={16} /> },
                  { id: 'exercises', label: 'Esercizi', icon: <Pencil size={16} /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative py-4 group transition-all ${
                      activeTab === tab.id 
                        ? 'text-blue-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {tab.icon}
                      {tab.label}
                    </div>
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 shadow-[0_-2px_4px_rgba(37,99,235,0.2)]" 
                      />
                    )}
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-10 font-sans">
                <div className="max-w-5xl mx-auto flex gap-10 items-start">
                  {/* Left Column - Main Content */}
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                          {activeTab === 'dialogue' ? 'Visualizzatore Dialogo' : activeTab === 'vocab' ? 'Elenco Vocaboli' : activeTab === 'grammar' ? 'Regole Grammaticali' : 'Esercizi di Verifica'}
                        </span>
                    </div>
                    
                    <div className="p-8">
                      {activeTab === 'dialogue' && (
                        <div className="space-y-6 font-serif leading-relaxed">
                          {activeChapter.dialogue.map((line, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={idx} 
                              className="flex gap-6"
                            >
                              <div className="w-24 shrink-0 pt-2 text-right">
                                <button 
                                  onClick={() => speak(line.text)}
                                  className="group flex flex-col items-end gap-1.5"
                                >
                                  <span className={`text-[10px] font-bold font-sans tracking-widest uppercase ${idx % 2 === 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                                    {line.speaker}
                                  </span>
                                  <Volume2 size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </button>
                              </div>
                              <div className="flex-1 border-l-4 border-slate-100 pl-6 space-y-2 group">
                                <p className="text-xl italic text-slate-700 bg-slate-50/30 p-3 rounded-r-xl border-y border-r border-transparent hover:border-slate-100 transition-all">
                                  "{line.text}"
                                </p>
                                <p className="text-sm font-sans not-italic text-slate-400 pl-1">{line.translation}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'vocab' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeChapter.vocabulary.map((v, idx) => (
                            <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 hover:bg-white hover:shadow-md transition-all group">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-lg font-bold text-slate-900 font-sans">{v.word}</h4>
                                <button onClick={() => speak(v.word)} className="text-slate-200 hover:text-blue-600"><Play size={14} fill="currentColor" /></button>
                              </div>
                              <p className="text-blue-600 font-bold mb-3">{v.translation}</p>
                              <div className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-100 pt-3 mt-3">
                                <span className="font-sans not-italic font-bold text-[9px] uppercase text-slate-400 block mb-1">Esempio</span>
                                "{v.example}"
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'grammar' && (
                        <div className="space-y-10">
                          {activeChapter.grammar.map((g, idx) => (
                            <div key={idx} className="space-y-4">
                              <h3 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                                {g.title}
                              </h3>
                              <p className="text-slate-600 leading-relaxed">{g.explanation}</p>
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
                                {g.examples.map((ex, i) => (
                                  <div key={i} className="flex items-center gap-3 text-slate-800 font-medium">
                                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                    <span className="italic">"{ex}"</span>
                                    <button onClick={() => speak(ex)} className="text-blue-200 hover:text-blue-600"><Volume2 size={12} /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'exercises' && (
                        <div className="space-y-6">
                          {activeChapter.exercises.map((e, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:border-blue-200 transition-colors">
                              <div className="flex justify-between items-center mb-5">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compito {idx + 1}</span>
                                 <span className="text-[9px] font-bold bg-white px-2 py-1 rounded shadow-sm border border-slate-200 uppercase text-slate-500">{e.type.replace(/-/g, ' ')}</span>
                              </div>
                              <p className="text-lg font-bold text-slate-900 mb-6">{e.question}</p>
                              
                              {e.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                  {e.options.map((opt, i) => (
                                    <button key={i} className="text-left py-3 px-5 rounded-xl border border-white bg-white shadow-sm hover:border-blue-600 hover:bg-blue-50 transition-all font-medium text-slate-700">
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}

                              <details className="group">
                                <summary className="list-none text-xs font-bold text-blue-600 cursor-pointer hover:underline inline-flex items-center gap-2">
                                  Vedi Correzione <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-4 p-5 bg-white rounded-xl border border-slate-200 shadow-inner">
                                   <p className="font-bold text-lg text-slate-900">Risposta: {e.answer}</p>
                                   {e.explanation && <p className="text-sm text-slate-500 mt-2">{e.explanation}</p>}
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Secondary Inspector */}
                  <div className="w-80 space-y-6 shrink-0">
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
                          Note di Supporto
                        </h3>
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                          <p className="text-xs font-bold text-orange-800 mb-1 leading-tight">Focus del Capitolo</p>
                          <p className="text-[11px] text-orange-700/80 leading-relaxed italic">
                            Oggi ci concentriamo sull'ascolto attivo e sulle strutture di base per le interazioni quotidiane. Usa il lettore audio per ogni frase.
                          </p>
                        </div>
                     </div>

                     <div className="bg-slate-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden ring-4 ring-slate-100">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-2xl rounded-full"></div>
                        <h3 className="text-[10px] font-bold mb-5 flex items-center gap-2 uppercase tracking-widest text-slate-500">Status Sistema AI</h3>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-blue-600/30">
                            <Languages size={24} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5 uppercase tracking-tighter">Gemini 3 Flash</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Online & Ready</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4 relative z-10">
                          <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden">
                             <motion.div initial={{ width: "30%" }} animate={{ width: "75%" }} className="h-full bg-blue-400" />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase">
                            <span>Sincronizzazione</span>
                            <span>Completa</span>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Generator Modal */}
      <AnimatePresence>
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGenerating && setShowGenModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
            >
              {isGenerating ? (
                <div className="p-20 flex flex-col items-center justify-center text-center gap-10">
                  <div className="relative">
                    <Loader2 size={96} className="text-blue-600 animate-spin stroke-1" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Languages size={36} className="text-slate-900" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-900">Creazione in corso...</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">L'intelligenza artificiale sta componendo testi, dialoghi e audio per la tua lezione.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900 p-12 text-white relative">
                     <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-3 leading-tight tracking-tight">Nuovo Capitolo</h2>
                        <p className="text-slate-400 text-sm font-medium">Definisci l'argomento e lascia che l'AI strutturi il contenuto professionale.</p>
                     </div>
                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
                  </div>
                  <div className="p-12 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lingua Obiettivo</label>
                        <select 
                          value={courseLanguage}
                          onChange={(e) => setCourseLanguage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 font-semibold appearance-none cursor-pointer outline-none shadow-sm"
                        >
                          {['Inglese', 'Francese', 'Spagnolo', 'Tedesco', 'Giapponese', 'Coreano', 'Russo', 'Cinese'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Livello CEFR</label>
                         <select 
                          value={courseLevel}
                          onChange={(e) => setCourseLevel(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 font-bold appearance-none cursor-pointer outline-none shadow-sm"
                        >
                          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Argomento Didattico</label>
                      <input 
                        type="text" 
                        placeholder="Es: Fare acquisti in un mercato locale..."
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-300 outline-none shadow-sm focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex gap-4 pt-2">
                       <button 
                        onClick={() => setShowGenModal(false)}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-4 rounded-xl transition-all shadow-sm"
                       >
                        Annulla
                       </button>
                       <button 
                        onClick={handleGenerate}
                        disabled={!newTopic}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                       >
                        Inizia Generazione
                        <ChevronRight size={20} />
                       </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
<AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Configurazione API
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Gemini API Key</label>
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Inserisci la tua chiave API..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      La chiave API viene salvata nel tuo browser e non viene condivisa con nessuno. Necessaria per il funzionamento su Netlify.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Salva e Chiudi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
