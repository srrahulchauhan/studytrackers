// Default dataset for StudyFlow - Matching the exact visual state in the reference dashboard
import { formatDateToISO } from "./dateUtils";

const getDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
};

export const initialPreparations = [
  {
    id: "prep-1",
    name: "General Preparation",
    category: "Competitive Exam",
    targetHours: 4,
    color: "#6366f1",
    createdAt: getDateOffset(-21),
  },
];

export const initialSubjects = [
  {
    id: "sub-math",
    name: "Mathematics",
    preparationId: "prep-1",
    color: "#8B5CF6",
    progress: 30,
    icon: "math",
  },
  {
    id: "sub-reasoning",
    name: "Reasoning",
    preparationId: "prep-1",
    color: "#10B981",
    progress: 20,
    icon: "reasoning",
  },
  {
    id: "sub-english",
    name: "English",
    preparationId: "prep-1",
    color: "#3B82F6",
    progress: 10,
    icon: "english",
  },
  {
    id: "sub-ga",
    name: "General Awareness",
    preparationId: "prep-1",
    color: "#F59E0B",
    progress: 0,
    icon: "awareness",
  },
];

export const initialTopics = [
  {
    id: "top-1",
    subjectId: "sub-math",
    preparationId: "prep-1",
    name: "Algebra",
    status: "Completed",
    targetDurationMinutes: 60,
    priority: "High",
    completedAt: getDateOffset(-2),
  },
  {
    id: "top-2",
    subjectId: "sub-reasoning",
    preparationId: "prep-1",
    name: "Logical Reasoning",
    status: "Completed",
    targetDurationMinutes: 45,
    priority: "Medium",
    completedAt: getDateOffset(-2),
  },
  {
    id: "top-3",
    subjectId: "sub-english",
    preparationId: "prep-1",
    name: "Grammar",
    status: "In Progress",
    targetDurationMinutes: 50,
    priority: "High",
  },
  {
    id: "top-4",
    subjectId: "sub-ga",
    preparationId: "prep-1",
    name: "Indian History",
    status: "Pending",
    targetDurationMinutes: 40,
    priority: "Low",
  },
];

export const initialTimetable = [
  {
    id: "slot-1",
    day: "Wednesday",
    startTime: "10:00",
    endTime: "11:30",
    subjectId: "sub-math",
    topicId: "top-1",
    preparationId: "prep-1",
    priority: "High",
    targetDuration: 90,
  },
  {
    id: "slot-2",
    day: "Wednesday",
    startTime: "12:00",
    endTime: "13:00",
    subjectId: "sub-english",
    topicId: "top-3",
    preparationId: "prep-1",
    priority: "Medium",
    targetDuration: 60,
  },
  {
    id: "slot-3",
    day: "Wednesday",
    startTime: "16:00",
    endTime: "17:00",
    subjectId: "sub-reasoning",
    topicId: "top-2",
    preparationId: "prep-1",
    priority: "High",
    targetDuration: 60,
  },
  {
    id: "slot-4",
    day: "Wednesday",
    startTime: "19:00",
    endTime: "20:00",
    subjectId: "sub-ga",
    topicId: "top-4",
    preparationId: "prep-1",
    priority: "Low",
    targetDuration: 60,
  },
];

// Recorded past study sessions totalling 2h 41m (9660 seconds)
export const initialStudySessions = [
  {
    id: "sess-1",
    preparationId: "prep-1",
    subjectId: "sub-math",
    topicId: "top-1",
    date: getDateOffset(-3),
    startTime: "10:12 AM",
    endTime: "11:42 AM",
    targetDuration: 90,
    actualStudyDuration: 5400, // 1h 30m
    breakDuration: 300,
    completionStatus: "Completed",
    notes: "Maths - Algebra foundations completed",
  },
  {
    id: "sess-2",
    preparationId: "prep-1",
    subjectId: "sub-reasoning",
    topicId: "top-2",
    date: getDateOffset(-2),
    startTime: "08:45 PM",
    endTime: "09:56 PM",
    targetDuration: 60,
    actualStudyDuration: 4260, // 1h 11m
    breakDuration: 0,
    completionStatus: "Completed",
    notes: "Logical Reasoning practice",
  },
];

