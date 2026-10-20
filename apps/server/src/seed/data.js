export const CATEGORIES = [
  { name: "Web Development", icon: "</>", featured: true, description: "Frontend, backend and full-stack JavaScript." },
  { name: "Data & AI", icon: "∑", featured: true, description: "Python, machine learning and LLM apps." },
  { name: "Mobile Apps", icon: "▢", featured: true, description: "React Native, Flutter and native apps." },
  { name: "UI/UX Design", icon: "◎", featured: true, description: "Figma, design systems and research." },
  { name: "DevOps & Cloud", icon: "⇄", description: "Docker, CI/CD, AWS and Kubernetes." },
  { name: "Career Skills", icon: "↗", description: "Interviews, system design and communication." },
];

export const INSTRUCTORS = [
  { name: "Priya Raman", email: "priya@vidya.dev", headline: "Staff Engineer, ex-Flipkart", bio: "Priya has shipped Node and React systems serving 20M users. She teaches the way teams actually build: small steps, tests and code review.", github: "priyaraman" },
  { name: "Arjun Kulkarni", email: "arjun@vidya.dev", headline: "Database Architect", bio: "Arjun designs data platforms for fintech companies and has taught MongoDB to over 18,000 engineers.", github: "arjunk" },
  { name: "Meera Shah", email: "meera@vidya.dev", headline: "Product Designer, Razorpay", bio: "Meera leads design systems work and loves turning messy flows into simple screens.", linkedin: "meerashah" },
  { name: "Rohit Verma", email: "rohit@vidya.dev", headline: "ML Engineer", bio: "Rohit builds recommendation and LLM products and explains the math without the jargon.", github: "rohitv" },
];

export const STUDENTS = [
  "Kavya Reddy", "Rahul Menon", "Anusha Patil", "Vivek Joshi", "Sneha Iyer", "Karthik Nair",
  "Divya Sharma", "Aditya Rao", "Pooja Desai", "Manoj Kumar", "Lakshmi Prasad", "Imran Shaikh",
];

const V = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];
let vi = 0;
export const video = () => V[vi++ % V.length];

const quiz = (questions) => ({ type: "quiz", quiz: { passScore: 80, questions } });
const article = (title, content) => ({ title, type: "article", duration: 300, content });

export const AUTH_QUIZ = quiz([
  { text: "Where should a refresh token be stored in a browser app?", options: ["localStorage", "An httpOnly, Secure cookie", "A global JS variable", "The URL query string"], answer: 1, explanation: "httpOnly cookies cannot be read by JavaScript, which protects the token from XSS." },
  { text: "What should happen when a used refresh token is presented again?", options: ["Issue a new token as usual", "Ignore it", "Revoke the whole token family", "Extend its expiry"], answer: 2, explanation: "Reuse means it may have been stolen, so revoke every token in that family." },
  { text: "A good lifetime for an access token is…", options: ["15 minutes", "30 days", "1 year", "Never expires"], answer: 0, explanation: "Short-lived access tokens limit damage if one leaks." },
  { text: "Which hash function fits password storage?", options: ["MD5", "SHA-1", "bcrypt", "Base64"], answer: 2, explanation: "bcrypt is slow on purpose and salted, which resists brute force." },
  { text: "Which middleware sets security headers in Express?", options: ["morgan", "helmet", "cors", "body-parser"], answer: 1, explanation: "helmet sets CSP, HSTS, X-Frame-Options and more." },
]);

export const JS_QUIZ = quiz([
  { text: "What does `await` do inside an async function?", options: ["Blocks the whole thread", "Pauses that function until the promise settles", "Converts a value to a string", "Throws an error"], answer: 1, explanation: "Only the async function pauses; the event loop keeps running." },
  { text: "Which keyword declares a block-scoped constant?", options: ["var", "let", "const", "static"], answer: 2, explanation: "`const` is block-scoped and cannot be reassigned." },
  { text: "What does `[1,2,3].map(x => x * 2)` return?", options: ["[2,4,6]", "6", "[1,2,3]", "undefined"], answer: 0, explanation: "`map` returns a new array with each item transformed." },
]);

const generic = (topic) =>
  quiz([
    { text: `Which statement about ${topic} is true?`, options: ["It only works in production", "It is best learned by building", "It needs no practice", "It replaces all other tools"], answer: 1, explanation: "Hands-on projects make the concepts stick." },
    { text: "What is the best next step after finishing a section?", options: ["Skip the exercises", "Build the section project", "Restart the course", "Only read the notes"], answer: 1, explanation: "Apply what you learned right away." },
  ]);

const intro = (topic) => [
  { title: "Welcome and course map", duration: 250, isPreview: true },
  { title: "Set up your tools", duration: 740, isPreview: true },
  article(
    `How this ${topic} course works`,
    `# How this course works\n\nEach section ends with a small project. Watch the lessons, take notes with the **Notes** tab, and ask questions in **Q&A** — the instructor answers within a day.\n\n## Tips\n\n- Code along instead of just watching\n- Finish each quiz with 80% to unlock your certificate\n- Push your projects to GitHub as you go`
  ),
];

