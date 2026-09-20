export const site = {
  name: "Joeven",
  domain: "https://joeven.com",
  tagline: "Learn Autonomous AI Agents",
  description:
    "Joeven is a W3Schools-style academy for autonomous AI agents. Learn Python, mathematics, machine learning, LLMs, tools, RAG, agent architectures, evals, and production — with live code, exercises, projects, and certificates.",
  github: "https://github.com/PVengalRaoP/joeven",
  email: "hello@joeven.com",
};

export const nav = [
  { href: "/tutorials", label: "Tutorials" },
  { href: "/exercises", label: "Exercises" },
  { href: "/projects", label: "Projects" },
  { href: "/quiz", label: "Quizzes" },
  { href: "/certificates", label: "Certificates" },
  { href: "/reference", label: "Reference" },
  { href: "/jobs", label: "Jobs" },
];

export const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    cta: "Start learning",
    href: "/tutorials",
    features: [
      "All core tutorials",
      "In-browser Python playground",
      "Exercises and 5 portfolio projects",
      "Track quizzes and certificates",
      "Progress saved in this browser",
    ],
  },
  {
    id: "pro",
    name: "Joeven Pro",
    price: "$12",
    period: "/ month",
    cta: "Go Pro",
    href: "/pricing#pro",
    featured: true,
    features: [
      "Everything in Free",
      "Ad-free lessons",
      "Cloud progress sync (coming with your account)",
      "Downloadable exam packs",
      "Priority new tracks (robotics agents, voice)",
      "Pro badge on certificates",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$49",
    period: "/ seat / month",
    cta: "Contact sales",
    href: "mailto:hello@joeven.com?subject=Joeven%20Team",
    features: [
      "Everything in Pro",
      "Shared curriculum for cohorts",
      "Job-board discount",
      "Invoice billing",
      "Private workshop slots",
    ],
  },
];
