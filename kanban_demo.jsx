import { useState, useMemo, useCallback, memo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = ["Backlog", "Up Next", "In Progress", "Waiting On", "Done"];

const COLUMN_META = {
  "Backlog":     { icon: "○", accent: "#94a3b8" },
  "Waiting On":  { icon: "⏳", accent: "#8b5cf6" },
  "Up Next":     { icon: "▶", accent: "#f59e0b" },
  "In Progress": { icon: "⚡", accent: "#0ea5e9" },
  "Done":        { icon: "✓", accent: "#6ee7b7" },
};

const PROJECT_COLORS = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8", dot: "#3b82f6" }, // 0 blue
  { bg: "#fce7f3", border: "#ec4899", text: "#be185d", dot: "#ec4899" }, // 1 pink
  { bg: "#f3f4f6", border: "#9ca3af", text: "#4b5563", dot: "#9ca3af" }, // 2 gray
  { bg: "#d1fae5", border: "#10b981", text: "#065f46", dot: "#10b981" }, // 3 green
  { bg: "#fff7ed", border: "#f97316", text: "#c2410c", dot: "#f97316" }, // 4 orange
  { bg: "#ccfbf1", border: "#0d9488", text: "#0f766e", dot: "#0d9488" }, // 5 teal
  { bg: "#ede9fe", border: "#7c3aed", text: "#5b21b6", dot: "#7c3aed" }, // 6 indigo
];

const DONE_DISPLAY_DAYS = 30;

// ─── Weekly Planning State ────────────────────────────────────────────────────
// Set to the week string (e.g. "2026-W13") once planning AND yearly accomplishments
// check are complete for that week. Claude checks this at session start on Fridays
// to avoid re-running the planning workflow.
const WEEKLY_PLAN_COMPLETE = null;

// ─── Projects ─────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: "proj-1",  name: "Project 1", colorIndex: 0 },
  { id: "proj-2",  name: "Project 2", colorIndex: 1 },
  { id: "proj-3",  name: "Project 3", colorIndex: 3 },
  { id: "private", name: "Private",   colorIndex: 4, hiddenByDefault: true },
];

const PROJECT_MAP = Object.fromEntries(PROJECTS.map(p => [p.id, p]));
const COLOR_MAP   = Object.fromEntries(PROJECTS.map(p => [p.id, PROJECT_COLORS[p.colorIndex] ?? PROJECT_COLORS[2]]));
const HIDDEN_PROJECT_IDS = new Set(PROJECTS.filter(p => p.hiddenByDefault).map(p => p.id));

// ─── Tasks ────────────────────────────────────────────────────────────────────
// doneDate: "YYYY-MM-DD" — set when task moved to Done. Tasks without doneDate
// are treated as recently done (visible). After DONE_DISPLAY_DAYS, hidden from board
// but still present in data.

const TODAY_STR = new Date().toISOString().slice(0, 10);

