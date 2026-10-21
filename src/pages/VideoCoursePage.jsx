import React, { useState, useMemo } from 'react';
import {
  Video,
  Search,
  ExternalLink,
  Play,
  Plus,
  Copy,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { Modal } from '../components/common/Modal';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1`;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function VideoCoursePage() {
  const {
    videoCourses = [],
    addVideoCourse,
    deleteVideoCourse,
    topics = [],
    subjects = [],
    addToast,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Exactly 10 items per page as requested

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeVideoToPlay, setActiveVideoToPlay] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // New video form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('Video lesson');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [formError, setFormError] = useState('');

  // Merge dedicated videoCourses with any videoLinks from topics & subjects
  const allVideos = useMemo(() => {
    const list = [...videoCourses];
    const seenUrls = new Set(list.map((v) => (v.url || '').trim().toLowerCase()));

    // Extract videos from topics
    topics.forEach((t) => {
      if (Array.isArray(t.videoLinks)) {
        t.videoLinks.forEach((link, idx) => {
          const trimmed = (link || '').trim();
          if (trimmed && !seenUrls.has(trimmed.toLowerCase())) {
            seenUrls.add(trimmed.toLowerCase());
            const sub = subjects.find((s) => s.id === t.subjectId);
            list.push({
              id: `top-${t.id}-${idx}`,
              title: t.name || 'Topic Video',
              subtitle: t.videoLinks.length > 1 ? `Video lesson • Part ${idx + 1}` : 'Video lesson',
              url: trimmed,
              category: sub?.name || 'Curriculum Topic',
              fromTopic: true,
            });
          }
        });
      }
    });

    // Extract videos from subjects
    subjects.forEach((s) => {
      if (Array.isArray(s.videoLinks)) {
        s.videoLinks.forEach((link, idx) => {
          const trimmed = (link || '').trim();
          if (trimmed && !seenUrls.has(trimmed.toLowerCase())) {
            seenUrls.add(trimmed.toLowerCase());
            list.push({
              id: `sub-${s.id}-${idx}`,
              title: s.name ? `${s.name} Course` : 'Subject Video',
              subtitle: 'Video lesson',
              url: trimmed,
              category: s.name || 'Subject Course',
              fromSubject: true,
            });
          }
        });
      }
    });

    return list;
  }, [videoCourses, topics, subjects]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set();
    allVideos.forEach((v) => {
      if (v.category) set.add(v.category);
    });
    return ['All', ...Array.from(set)];
  }, [allVideos]);

  // Filter videos based on search & category
  const filteredVideos = useMemo(() => {
    return allVideos.filter((video) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        video.title?.toLowerCase().includes(q) ||
        video.subtitle?.toLowerCase().includes(q) ||
        video.category?.toLowerCase().includes(q) ||
        video.url?.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'All' || video.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [allVideos, searchQuery, selectedCategory]);

  // Pagination calculation: 10 items per page
  const totalVideos = filteredVideos.length;
  const totalPages = Math.max(1, Math.ceil(totalVideos / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedVideos = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredVideos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVideos, safeCurrentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCopyLink = (e, video) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(video.url);
      setCopiedId(video.id);
      addToast('Video link copied to clipboard', 'info');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = (e, videoId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this video course?')) {
      deleteVideoCourse(videoId);
    }
  };

  const handleOpenVideo = (video) => {
    const embedUrl = getYouTubeEmbedUrl(video.url);
    if (embedUrl) {
      setActiveVideoToPlay(video);
    } else {
      window.open(video.url, '_blank', 'noreferrer');
    }
  };

  const handleCreateVideo = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a course title');
      return;
    }
    if (!newUrl.trim()) {
      setFormError('Please enter a video link URL');
      return;
    }

    addVideoCourse({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Video lesson',
      url: newUrl.trim(),
      category: newCategory.trim() || 'General',
    });

    setNewTitle('');
    setNewSubtitle('Video lesson');
    setNewUrl('');
    setNewCategory('');
    setFormError('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Video size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Video Course
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
                {totalVideos} lessons
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curated video tutorials and lessons organized at 10 items per page.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span>Add Video Course</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tutorials, lessons, topics..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter & Page Indicator */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <Filter size={14} />
            <span className="hidden sm:inline">Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List - 10 Items per Page adjusted cleanly */}
      {paginatedVideos.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          <Video className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
          <p className="font-medium text-slate-600 dark:text-slate-300">
            {searchQuery || selectedCategory !== 'All'
              ? 'No video courses match your search or filter.'
              : 'No video courses found yet.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add Video Course&quot; above to add your first video tutorial.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleOpenVideo(video)}
              className="group relative flex items-center justify-between p-3 sm:p-3.5 px-4 sm:px-5 rounded-2xl border border-blue-200/90 dark:border-blue-900/50 bg-white/95 dark:bg-dark-900/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer"
            >
              {/* Left Side: Circular Play Button + Title & Subtitle */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
                {/* Glowing Blue Circular Play Badge matching screenshot */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-1 bg-blue-100/70 dark:bg-blue-950/60 flex items-center justify-center ring-2 ring-blue-200/60 dark:ring-blue-800/40 group-hover:ring-blue-400/80 transition-all">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform">
                      <Play size={16} className="fill-white text-white translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate flex items-center gap-2">
                    <span>{video.subtitle || 'Video lesson'}</span>
                    {video.category && (
                      <span className="hidden md:inline-block text-[11px] text-slate-400 dark:text-slate-500">
                        • {video.category}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right Side: Copy link, Delete (if custom), and Blue External Link Icon */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Copy link button */}
                <button
                  onClick={(e) => handleCopyLink(e, video)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition opacity-80 sm:opacity-0 group-hover:opacity-100"
                  title="Copy video link"
                >
                  {copiedId === video.id ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>

                {/* Delete button (for custom courses) */}
                {!video.fromTopic && !video.fromSubject && (
                  <button
                    onClick={(e) => handleDelete(e, video.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-80 sm:opacity-0 group-hover:opacity-100"
                    title="Delete video course"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* External Link Icon in Blue matching screenshot */}
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-xl text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  title="Open video link"
                >
                  <ExternalLink size={20} className="stroke-[2.2]" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer - Adjusted for 10 items per page */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {totalVideos === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(safeCurrentPage * itemsPerPage, totalVideos)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {totalVideos}
            </span>{' '}
            video courses (10 per page)
          </div>

          <div className="flex items-center gap-1.5">
            {/* Prev Button */}
            <button
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-dark-800 transition shadow-2xs font-medium"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-xl font-semibold transition text-xs flex items-center justify-center ${
                  safeCurrentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-dark-800 transition shadow-2xs font-medium"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideoToPlay && (
        <Modal
          isOpen={!!activeVideoToPlay}
          onClose={() => setActiveVideoToPlay(null)}
          title={activeVideoToPlay.title}
          subtitle={activeVideoToPlay.subtitle || 'Video lesson'}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
              {getYouTubeEmbedUrl(activeVideoToPlay.url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activeVideoToPlay.url)}
                  title={activeVideoToPlay.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                  <Play size={48} className="text-blue-500 mb-3" />
                  <p className="text-sm font-medium text-white mb-2">
                    External Video Link
                  </p>
                  <p className="text-xs text-slate-400 mb-4 max-w-md break-all">
                    {activeVideoToPlay.url}
                  </p>
                  <a
                    href={activeVideoToPlay.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <span>Open in new window</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {activeVideoToPlay.category && `Category: ${activeVideoToPlay.category}`}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeVideoToPlay.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 flex items-center gap-1.5 transition"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Video Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Video Course"
        subtitle="Add a new video lesson to your study list"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateVideo} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Course / Tutorial Title *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Backend Tutorial"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Subtitle
            </label>
            <input
              type="text"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="e.g. Video lesson"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Video URL / Link *
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category / Subject (Optional)
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Backend Development, Mathematics"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition"
            >
              Add Course
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
