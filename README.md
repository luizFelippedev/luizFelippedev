<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,25:0a1628,60:0d2f45,85:0a3d2e,100:00ff8833&height=300&section=header&text=Luiz%20Felipe&fontSize=90&fontColor=ffffff&fontAlignY=38&desc=Senior%20Software%20Engineer%20%E2%80%94%20Full%20Stack%20Developer&descSize=22&descFontColor=00ffaa&descAlignY=60&animation=fadeIn"/>

<div align="center">

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=16&duration=3000&pause=1000&color=00FFAA&center=true&vCenter=true&width=620&lines=_%3E+5%2B+years+crafting+production-grade+software+%E2%9A%A1;_%3E+React+%C2%B7+Node.js+%C2%B7+TypeScript+%C2%B7+Python+%C2%B7+Docker+%C2%B7+AWS;_%3E+Clean+Architecture+%C2%B7+TDD+%C2%B7+Microservices+%C2%B7+CI%2FCD;_%3E+Open+to+Full-time+%7C+Freelance+%7C+Open+Source)](https://git.io/typing-svg)

<br/>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/luizfelippetech/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/luizFelippedev)
[![Views](https://komarev.com/ghpvc/?username=luizFelippedev&style=for-the-badge&color=00ffaa&label=PROFILE+VIEWS)](https://github.com/luizFelippedev)
[![Available](https://img.shields.io/badge/OPEN%20TO%20WORK-00ffaa?style=for-the-badge&logo=checkmarx&logoColor=black)](https://github.com/luizFelippedev)

</div>

---

## 👤 About Me

```ts
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║    ██╗     ██╗   ██╗██╗███████╗    ███████╗███████╗██╗     ██╗██████╗   ║
// ║    ██║     ██║   ██║██║╚══███╔╝    ██╔════╝██╔════╝██║     ██║██╔══██╗  ║
// ║    ██║     ██║   ██║██║  ███╔╝     █████╗  █████╗  ██║     ██║██████╔╝  ║
// ║    ██║     ██║   ██║██║ ███╔╝      ██╔══╝  ██╔══╝  ██║     ██║██╔═══╝   ║
// ║    ███████╗╚██████╔╝██║███████╗    ██║     ███████╗███████╗██║██║       ║
// ║    ╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚═╝     ╚══════╝╚══════╝╚═╝╚═╝       ║
// ║                                                                          ║
// ║          > SENIOR SOFTWARE ENGINEER  ·  FULL STACK  ·  BRAZIL 🇧🇷        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * @file         profile.ts
 * @author       Luiz Felipe <luizfelippetech>
 * @version      2025.1.0
 * @since        2019
 *
 * @description
 *   Senior Software Engineer with 5+ years of experience designing and
 *   shipping scalable, maintainable systems across the full stack.
 *   Passionate about clean code, developer experience, and building
 *   products that actually solve real problems.
 *
 * @role         Senior Software Engineer — Full Stack
 * @location     Brazil 🇧🇷  (UTC-3 · Remote-friendly)
 * @status       ✅  Open to new opportunities
 * @contact      linkedin.com/in/luizfelippetech
 */

// ─────────────────────────────────────────────────────────────────────────────
//  INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

type Level     = "expert" | "advanced" | "intermediate";
type Paradigm  = "OOP" | "Functional" | "Reactive" | "Event-Driven";

interface TechStack {
  languages  : string[];
  frontend   : string[];
  backend    : string[];
  databases  : string[];
  devops     : string[];
  cloud      : string[];
  testing    : string[];
}

interface Engineer {
  name        : string;
  role        : string;
  experience  : string;
  stack       : TechStack;
  paradigms   : Paradigm[];
  methodology : string[];
  strengths   : string[];
  building    : string;
  openTo      : string[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

const luizFelipe: Engineer = {

  name        : "Luiz Felipe",
  role        : "Senior Software Engineer — Full Stack",
  experience  : "5+ years · 30+ projects shipped to production",

  stack: {
    languages : ["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "Kotlin", "C#"],
    frontend  : ["React", "Next.js", "Redux", "TailwindCSS", "Sass", "Vite", "Storybook"],
    backend   : ["Node.js", "NestJS", "Express", "FastAPI", "Django", "Spring Boot", "GraphQL"],
    databases : ["PostgreSQL", "MongoDB", "Redis", "MySQL", "Elasticsearch", "Supabase"],
    devops    : ["Docker", "Kubernetes", "GitHub Actions", "Jenkins", "Terraform", "Nginx"],
    cloud     : ["AWS", "Google Cloud Platform", "Firebase", "Vercel"],
    testing   : ["Jest", "Vitest", "Cypress", "Playwright", "SonarQube"],
  },

  paradigms   : ["OOP", "Functional", "Reactive", "Event-Driven"],

  methodology : [
    "Clean Architecture",   // separation of concerns, testability
    "SOLID Principles",     // maintainable and extensible code
    "Test-Driven Dev",      // reliability, fewer regressions
    "Domain-Driven Design", // business-aligned software modeling
    "Agile / Scrum",        // iterative delivery, continuous value
  ],

  strengths   : [
    "System design & scalable architecture",
    "Technical leadership & code review",
    "Cross-functional team collaboration",
    "Developer experience & best practices",
    "Mentorship & knowledge transfer",
  ],

  building    : "high-performance APIs and pixel-perfect interfaces ⚡",

  openTo      : ["Full-time", "Freelance", "Open Source", "Tech Consulting"],

};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default luizFelipe;
```

---

## 🛠️ Tech Stack

<div align="center">

**Languages**

[![Skills](https://skillicons.dev/icons?i=js,ts,python,java,go,rust,kotlin,cs,php,ruby&theme=dark&perline=10)](https://skillicons.dev)

**Frontend**

[![Skills](https://skillicons.dev/icons?i=react,nextjs,redux,tailwind,html,css,sass,vite,figma,storybook&theme=dark&perline=10)](https://skillicons.dev)

**Backend**

[![Skills](https://skillicons.dev/icons?i=nodejs,express,nestjs,fastapi,django,spring,rails,graphql,nginx,prisma&theme=dark&perline=10)](https://skillicons.dev)

**Databases & Storage**

[![Skills](https://skillicons.dev/icons?i=postgres,mongodb,mysql,redis,sqlite,firebase,elasticsearch,supabase&theme=dark&perline=10)](https://skillicons.dev)

**DevOps · Cloud · Infrastructure**

[![Skills](https://skillicons.dev/icons?i=docker,kubernetes,aws,gcp,githubactions,jenkins,terraform,linux,git,vercel&theme=dark&perline=10)](https://skillicons.dev)

**Testing & Tools**

[![Skills](https://skillicons.dev/icons?i=jest,vitest,cypress,postman,vscode,github,gitlab,webpack,babel,figma&theme=dark&perline=10)](https://skillicons.dev)

</div>

---

## 📊 GitHub Analytics

<div align="center">

<img height="185" src="https://github-readme-stats.vercel.app/api?username=luizFelippedev&show_icons=true&theme=github_dark&bg_color=0d1117&border_color=21262d&title_color=00ffaa&icon_color=58a6ff&text_color=8b949e&border_radius=12&include_all_commits=true&count_private=true&custom_title=Statistics"/>
&nbsp;
<img height="185" src="https://streak-stats.demolab.com/?user=luizFelippedev&theme=github-dark-blue&background=0d1117&border=21262d&ring=00ffaa&fire=58a6ff&currStreakNum=ffffff&sideNums=00ffaa&currStreakLabel=58a6ff&sideLabels=8b949e&dates=3d5263&border_radius=12"/>

<br/><br/>

<img width="96%" src="https://github-readme-activity-graph.vercel.app/graph?username=luizFelippedev&theme=github-compact&bg_color=0d1117&color=00ffaa&line=58a6ff&point=00ffaa&area=true&area_color=00ffaa18&border_color=21262d&custom_title=Contribution+Activity"/>

</div>

---

## 🏆 Achievements

<div align="center">

[![trophy](https://github-profile-trophy.vercel.app/?username=luizFelippedev&theme=algolia&no-frame=true&no-bg=true&column=8&margin-w=6)](https://github.com/ryo-ma/github-profile-trophy)

</div>

---

## 🚀 Featured Projects

<div align="center">

[![Repo1](https://github-readme-stats.vercel.app/api/pin/?username=luizFelippedev&repo=2Document&theme=github_dark&bg_color=0d1117&border_color=21262d&title_color=00ffaa&text_color=8b949e&icon_color=58a6ff&border_radius=12)](https://github.com/luizFelippedev)
&nbsp;
[![Repo2](https://github-readme-stats.vercel.app/api/pin/?username=luizFelippedev&repo=bc-api&theme=github_dark&bg_color=0d1117&border_color=21262d&title_color=00ffaa&text_color=8b949e&icon_color=58a6ff&border_radius=12)](https://github.com/luizFelippedev)

</div>

---

## 🤝 Let's Connect

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Luiz%20Felipe-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/luizfelippetech/)
[![GitHub](https://img.shields.io/badge/GitHub-luizFelippedev-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/luizFelippedev)
[![Email](https://img.shields.io/badge/Email-Contact%20Me-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:luizfelippe@dev.com)

<br/>

> *"Good programmers write code that humans can understand."* — **Martin Fowler**

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:00ff8822,50:0a3d2e,80:0a1628,100:0d1117&height=160&section=footer"/>
