// Default dataset for StudyFlow - Matching the exact visual state in the reference dashboard
export const initialPreparations = [
  {
    id: 'prep-1',
    name: 'General Preparation',
    category: 'Competitive Exam',
    targetHours: 4,
    color: '#6366f1',
    createdAt: '2026-10-01',
  },
];

export const initialSubjects = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    preparationId: 'prep-1',
    color: '#8B5CF6',
    progress: 30,
    icon: 'math',
  },
  {
    id: 'sub-reasoning',
    name: 'Reasoning',
    preparationId: 'prep-1',
    color: '#10B981',
    progress: 20,
    icon: 'reasoning',
  },
  {
    id: 'sub-english',
    name: 'English',
    preparationId: 'prep-1',
    color: '#3B82F6',
    progress: 10,
    icon: 'english',
  },
  {
    id: 'sub-ga',
    name: 'General Awareness',
    preparationId: 'prep-1',
    color: '#F59E0B',
    progress: 0,
    icon: 'awareness',
  },
];

export const initialTopics = [
  {
    id: 'top-1',
    subjectId: 'sub-math',
    preparationId: 'prep-1',
    name: 'Algebra',
    status: 'Completed',
    targetDurationMinutes: 60,
    priority: 'High',
    completedAt: '2026-10-20',
  },
  {
    id: 'top-2',
    subjectId: 'sub-reasoning',
    preparationId: 'prep-1',
    name: 'Logical Reasoning',
    status: 'Completed',
    targetDurationMinutes: 45,
    priority: 'Medium',
    completedAt: '2026-10-20',
  },
  {
    id: 'top-3',
    subjectId: 'sub-english',
    preparationId: 'prep-1',
    name: 'Grammar',
    status: 'In Progress',
    targetDurationMinutes: 50,
    priority: 'High',
  },
  {
    id: 'top-4',
    subjectId: 'sub-ga',
    preparationId: 'prep-1',
    name: 'Indian History',
    status: 'Pending',
    targetDurationMinutes: 40,
    priority: 'Low',
  },
];

export const initialTimetable = [
  {
    id: 'slot-1',
    day: 'Wednesday',
    startTime: '10:00',
    endTime: '11:30',
    subjectId: 'sub-math',
    topicId: 'top-1',
    preparationId: 'prep-1',
    priority: 'High',
    targetDuration: 90,
  },
  {
    id: 'slot-2',
    day: 'Wednesday',
    startTime: '12:00',
    endTime: '13:00',
    subjectId: 'sub-english',
    topicId: 'top-3',
    preparationId: 'prep-1',
    priority: 'Medium',
    targetDuration: 60,
  },
  {
    id: 'slot-3',
    day: 'Wednesday',
    startTime: '16:00',
    endTime: '17:00',
    subjectId: 'sub-reasoning',
    topicId: 'top-2',
    preparationId: 'prep-1',
    priority: 'High',
    targetDuration: 60,
  },
  {
    id: 'slot-4',
    day: 'Wednesday',
    startTime: '19:00',
    endTime: '20:00',
    subjectId: 'sub-ga',
    topicId: 'top-4',
    preparationId: 'prep-1',
    priority: 'Low',
    targetDuration: 60,
  },
];

// Recorded past study sessions totalling 2h 41m (9660 seconds)
export const initialStudySessions = [
  {
    id: 'sess-1',
    preparationId: 'prep-1',
    subjectId: 'sub-math',
    topicId: 'top-1',
    date: '2026-10-19',
    startTime: '10:12 AM',
    endTime: '11:42 AM',
    targetDuration: 90,
    actualStudyDuration: 5400, // 1h 30m
    breakDuration: 300,
    completionStatus: 'Completed',
    notes: 'Maths - Algebra foundations completed',
  },
  {
    id: 'sess-2',
    preparationId: 'prep-1',
    subjectId: 'sub-reasoning',
    topicId: 'top-2',
    date: '2026-10-20',
    startTime: '08:45 PM',
    endTime: '09:56 PM',
    targetDuration: 60,
    actualStudyDuration: 4260, // 1h 11m
    breakDuration: 0,
    completionStatus: 'Completed',
    notes: 'Logical Reasoning practice',
  },
];

export const initialAttendance = [
  {
    date: '2026-10-19',
    status: 'PRESENT',
    totalStudyDuration: 5400,
    recordedAt: '2026-10-19T23:59:00Z',
  },
  {
    date: '2026-10-20',
    status: 'PRESENT',
    totalStudyDuration: 4260,
    recordedAt: '2026-10-20T23:59:00Z',
  },
  {
    date: '2026-10-21',
    status: 'ABSENT',
    totalStudyDuration: 0,
    recordedAt: '2026-10-21T00:00:00Z',
  },
];

export const initialGoals = [];

export const initialTargets = {
  daily: {
    targetHours: 4,
    subjectDistribution: [],
  },
  tomorrow: [
    {
      id: 'todo-1',
      title: 'Maths – Algebra',
      time: '10:00 AM',
      category: 'Study',
      subjectId: 'sub-math',
      topicId: 'top-1',
      targetDurationMinutes: 60,
      priority: 'High',
      completed: false,
    },
    {
      id: 'todo-2',
      title: 'English – Grammar',
      time: '12:00 PM',
      category: 'Study',
      subjectId: 'sub-english',
      topicId: 'top-3',
      targetDurationMinutes: 60,
      priority: 'Medium',
      completed: false,
    },
    {
      id: 'todo-3',
      title: 'Mock Test',
      time: '04:00 PM',
      category: 'Practice',
      subjectId: 'sub-reasoning',
      topicId: 'top-2',
      targetDurationMinutes: 60,
      priority: 'High',
      completed: false,
    },
    {
      id: 'todo-4',
      title: 'Notes Making',
      time: '07:00 PM',
      category: 'Notes',
      subjectId: 'sub-ga',
      topicId: 'top-4',
      targetDurationMinutes: 45,
      priority: 'Low',
      completed: false,
    },
  ],
  weekly: {
    targetHours: 25,
    dailyPlan: {
      Monday: 4,
      Tuesday: 4,
      Wednesday: 4,
      Thursday: 4,
      Friday: 4,
      Saturday: 4,
      Sunday: 1,
    },
  },
  monthly: {
    month: '2026-10',
    year: 2026,
    targetHours: 100,
  },
};

export const initialSettings = {
  userName: 'Rahul Chauhan',
  userRole: 'Learner',
  dailyTargetHours: 4,
  minAttendanceMinutes: 30,
  defaultSessionMinutes: 45,
  pomodoro: {
    studyMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
  breakReasons: ['Tea', 'Food', 'Rest', 'Phone', 'Personal', 'Other'],
  soundEnabled: true,
  theme: 'light',
  timeFormat: '12h',
  weekStartDay: 'Monday',
  browserNotifications: false,
  googleSheetsSyncEnabled: false,
  googleSheetsSyncUrl: '',
  googleSheetsSyncKey: '',
};

export const initialNotifications = [
  {
    id: 'notif-1',
    title: 'Study session completed',
    message: 'Maths – Algebra (30m) session recorded.',
    timestamp: 'Today 10:12 AM',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Topic added',
    message: 'Reasoning – Logical Reasoning added to syllabus.',
    timestamp: 'Yesterday 08:45 PM',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Daily Goal reminder',
    message: '4h daily target planned for today. Let’s make it count!',
    timestamp: 'Today 06:00 AM',
    read: false,
  },
];