const TASKS = [
  // ── Project 1 ───────────────────────────────────────────────────────────────
  { id: "task-1001", projectId: "proj-1", column: "Backlog",     text: "Project 1 — Task A", notes: "Example backlog task.", person: "Sam" },
  { id: "task-1002", projectId: "proj-1", column: "In Progress", weekPlan: "CURRENT", priority: "p1", text: "Project 1 — Task B", notes: "This task is tagged for this week and marked P1 — note the red glow and badge.", person: "Dick" },
  { id: "task-1003", projectId: "proj-1", column: "Done",        doneDate: TODAY_STR, text: "Project 1 — Task C", notes: "Completed today — note the \u2713 date badge." },

  // ── Project 2 ───────────────────────────────────────────────────────────────
  { id: "task-2001", projectId: "proj-2", column: "Up Next",    weekPlan: "NEXT",    text: "Project 2 — Task A", notes: "Tagged for next week \u2014 note the \u2192 indicator.", person: "Jane" },
  { id: "task-2002", projectId: "proj-2", column: "Waiting On",                      text: "Project 2 — Task B", notes: "Waiting on someone to respond. Notes are always visible on Waiting On cards.", person: "Sam" },
  { id: "task-2003", projectId: "proj-2", column: "Backlog",    weekPlan: "CURRENT", text: "Project 2 — Task C", notes: "Tagged for this week \u2014 note the amber glow and \u2605 indicator.", person: "Dick" },

  // ── Project 3 ───────────────────────────────────────────────────────────────
  { id: "task-3001", projectId: "proj-3", column: "In Progress", text: "Project 3 — Task A", notes: "Actively being worked on. Click any card to expand it and see move buttons.", person: "Jane" },
  { id: "task-3002", projectId: "proj-3", column: "Backlog",     recurringDay: 1,     text: "Project 3 — Task B", notes: "\uD83D\uDD01 Recurring every Monday \u2014 auto-promotes to Up Next on Mondays." },
  { id: "task-3003", projectId: "proj-3", column: "Backlog",                          text: "Project 3 — Task C", notes: "Another backlog item.", person: "Sam" },

  // ── Private ─────────────────────────────────────────────────────────────────
  // Hidden from the default board view. Click "Private" in the header to see them.
  // Tasks tagged with a weekPlan will surface on the main board automatically that week.
  { id: "task-4001", projectId: "private", column: "Up Next",  weekPlan: "CURRENT", text: "Private \u2014 Task A", notes: "Tagged for this week \u2014 surfaces on the main board automatically.", person: "Jane" },
  { id: "task-4002", projectId: "private", column: "Backlog",                       text: "Private \u2014 Task B", notes: "Hidden from default view \u2014 only visible when filtering to Private." },
  { id: "task-4003", projectId: "private", column: "Backlog",                       text: "Private \u2014 Task C", notes: "Click the Private button in the header to reveal all private tasks." },
];

// ─── Scheduling logic ─────────────────────────────────────────────────────────

function isFirstMondayOfMonth(date) {
  return date.getDay() === 1 && date.getDate() <= 7;
}

function isoWeekOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMonday);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function addWeeks(weekStr, n) {
  const [year, wPart] = weekStr.split("-W");
  const w = parseInt(wPart, 10) + n;
  return `${year}-W${String(w).padStart(2, "0")}`;
}

const now = new Date();
const CURRENT_WEEK  = isoWeekOf(now);
const PLANNING_WEEK = addWeeks(CURRENT_WEEK, 1);

function applyScheduling(tasks) {
  const todayDay = now.getDay();
  const todayStr = now.toISOString().slice(0, 10);
  const firstMonday = isFirstMondayOfMonth(now);

  return tasks.map(task => {
    const t = { ...task };
    // Resolve placeholder weekPlan values
    if (t.weekPlan === "CURRENT") t.weekPlan = CURRENT_WEEK;
    if (t.weekPlan === "NEXT")    t.weekPlan = PLANNING_WEEK;

    const isRecurring    = t.recurringDay !== undefined && todayDay === t.recurringDay;
    const isFirstMonthly = t.recurringFirstMonday && firstMonday;
    const isScheduled    = t.scheduledDate && todayStr >= t.scheduledDate;
    if ((isRecurring || isFirstMonthly || isScheduled) && (t.column === "Backlog" || t.column === "Waiting On")) {
      return { ...t, column: "Up Next" };
    }
    return t;
  });
}

// ─── Done visibility ──────────────────────────────────────────────────────────

