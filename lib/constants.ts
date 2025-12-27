export type EventItem = {
  title: string;
  slug: string;
  image: string;
  location: string;
  date: string; // ISO date string
  time: string; // human-friendly time
  description?: string;
  url?: string;
  tags?: string[];
};

export const events: EventItem[] = [
  {
    title: "Next.js Conf 2026",
    slug: "nextjs-conf-2026",
    image: "/images/event1.png",
    location: "San Francisco, CA, USA",
    date: "2026-03-17",
    time: "09:00 AM - 05:00 PM PDT",
    description:
      "The official Next.js conference — talks, workshops and networking for frontend engineers building with React and Next.js.",
    url: "https://nextjs.org/conf",
    tags: ["nextjs", "react", "frontend"],
  },
  {
    title: "React Summit 2026",
    slug: "react-summit-2026",
    image: "/images/event2.png",
    location: "Amsterdam, Netherlands",
    date: "2026-04-22",
    time: "09:30 AM - 06:00 PM CEST",
    description:
      "Europe's largest React conference with tracks for core, ecosystem and server-side React usage.",
    url: "https://reactsummit.com",
    tags: ["react", "javascript"],
  },
  {
    title: "JSConf EU 2026",
    slug: "jsconf-eu-2026",
    image: "/images/event3.png",
    location: "Berlin, Germany",
    date: "2026-06-10",
    time: "10:00 AM - 05:30 PM CEST",
    description:
      "Independent JavaScript conference focusing on the language, platform and community.",
    url: "https://jsconf.eu",
    tags: ["javascript", "webdev"],
  },
  {
    title: "PyCon US 2026",
    slug: "pycon-us-2026",
    image: "/images/event4.png",
    location: "Chicago, IL, USA",
    date: "2026-05-02",
    time: "08:30 AM - 05:00 PM CDT",
    description:
      "The largest annual gathering for the Python community in the United States.",
    url: "https://us.pycon.org",
    tags: ["python", "data", "backend"],
  },
  {
    title: "Node Summit 2026",
    slug: "node-summit-2026",
    image: "/images/event5.png",
    location: "London, UK",
    date: "2026-07-14",
    time: "09:00 AM - 05:00 PM BST",
    description: "Hands-on talks and workshops about building scalable applications with Node.js.",
    url: "https://nodesummit.org",
    tags: ["node.js", "backend", "javascript"],
  },
  {
    title: "HackMIT 2026",
    slug: "hackmit-2026",
    image: "/images/event6.png",
    location: "Cambridge, MA, USA",
    date: "2026-09-12",
    time: "24 hours",
    description: "Student hackathon featuring project workshops, mentors and prizes.",
    url: "https://hackmit.org",
    tags: ["hackathon", "students", "projects"],
  },
];