export const initialAttendance = [
  {
    date: getDateOffset(-3),
    status: "PRESENT",
    totalStudyDuration: 5400,
    recordedAt: `${getDateOffset(-3)}T23:59:00Z`,
  },
  {
    date: getDateOffset(-2),
    status: "PRESENT",
    totalStudyDuration: 4260,
    recordedAt: `${getDateOffset(-2)}T23:59:00Z`,
  },
  {
    date: getDateOffset(-1),
    status: "ABSENT",
    totalStudyDuration: 0,
    recordedAt: `${getDateOffset(-1)}T00:00:00Z`,
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
      id: "todo-1",
      title: "Maths – Algebra",
      time: "10:00 AM",
      category: "Study",
      subjectId: "sub-math",
      topicId: "top-1",
      targetDurationMinutes: 60,
      priority: "High",
      completed: false,
    },
    {
      id: "todo-2",
      title: "English – Grammar",
      time: "12:00 PM",
      category: "Study",
      subjectId: "sub-english",
      topicId: "top-3",
      targetDurationMinutes: 60,
      priority: "Medium",
      completed: false,
    },
    {
      id: "todo-3",
      title: "Mock Test",
      time: "04:00 PM",
      category: "Practice",
      subjectId: "sub-reasoning",
      topicId: "top-2",
      targetDurationMinutes: 60,
      priority: "High",
      completed: false,
    },
    {
      id: "todo-4",
      title: "Notes Making",
      time: "07:00 PM",
      category: "Notes",
      subjectId: "sub-ga",
      topicId: "top-4",
      targetDurationMinutes: 45,
      priority: "Low",
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
    month: "2026-10",
    year: 2026,
    targetHours: 100,
  },
};

export const freshTargets = {
  daily: {
    targetHours: 4,
    subjectDistribution: [],
  },
  tomorrow: [],
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
    month: "2026-10",
    year: 2026,
    targetHours: 100,
  },
};

export const initialSettings = {
  userName: "Rahul Chauhan",
  userRole: "Learner",
  dailyTargetHours: 4,
  minAttendanceMinutes: 30,
  defaultSessionMinutes: 45,
  pomodoro: {
    studyMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
  breakReasons: ["Tea", "Food", "Rest", "Phone", "Personal", "Other"],
  soundEnabled: true,
  theme: "light",
  timeFormat: "12h",
  weekStartDay: "Monday",
  browserNotifications: false,
  googleSheetsSyncEnabled: true,
  googleSheetsSyncUrl: "https://script.google.com/macros/s/AKfycbzjemNaSsfS4AhMoTcwpGSHqitVqZsMXqRULhWMio2AjUBjKquaS-RBiAebyYX9pGk/exec",
  googleSheetsSyncKey: "",
};

export const initialNotifications = [
  {
    id: "notif-1",
    title: "Study session completed",
    message: "Maths – Algebra (30m) session recorded.",
    timestamp: "Today 10:12 AM",
    read: false,
  },
  {
    id: "notif-2",
    title: "Topic added",
    message: "Reasoning – Logical Reasoning added to syllabus.",
    timestamp: "Yesterday 08:45 PM",
    read: false,
  },
  {
    id: "notif-3",
    title: "Daily Goal reminder",
    message: "4h daily target planned for today. Let’s make it count!",
    timestamp: "Today 06:00 AM",
    read: false,
  },
];

export const initialVideoCourses = [
  {
    id: "vid-1",
    title: "Backend Tutorial",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=oe70UhJC_F4",
    category: "Backend Development",
    duration: "45 mins",
  },
  {
    id: "vid-2",
    title: "Frontend Architecture & React Patterns",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
    category: "Frontend Development",
    duration: "60 mins",
  },
  {
    id: "vid-3",
    title: "Database Design & SQL Mastery",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
    category: "Database Systems",
    duration: "50 mins",
  },
  {
    id: "vid-4",
    title: "Data Structures & Algorithms in Depth",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=8hly31xKli0",
    category: "Computer Science",
    duration: "75 mins",
  },
  {
    id: "vid-5",
    title: "RESTful API Design & Best Practices",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=-MTSQjw5DrM",
    category: "Backend Development",
    duration: "40 mins",
  },
  {
    id: "vid-6",
    title: "Modern JavaScript (ES6+) Complete Guide",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
    category: "Frontend Development",
    duration: "55 mins",
  },
  {
    id: "vid-7",
    title: "Node.js & Express Server Setup",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    category: "Backend Development",
    duration: "35 mins",
  },
  {
    id: "vid-8",
    title: "Git & GitHub Collaboration Workflow",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
    category: "Dev Tools",
    duration: "30 mins",
  },
  {
    id: "vid-9",
    title: "System Design & Scalability Basics",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=m8Icp_Cid5o",
    category: "System Architecture",
    duration: "65 mins",
  },
  {
    id: "vid-10",
    title: "Authentication & JWT Security Guide",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=7Q17ubqL20o",
    category: "Backend Development",
    duration: "45 mins",
  },
  {
    id: "vid-11",
    title: "Docker & Containerization for Beginners",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    category: "DevOps & Cloud",
    duration: "50 mins",
  },
  {
    id: "vid-12",
    title: "Mathematics – Algebra & Problem Solving",
    subtitle: "Video lesson",
    url: "https://www.youtube.com/watch?v=LwCRRUa8yTU",
    category: "Mathematics",
    duration: "60 mins",
  },
];