function isDoneVisible(task) {
  if (task.column !== "Done") return true;
  if (!task.doneDate) return true;
  const done = new Date(task.doneDate);
  const diffDays = (now - done) / (1000 * 60 * 60 * 24);
  return diffDays <= DONE_DISPLAY_DAYS;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = memo(function Card({ task, onMove }) {
  const [expanded, setExpanded] = useState(false);

  const project    = PROJECT_MAP[task.projectId];
  const color      = COLOR_MAP[task.projectId] ?? PROJECT_COLORS[2];
  const currentIdx = COLUMNS.indexOf(task.column);
  const isThisWeek = task.weekPlan === CURRENT_WEEK;
  const isNextWeek = task.weekPlan === PLANNING_WEEK;
  const isDone     = task.column === "Done";
  const isP1       = task.priority === "p1";

  let bg, border, glowShadow, glowHover;

  if (isP1) {
    bg = "#fff1f2"; border = "1px solid #fda4af";
    glowShadow = "0 1px 8px rgba(239,68,68,0.25)";
    glowHover  = "0 4px 20px rgba(239,68,68,0.4)";
  } else if (isThisWeek || isNextWeek) {
    bg = "#fffbeb"; border = "1px solid #fcd34d";
    glowShadow = "0 1px 6px rgba(245,158,11,0.18)";
    glowHover  = "0 4px 16px rgba(245,158,11,0.25)";
  } else {
    bg = "#fff"; border = "1px solid #e5e7eb";
    glowShadow = "0 1px 4px rgba(0,0,0,0.06)";
    glowHover  = "0 4px 16px rgba(0,0,0,0.1)";
  }

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = glowHover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = glowShadow}
      style={{
        background: bg, borderRadius: "10px",
        border, borderLeft: `4px solid ${isP1 ? "#ef4444" : color.border}`,
        padding: "12px 14px", marginBottom: "10px",
        boxShadow: glowShadow, cursor: "pointer", transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: isP1 ? "#ef4444" : color.dot, marginTop: 5, flexShrink: 0, display: "inline-block" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>
            {isP1 && <span style={{ background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 800, borderRadius: "4px", padding: "1px 5px", marginRight: "5px", letterSpacing: "0.05em" }}>P1</span>}
            {isThisWeek && !isP1 && <span style={{ color: "#f59e0b", marginRight: "4px", fontSize: "12px" }}>★</span>}
            {isNextWeek && <span style={{ color: "#f59e0b", marginRight: "4px", fontSize: "12px" }}>→</span>}
            {task.text}
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
            <div style={{ fontSize: "11.5px", color: color.text, fontWeight: 500, background: color.bg, borderRadius: "4px", padding: "1px 6px" }}>
              {project?.name}
            </div>
            {task.person && (
              <div style={{ fontSize: "11.5px", color: "#6d28d9", fontWeight: 500, background: "#ede9fe", borderRadius: "4px", padding: "1px 6px" }}>
                👤 {task.person}
              </div>
            )}
            {isDone && task.doneDate && (
              <div style={{ fontSize: "11px", color: "#6b7280", background: "#f3f4f6", borderRadius: "4px", padding: "1px 6px" }}>
                ✓ {task.doneDate}
              </div>
            )}
          </div>
          {(expanded || task.column === "Waiting On") && task.notes && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b", background: "#f8fafc", borderRadius: "6px", padding: "6px 8px", lineHeight: 1.5 }}>
              {task.notes}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
          {currentIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onMove(task.id, COLUMNS[currentIdx - 1]); }}
              style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "5px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: 500 }}
            >
              \u2190 {COLUMNS[currentIdx - 1]}
            </button>
          )}
          {currentIdx < COLUMNS.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); onMove(task.id, COLUMNS[currentIdx + 1]); }}
              style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "5px", border: "none", background: isP1 ? "#ef4444" : color.border, color: "#fff", cursor: "pointer", fontWeight: 500 }}
            >
              {COLUMNS[currentIdx + 1]} \u2192
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Column ───────────────────────────────────────────────────────────────────