export const COURSES = [
  {
    title: "MERN Stack from Zero to Deploy", subtitle: "Build and ship a production-ready app with MongoDB, Express, React and Node.js",
    cat: 0, ins: 0, level: "Beginner", price: 3499, discountPrice: 499, color: "#0f7a5c", bestseller: true,
    outcomes: ["Design REST APIs with Express and Zod", "Model data in MongoDB with Mongoose", "JWT auth with refresh token rotation", "React 19 with TanStack Query", "Payments with Razorpay webhooks", "Deploy with Docker and GitHub Actions"],
    requirements: ["Basic HTML, CSS and JavaScript", "A laptop with 8 GB RAM"],
    sections: [
      { title: "Getting started", lessons: intro("MERN") },
      { title: "JavaScript you need", lessons: [{ title: "Async/await and promises", duration: 860 }, { title: "Modules and npm", duration: 530 }, { title: "Quiz · JavaScript basics", ...JS_QUIZ }] },
      { title: "Express REST APIs", lessons: [{ title: "Routing and controllers", duration: 724 }, { title: "Validation with Zod", duration: 580 }, { title: "Error handling middleware", duration: 675 }] },
      { title: "Authentication", lessons: [{ title: "Hashing with bcrypt", duration: 495 }, { title: "Access tokens", duration: 690 }, { title: "Refresh tokens with httpOnly cookies", duration: 980 }, { title: "Quiz · Auth basics", ...AUTH_QUIZ }] },
      { title: "React + API", lessons: [{ title: "TanStack Query setup", duration: 842 }, { title: "Protected routes", duration: 644 }, { title: "Deploy to Vercel and Render", duration: 1110 }] },
    ],
  },
  { title: "React 19 Deep Dive", subtitle: "Server components, actions, suspense and the patterns teams use in 2026", cat: 0, ins: 0, level: "Intermediate", price: 3999, discountPrice: 699, color: "#2b5fb8", bestseller: true, topic: "React" },
  { title: "Node.js APIs that Scale", subtitle: "Caching, queues, rate limits and observability for real traffic", cat: 0, ins: 0, level: "Intermediate", price: 2999, discountPrice: 599, color: "#1d4d40", topic: "Node.js" },
  { title: "TypeScript in Practice", subtitle: "Types that catch bugs without slowing you down", cat: 0, ins: 0, level: "Intermediate", price: 2799, discountPrice: 549, color: "#285e8e", topic: "TypeScript" },
  { title: "MongoDB Aggregations Mastery", subtitle: "Pipelines, indexes and schema design for fast queries", cat: 1, ins: 1, level: "Advanced", price: 2499, discountPrice: 449, color: "#b86a12", topic: "MongoDB" },
  { title: "System Design for Interviews", subtitle: "Design Twitter, Uber and WhatsApp step by step", cat: 5, ins: 1, level: "Intermediate", price: 4499, discountPrice: 899, color: "#9b3a45", bestseller: true, topic: "system design" },
  { title: "Docker & CI for Node Devs", subtitle: "Containers, GitHub Actions and zero-downtime deploys", cat: 4, ins: 1, level: "Intermediate", price: 2999, discountPrice: 549, color: "#2c4a7a", topic: "Docker" },
  { title: "Tailwind UI Patterns", subtitle: "Build polished, responsive interfaces fast", cat: 3, ins: 2, level: "Beginner", price: 0, discountPrice: null, color: "#6d3f8a", topic: "Tailwind CSS" },
  { title: "Figma to Production UI", subtitle: "Design systems, handoff and pixel-perfect React", cat: 3, ins: 2, level: "Beginner", price: 1999, discountPrice: 399, color: "#a24a2a", topic: "Figma" },
  { title: "Machine Learning with Python", subtitle: "From linear regression to neural networks with real datasets", cat: 1, ins: 3, level: "Beginner", price: 3999, discountPrice: 799, color: "#3a6b2a", topic: "machine learning" },
  { title: "Build LLM Apps in JavaScript", subtitle: "RAG, tool use and agents with Node.js", cat: 1, ins: 3, level: "Advanced", price: 4999, discountPrice: 999, color: "#0d5c52", bestseller: true, topic: "LLM apps" },
  { title: "React Native Apps", subtitle: "Ship iOS and Android apps from one codebase", cat: 2, ins: 3, level: "Intermediate", price: 3299, discountPrice: 649, color: "#14606e", topic: "React Native" },
];

/** Builds a default curriculum for courses that do not define one. */
export function defaultSections(topic) {
  return [
    { title: "Getting started", lessons: intro(topic) },
    { title: `${topic} fundamentals`, lessons: [{ title: `Core ideas of ${topic}`, duration: 720 }, { title: "Your first project", duration: 1020 }, { title: "Common mistakes", duration: 560 }] },
    { title: "Going further", lessons: [{ title: "Real-world patterns", duration: 900 }, { title: "Testing and debugging", duration: 780 }, { title: `Quiz · ${topic} essentials`, ...generic(topic) }] },
    { title: "Capstone project", lessons: [{ title: "Plan the project", duration: 480 }, { title: "Build it step by step", duration: 1500 }, { title: "Ship and share", duration: 600 }] },
  ];
}

export const DESCRIPTION = (title, topic) =>
  `${title} is a hands-on course. You will learn ${topic} by building a complete project from an empty folder to a deployed app.\n\nEvery section ends with an exercise, and the final capstone gives you something real to show employers. Lessons are short, captions are available in English and Telugu, and the instructor answers questions in the Q&A within a day.`;

export const REVIEW_TEXT = [
  "Finished in 3 weeks. The projects look great on my GitHub and the explanations are clear.",
  "Best course I have taken on this topic. Explains why, not just how.",
  "Great content and pacing. The quizzes really helped me remember the ideas.",
  "Practical and to the point. I used the patterns at work the next week.",
  "Loved the capstone project. Would recommend to anyone starting out.",
  "Good course overall. A bit more on testing would make it perfect.",
];

export const QUESTIONS = [
  ["Why SameSite strict for the refresh cookie?", "I read that lax is the default and works for most apps. Is strict needed here?"],
  ["Getting a CORS error after deploy", "Works locally but the browser blocks requests on Render. What should I check?"],
  ["Is Zod better than Joi?", "Which one would you pick for a new Express project and why?"],
  ["How do I seed the database?", "Is there a recommended way to add demo data during development?"],
];
