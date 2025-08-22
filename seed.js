const mongoose = require('mongoose');
const Quiz = require('./models/Quiz'); // Adjust path
require('dotenv').config();

const quizzes = [
  {
    title: "JavaScript Fundamentals",
    description: "Test your JS knowledge from basics to intermediate.",
    category: "Programming",
    active: true,
    questions: [
      {
        question: "Which company developed JavaScript?",
        options: ["Netscape", "Microsoft", "Google", "Apple"],
        answer: "Netscape"
      },
      {
        question: "What is the output of 2 + '2'?",
        options: ["4", "'22'", "NaN", "undefined"],
        answer: "'22'"
      },
      {
        question: "Which method is used to parse a JSON string?",
        options: ["JSON.parse()", "JSON.stringify()", "JSON.object()", "JSON.toString()"],
        answer: "JSON.parse()"
      },
      {
        question: "Which symbol is used for comments in JS?",
        options: ["//", "/* */", "#", "<!-- -->"],
        answer: "//"
      },
      {
        question: "Which of these is a primitive type?",
        options: ["Object", "Array", "String", "Function"],
        answer: "String"
      },
      {
        question: "Which keyword is used to declare a variable?",
        options: ["let", "var", "const", "All of the above"],
        answer: "All of the above"
      },
      {
        question: "How do you create a function in JS?",
        options: ["function myFunc(){}", "def myFunc(){}", "func myFunc(){}", "create function myFunc(){}"],
        answer: "function myFunc(){}"
      },
      {
        question: "Which operator is used for strict equality?",
        options: ["==", "=", "===", "!="],
        answer: "==="
      },
      {
        question: "What is 'undefined' in JS?",
        options: ["A type", "A value", "Both type and value", "None"],
        answer: "Both type and value"
      },
      {
        question: "Which function converts a value to a string?",
        options: ["toString()", "String()", "Both", "None"],
        answer: "Both"
      }
    ]
  },
  {
    title: "HTML Basics",
    description: "Test your knowledge of HTML.",
    category: "Web Development",
    active: true,
    questions: [
      {
        question: "Which tag is used for links?",
        options: ["<a>", "<link>", "<url>", "<href>"],
        answer: "<a>"
      },
      {
        question: "Which tag defines a table row?",
        options: ["<td>", "<tr>", "<th>", "<table>"],
        answer: "<tr>"
      },
      {
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "Hyperlinks Text Mark Language", "Home Tool Markup Language", "Hyperlinking Text Markup Language"],
        answer: "Hyper Text Markup Language"
      },
      {
        question: "Which attribute is used for image source?",
        options: ["src", "href", "link", "img"],
        answer: "src"
      },
      {
        question: "Which tag is used for headings?",
        options: ["<head>", "<h1> to <h6>", "<header>", "<heading>"],
        answer: "<h1> to <h6>"
      }
    ]
  },
  {
    title: "CSS Basics",
    description: "Check your CSS understanding.",
    category: "Web Development",
    active: true,
    questions: [
      {
        question: "What does CSS stand for?",
        options: ["Cascading Style Sheets", "Creative Style Syntax", "Computer Style Sheets", "Colorful Style Sheets"],
        answer: "Cascading Style Sheets"
      },
      {
        question: "How do you select an element by ID?",
        options: ["#id", ".id", "*id", "id()"],
        answer: "#id"
      },
      {
        question: "Which property changes text color?",
        options: ["color", "font-color", "text-color", "foreground"],
        answer: "color"
      },
      {
        question: "Which property sets background color?",
        options: ["background-color", "bgcolor", "color-bg", "bg-color"],
        answer: "background-color"
      },
      {
        question: "How do you make text bold?",
        options: ["font-weight:bold", "text-style:bold", "font:bold", "text:bold"],
        answer: "font-weight:bold"
      }
    ]
  },
  {
    title: "Node.js Basics",
    description: "Node.js fundamentals quiz.",
    category: "Programming",
    active: true,
    questions: [
      {
        question: "Which module is used to create a server?",
        options: ["http", "fs", "url", "path"],
        answer: "http"
      },
      {
        question: "Node.js runs on which engine?",
        options: ["V8", "SpiderMonkey", "Chakra", "JavaScriptCore"],
        answer: "V8"
      },
      {
        question: "Which file is the entry point in Node.js project?",
        options: ["index.js", "app.js", "server.js", "package.json"],
        answer: "index.js"
      },
      {
        question: "Which of these is a Node.js framework?",
        options: ["Express", "React", "Angular", "Vue"],
        answer: "Express"
      },
      {
        question: "Which command installs a package?",
        options: ["npm install package", "node install package", "npm get package", "node get package"],
        answer: "npm install package"
      }
    ]
  },
  {
    title: "React Basics",
    description: "Test your React knowledge.",
    category: "Web Development",
    active: true,
    questions: [
      {
        question: "Which method renders UI in React?",
        options: ["render()", "display()", "show()", "paint()"],
        answer: "render()"
      },
      {
        question: "What is JSX?",
        options: ["JavaScript XML", "Java Syntax Extension", "JavaScript Extension", "Java XML"],
        answer: "JavaScript XML"
      },
      {
        question: "Which hook manages state in functional components?",
        options: ["useState", "useEffect", "useReducer", "useContext"],
        answer: "useState"
      },
      {
        question: "React is a ____ library.",
        options: ["Frontend", "Backend", "Database", "Fullstack"],
        answer: "Frontend"
      },
      {
        question: "Which prop passes data to child components?",
        options: ["props", "state", "context", "params"],
        answer: "props"
      }
    ]
  }
];

mongoose.connect('mongodb://localhost:27017/Quiz-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected...');

  await Quiz.deleteMany({});
  console.log('Existing quizzes cleared');

  // Add the createdBy field
  const quizzesWithUser = quizzes.map(q => ({ ...q, createdBy: '68a7df93874e7862212dcdd2' }));

  const createdQuizzes = await Quiz.insertMany(quizzesWithUser);
  console.log(`${createdQuizzes.length} quizzes created successfully!`);

  mongoose.disconnect();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});