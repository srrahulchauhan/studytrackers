import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { formatSecondsToHMS } from '../../utils/timerUtils';

export function StudyHistoryTable({
  sessions = [],
  subjects = [],
  topics = [],
  preparations = [],
  attendance = [],
  onViewDetails,
  onDeleteSession,
  onExportFilteredExcel,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc | date_asc | duration_desc | duration_asc
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const subMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects]);
  const topicMap = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, t.name])), [topics]);
  const topicObjMap = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, t])), [topics]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search query by subject or topic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const subName = (subMap[s.subjectId] || '').toLowerCase();
        const topName = (topicMap[s.topicId] || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        return subName.includes(q) || topName.includes(q) || notes.includes(q);
      });
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter((s) => s.subjectId === subjectFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((s) => (s.status || 'Completed') === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const cmp = (b.date || '').localeCompare(a.date || '');
        if (cmp !== 0) return cmp;
        return (b.startTime || '').localeCompare(a.startTime || '');
      } else if (sortBy === 'date_asc') {
        const cmp = (a.date || '').localeCompare(b.date || '');
        if (cmp !== 0) return cmp;
        return (a.startTime || '').localeCompare(b.startTime || '');
      } else if (sortBy === 'duration_desc') {
        return (b.actualStudyDuration || 0) - (a.actualStudyDuration || 0);
      } else if (sortBy === 'duration_asc') {
        return (a.actualStudyDuration || 0) - (b.actualStudyDuration || 0);
      }
      return 0;
    });

    return result;
  }, [sessions, searchQuery, subjectFilter, statusFilter, sortBy, subMap, topicMap]);

  // Aggregate stats for filtered records
  const filteredTotalSeconds = useMemo(
    () => filteredSessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0),
    [filteredSessions]
  );

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredSessions.slice(startIdx, startIdx + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  return (
    <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Banner: Total records & Total study duration for filtered set */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-200/60 dark:border-blue-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
              Filtered Records Summary
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing {filteredSessions.length} matching study sessions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
            <span>Duration: </span>
            <span className="text-blue-600 dark:text-blue-400 mono-number">
              {formatSecondsToHMS(filteredTotalSeconds)}
            </span>
            <span className="text-slate-400 text-[10px] ml-1">
              ({(filteredTotalSeconds / 3600).toFixed(1)} hrs)
            </span>
          </div>

          {onExportFilteredExcel && (
            <button
              onClick={() => onExportFilteredExcel(filteredSessions)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              title="Export only these filtered records to Excel"
            >
              <FileSpreadsheet size={13} />
              <span>Export Filtered</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar: Search, Subject Filter, Status Filter, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by subject, topic or notes..."
            className="w-full pl-9 pr-3 py-2 bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Subject Filter */}
        <div className="lg:col-span-3">
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer transition"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer transition"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Sort */}
        <div className="lg:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer transition"
          >
            <option value="date_desc">Sort: Date (Newest First)</option>
            <option value="date_asc">Sort: Date (Oldest First)</option>
            <option value="duration_desc">Sort: Study Time (High to Low)</option>
            <option value="duration_asc">Sort: Study Time (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-dark-950 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Subject</th>
              <th className="py-3 px-3">Topic</th>
              <th className="py-3 px-3">Start Time</th>
              <th className="py-3 px-3">End Time</th>
              <th className="py-3 px-3">Study Duration</th>
              <th className="py-3 px-2 text-center">Lecture</th>
              <th className="py-3 px-2 text-center">Notes</th>
              <th className="py-3 px-2 text-center">Revision</th>
              <th className="py-3 px-3 text-center">Attendance</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedSessions.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400 text-xs">
                  No study sessions matched your filter criteria.
                </td>
              </tr>
            ) : (
              paginatedSessions.map((s, idx) => {
                const subName = subMap[s.subjectId] || 'General Subject';
                const topName = topicMap[s.topicId] || 'General Topic';
                const topicObj = topicObjMap[s.topicId];
                const netMins = Math.round((s.actualStudyDuration || 0) / 60);

                const isLectureDone = s.lectureCompleted ?? (topicObj?.lectureCompleted ?? (s.status === 'Completed'));
                const isNotesDone = s.notesCompleted ?? (topicObj?.notesCompleted ?? (s.status === 'Completed'));
                const isRevisionDone = s.revisionCompleted ?? (topicObj?.revisionCompleted ?? (s.status === 'Completed'));

                return (
                  <tr
                    key={s.id || idx}
                    onClick={() => onViewDetails && onViewDetails(s)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {s.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white max-w-[140px] truncate">
                      {subName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate font-medium">
                      {topName}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap mono-number">
                      {s.startTime || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap mono-number">
                      {s.endTime || '-'}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 mono-number whitespace-nowrap">
                      {formatSecondsToHMS(s.actualStudyDuration || 0)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        ({netMins}m)
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isLectureDone
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-dark-800'
                        }`}
                      >
                        {isLectureDone ? 'Done' : 'Pend'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isNotesDone
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-dark-800'
                        }`}
                      >
                        {isNotesDone ? 'Done' : 'Pend'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isRevisionDone
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-dark-800'
                        }`}
                      >
                        {isRevisionDone ? 'Done' : 'Pend'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.attendance === 'Present' || (s.actualStudyDuration >= 1800)
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {s.attendance || (s.actualStudyDuration >= 1800 ? 'Present' : 'Logged')}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (s.status || 'Completed') === 'Completed'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {s.status || 'Completed'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewDetails && onViewDetails(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                          title="View complete session details"
                        >
                          <Eye size={14} />
                        </button>
                        {onDeleteSession && (
                          <button
                            onClick={() => onDeleteSession(s)}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete this session record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="ml-2">
            Showing {filteredSessions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredSessions.length)} of {filteredSessions.length} records
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-dark-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>
          <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300 mono-number">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-dark-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
