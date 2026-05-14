type ModuleCard = {
  name: string;
  summary: string;
  phase: string;
  accent: string;
};

const modules: ModuleCard[] = [
  {
    name: "ThreatBoard",
    summary: "Vulnerability intelligence and exposure prioritisation.",
    phase: "Phase 2",
    accent: "#f4b860",
  },
  {
    name: "LogLens",
    summary: "Suspicious login and behavioural anomaly review.",
    phase: "Phase 3",
    accent: "#71a7ff",
  },
  {
    name: "DataPrivacy Doctor",
    summary: "Dataset privacy-risk scanning and reporting.",
    phase: "Phase 4",
    accent: "#43d9ad",
  },
  {
    name: "Misinformation Observatory",
    summary: "Aggregate narrative and online harm signal monitoring.",
    phase: "Phase 6",
    accent: "#ee6c7a",
  },
  {
    name: "Civic Risk Graph",
    summary: "Cross-module context for assets, alerts, evidence, and incidents.",
    phase: "Phase 7",
    accent: "#b8a3ff",
  },
  {
    name: "IncidentFlow",
    summary: "Incident response workflows and evidence-backed reports.",
    phase: "Phase 5",
    accent: "#8ed8f8",
  },
];

const foundations = [
  "Open-source-first",
  "Defensive use",
  "Fictional demo data",
  "Local Docker stack",
];

function App() {
  return (
    <main className="min-h-screen bg-civic-surface text-civic-text">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-civic-line pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase text-civic-teal">
              Public-interest security intelligence
            </p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">CivicSec Lab</h1>
            <p className="mt-4 max-w-2xl text-lg text-civic-muted">
              Cyber, data, and platform-risk intelligence for civic organisations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[34rem]">
            {foundations.map((item) => (
              <div
                className="rounded-lg border border-civic-line bg-civic-panel px-3 py-3 text-sm text-civic-muted"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-civic-line bg-civic-panel p-5 shadow-panel">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Platform Foundation</h2>
                <p className="mt-1 text-sm text-civic-muted">Phase 0 scaffold is active.</p>
              </div>
              <span className="w-fit rounded-full border border-civic-teal/40 bg-civic-teal/10 px-3 py-1 text-sm font-medium text-civic-teal">
                Early development
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-civic-line bg-[#131619] p-4">
                <p className="text-sm text-civic-muted">Backend</p>
                <p className="mt-2 text-2xl font-semibold text-white">Django</p>
              </div>
              <div className="rounded-lg border border-civic-line bg-[#131619] p-4">
                <p className="text-sm text-civic-muted">Frontend</p>
                <p className="mt-2 text-2xl font-semibold text-white">React</p>
              </div>
              <div className="rounded-lg border border-civic-line bg-[#131619] p-4">
                <p className="text-sm text-civic-muted">Runtime</p>
                <p className="mt-2 text-2xl font-semibold text-white">Docker</p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-civic-line bg-civic-panel p-5">
            <h2 className="text-xl font-semibold text-white">Open Civic Aid</h2>
            <p className="mt-3 text-sm leading-6 text-civic-muted">
              Fictional sample organisation for safe local demos and future module walkthroughs.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Assets", "Login logs", "Volunteer CSV", "Public posts", "Vulnerability inventory"].map(
                (item) => (
                  <span
                    className="rounded-full border border-civic-line px-3 py-1 text-sm text-civic-muted"
                    key={item}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </aside>
        </section>

        <section aria-labelledby="module-grid-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white" id="module-grid-heading">
                Module Map
              </h2>
              <p className="mt-1 text-sm text-civic-muted">Planned civic-risk workspaces.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <article
                className="rounded-lg border border-civic-line border-t-4 bg-civic-panel p-5 shadow-panel"
                key={module.name}
                style={{ borderTopColor: module.accent }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                  <span className="shrink-0 rounded-full border border-civic-line px-2.5 py-1 text-xs font-medium text-civic-muted">
                    {module.phase}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-civic-muted">{module.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