const Column = memo(function Column({ col, tasks, onMove }) {
  const meta     = COLUMN_META[col];
  const isActive = col === "In Progress";

  return (
    <div style={{
      minWidth: isActive ? "290px" : "220px",
      maxWidth: isActive ? "310px" : "240px",
      flex: isActive ? "0 0 300px" : "0 0 230px",
      background: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)",
      backdropFilter: "blur(8px)",
      borderRadius: "14px",
      border: isActive ? `2px solid ${meta.accent}` : "1px solid rgba(255,255,255,0.9)",
      boxShadow: isActive ? `0 4px 24px rgba(14,165,233,0.18), 0 2px 12px rgba(0,0,0,0.08)` : "0 2px 12px rgba(0,0,0,0.06)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: isActive ? "16px 18px 14px" : "14px 16px 12px",
        borderBottom: `${isActive ? "4px" : "3px"} solid ${meta.accent}`,
        background: isActive ? "linear-gradient(135deg, #e0f2fe, #f0f9ff)" : "rgba(255,255,255,0.9)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: isActive ? "18px" : "14px", color: meta.accent }}>{meta.icon}</span>
          <span style={{ fontSize: isActive ? "15px" : "13px", fontWeight: 800, color: isActive ? meta.accent : "#1e293b", letterSpacing: "0.02em" }}>{col.toUpperCase()}</span>
        </div>
        <span style={{ background: meta.accent, color: "#fff", borderRadius: "10px", fontSize: "11px", fontWeight: 700, padding: "2px 8px", minWidth: "22px", textAlign: "center" }}>
          {tasks.length}
        </span>
      </div>
      <div style={{ padding: "12px 12px 16px", minHeight: "80px" }}>
        {tasks.length === 0
          ? <div style={{ textAlign: "center", color: "#cbd5e1", fontSize: "12px", padding: "20px 0", fontStyle: "italic" }}>Empty</div>
          : tasks.map(task => <Card key={task.id} task={task} onMove={onMove} />)
        }
      </div>
    </div>
  );
});

// ─── Board ────────────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const [tasks, setTasks]                 = useState(() => applyScheduling(TASKS));
  const [filterProject, setFilterProject] = useState("all");
  const [filterPerson,  setFilterPerson]  = useState("all");

  const moveTask = useCallback((taskId, newCol) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updated = { ...t, column: newCol };
      if (newCol === "Done" && !updated.doneDate) {
        updated.doneDate = new Date().toISOString().slice(0, 10);
      }
      if (newCol !== "Done") delete updated.doneDate;
      return updated;
    }));
  }, []);

  const allPeople = useMemo(
    () => [...new Set(tasks.filter(t => t.person).map(t => t.person))].sort(),
    [tasks]
  );

  const visibleTasks = useMemo(() => {
    let base = filterProject === "all"
      ? tasks.filter(t => !HIDDEN_PROJECT_IDS.has(t.projectId) || t.weekPlan === CURRENT_WEEK || t.weekPlan === PLANNING_WEEK)
      : tasks.filter(t => t.projectId === filterProject);
    base = base.filter(isDoneVisible);
    if (filterPerson !== "all") base = base.filter(t => t.person === filterPerson);
    return base;
  }, [tasks, filterProject, filterPerson]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)", fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>PROJECT BOARD</div>
          <div style={{ color: "#f1f5f9", fontSize: "22px", fontWeight: "bold", marginTop: "2px" }}>My Kanban</div>
          <div style={{ color: "#64748b", fontSize: "11px", fontFamily: "monospace", marginTop: "2px" }}>
            This week: <span style={{ color: "#f59e0b" }}>{CURRENT_WEEK}</span>
            &nbsp;\u00b7&nbsp;Planning: <span style={{ color: "#f59e0b" }}>{PLANNING_WEEK}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
          <select
            value={filterPerson}
            onChange={e => setFilterPerson(e.target.value)}
            style={{ padding: "4px 10px", borderRadius: "20px", border: filterPerson !== "all" ? "2px solid #8b5cf6" : "1px solid #475569", background: filterPerson !== "all" ? "#ede9fe" : "rgba(255,255,255,0.08)", color: filterPerson !== "all" ? "#6d28d9" : "#cbd5e1", fontSize: "12px", fontWeight: 600, cursor: "pointer", outline: "none" }}
          >
            <option value="all">👤 All people</option>
            {allPeople.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {PROJECTS.map(p => {
            const c      = PROJECT_COLORS[p.colorIndex];
            const active = filterProject === p.id;
            return (
              <button key={p.id} onClick={() => setFilterProject(active ? "all" : p.id)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", border: `2px solid ${active ? c.border : "transparent"}`, background: active ? c.bg : "rgba(255,255,255,0.08)", color: active ? c.text : "#cbd5e1", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
                {p.name}
              </button>
            );
          })}

          {(filterProject !== "all" || filterPerson !== "all") && (
            <button onClick={() => { setFilterProject("all"); setFilterPerson("all"); }}
              style={{ padding: "4px 12px", borderRadius: "20px", border: "1px solid #475569", background: "transparent", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: "flex", gap: "16px", padding: "24px 20px", overflowX: "auto", alignItems: "flex-start", minHeight: "calc(100vh - 80px)" }}>
        {COLUMNS.map(col => (
          <Column
            key={col}
            col={col}
            tasks={visibleTasks.filter(t => t.column === col)}
            onMove={moveTask}
          />
        ))}
      </div>
    </div>
  );
}
