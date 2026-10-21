import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  HelpCircle,
  XCircle,
  BrainCircuit,
  Calendar,
  BookOpen,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { ProgressBar } from '../components/common/ProgressBar';
import { RevisionModal } from '../components/revision/RevisionModal';
import { TopicModal } from '../components/topics/TopicModal';
import { SubjectModal } from '../components/subjects/SubjectModal';

export function RevisionPage({ setActivePage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal state
  const [activeModalMode, setActiveModalMode] = useState(null); // 'today', 'quick', 'practice', 'wrong', 'flashcards', 'notes', 'test'
  
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  
  const { topics, subjects = [] } = useStudy();
  
  // Real calculation for revision progress
  const completedTopics = topics.filter(t => t.status === 'Completed' || t.status === 'Revision').length;
  const totalTopics = topics.length || 1;
  const revisionProgress = Math.round((completedTopics / totalTopics) * 100);
  const pendingRevisionCount = topics.filter(t => t.status === 'Revision').length;
  
  return (
    <div className="space-y-2.5 sm:space-y-3 pb-2 max-w-7xl mx-auto font-sans animate-fade-in">
      {/* 1. Sleek Compact Header */}
      <div className="glass-card px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs">
        {/* Left: Title & Mode Tag */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <RotateCcw size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Revision Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                Revision Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Review, practice, and master your topics systematically.
            </p>
          </div>
        </div>

        {/* Right: Progress & Quick Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Overall Progress pill */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-dark-900/60 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800/70 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Overall Progress
            </span>
            <div className="w-16 sm:w-20 lg:w-24 bg-slate-200 dark:bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${revisionProgress}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-black text-indigo-600 dark:text-indigo-400 mono-number">
              {revisionProgress}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Subject</span>
            </button>
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Revision</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 2. Sleek Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search topics to revise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-slate-200 shadow-2xs transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-2xs shrink-0 cursor-pointer"
        >
          <option value="All">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSearchTerm('');
            setFilterCategory('All');
          }}
          title="Reset Filters"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:text-indigo-400 shadow-2xs transition shrink-0 active:scale-95"
        >
          <Filter size={14} />
        </button>
      </div>

      {/* 3. Revision Features 9-Grid - Screen-Adjusted (Fits on 1 Screen!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Today's Revision */}
        <div 
          onClick={() => setActiveModalMode('today')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-amber-500 hover:border-amber-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                {pendingRevisionCount > 0 ? `${pendingRevisionCount} Due Today` : 'Due Today'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Today's Revision
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Topics you have manually scheduled or marked for pending revision.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>View Pending</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 2. Quick Revision */}
        <div 
          onClick={() => setActiveModalMode('quick')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-brand-500 hover:border-brand-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <RotateCcw size={16} />
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Quick Revision
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Review important concepts, formulas, definitions, and key points in flash format.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>Start Review</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 3. Practice Questions */}
        <div 
          onClick={() => setActiveModalMode('practice')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-indigo-500 hover:border-indigo-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <HelpCircle size={16} />
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Practice Questions
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Topic-wise practice questions to solidify your understanding and test concepts.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>Solve Now</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 4. Wrong Questions */}
        <div 
          onClick={() => setActiveModalMode('wrong')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-rose-500 hover:border-rose-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle size={16} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[9px] font-bold uppercase tracking-wider">
                Needs Focus
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Wrong Questions
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Questions answered incorrectly. Revise to avoid repeating mistakes.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>Mistakes Bank</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 5. Flashcards */}
        <div 
          onClick={() => setActiveModalMode('flashcards')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-teal-500 hover:border-teal-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <BrainCircuit size={16} />
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Flashcards
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Flip through digital flashcards for important terms, formulas, and definitions.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>View Decks</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 6. My Notes */}
        <div 
          onClick={() => setActiveModalMode('notes')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-blue-500 hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              My Notes
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Access and review your important personal study notes and highlights.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>Open Notebook</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 7. Test Yourself */}
        <div 
          onClick={() => setActiveModalMode('test')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-purple-500 hover:border-purple-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Test Yourself
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Quick self-test option. Test your knowledge blindly without viewing answers first.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>Take a Quiz</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 8. Next Revision */}
        <div 
          onClick={() => setActivePage('timetable')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-emerald-500 hover:border-emerald-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                Upcoming
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Next Revision
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Check the schedule for when specific topics should be revised next.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>View Calendar</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 9. Revision Progress */}
        <div 
          onClick={() => setActivePage('analytics')}
          className="glass-card p-3.5 sm:p-4 rounded-2xl border-l-4 border-l-sky-500 hover:border-sky-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[118px] card-hover-lift"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-[9px] font-bold uppercase tracking-wider">
                Analytics
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              Revision Progress
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
              Detailed breakdown of completed vs pending revision topics and performance.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:translate-x-0.5 transition-transform">
            <span>View Stats</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>

      <RevisionModal 
        isOpen={!!activeModalMode} 
        onClose={() => setActiveModalMode(null)} 
        mode={activeModalMode} 
        setActivePage={setActivePage}
      />

      {isTopicModalOpen && (
        <TopicModal
          isOpen={isTopicModalOpen}
          onClose={() => setIsTopicModalOpen(false)}
          defaultStatus="Revision"
        />
      )}

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />
    </div>
  );
}
