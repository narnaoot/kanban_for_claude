# kanban_for_claude
This repo gives you what you need to set up Claude-powered Kanban board in your Claude project.  (We're talking about the Claude AI product from Anthropic.) The board is a single file that lives in your Claude project. Claude reads it at the start of each session, displays it as an interactive board, and can update it based on your instructions.

The board supports five columns (Backlog, Up Next, In Progress, Waiting On, Done), multiple color-coded projects, weekly planning, person tagging, priority flags, recurring tasks, and a hidden “Private” project that surfaces only for tagged weeks.

Setup
Step 1: Create a Claude Project
Go to Claude.ai and create a new Project. Projects give Claude persistent context — files you add/attach are available at the start of every session.

Step 2: Add/ attach the JSX file
Add/ attach your kanban JSX file from this repo (e.g. kanban_YYYY-MM-DD_v1.jsx) to the project. This is your board. Claude will read it at the start of each session.

Step 3: Add/ attach the instructions document
Add/ attach the Word document from this repo to the project as well. Your system prompt should be a single line:

Step 4: Add the information to the Instructions box for the project.
Copy and paste this text into the Instructions/ Directions for this project.

“Instructions are in the latest version of the attached Project_Instructions. Always read it at the start of each session.”

That’s it. Claude will read the instructions and display your board automatically.

The Board
Displaying the Board
At the start of each session, Claude displays the board by writing the JSX to /mnt/user-data/outputs/ and calling present_files. This is the only correct method — do not ask Claude to paste the JSX as a code block, use the Visualizer tool, or use artifact tags.

When rendering the board, Claude names the output file with today’s date and a version number:

kanban_YYYY-MM-DD_v1.jsx

Each subsequent save within the same session increments the version number (v2, v3, etc.). At the end of sessions where changes were made, download the latest version and add it to the project — this becomes the board Claude reads next session.

Projects
Projects are defined in the PROJECTS array near the top of the JSX. Each project has an id, a name, a colorIndex (0–6), and optionally hiddenByDefault: true for private projects.

Available color indices:
•	0 — Blue
•	1 — Pink
•	2 — Gray
•	3 — Green
•	4 — Orange
•	5 — Teal
•	6 — Indigo

To add a project, add an entry to the PROJECTS array and (if needed) a section in TASKS. Always confirm the correct project with Claude before it assigns tasks.

Task Fields
Each task in the TASKS array supports the following fields:

•	id — unique string, e.g. “task-1001”. Always increment from the highest existing ID.
•	projectId — must match an id in the PROJECTS array
•	column — one of: Backlog, Up Next, In Progress, Waiting On, Done
•	text — the task title shown on the card
•	notes — optional detail; shown when card is expanded (always shown in Waiting On)
•	person — optional; tags a task to a person; filterable via the header dropdown
•	priority: “p1” — marks as top priority; renders with red P1 badge, red glow, red left border
•	weekPlan: “YYYY-WNN” — tags task for weekly plan; highlighted on the board
•	recurringDay: 0–6 (Sun–Sat) — auto-promotes to Up Next on that weekday
•	recurringFirstMonday: true — auto-promotes to Up Next on the first Monday of each month
•	scheduledDate: “YYYY-MM-DD” — auto-promotes to Up Next on/after that date (one-time)
•	doneDate: “YYYY-MM-DD” — set automatically when moved to Done. Task hides after 30 days but stays in the data.

Visual Styling
•	Current week tasks (weekPlan = CURRENT_WEEK): amber/yellow glow, gold border, ★ indicator
•	Planning week tasks (weekPlan = PLANNING_WEEK): same amber/yellow glow and border, → indicator
•	P1 tasks: red glow, red left border, red P1 badge — overrides week styling
•	Done cards show a small ✓ date badge
•	Private project tasks only appear on the main board if tagged with CURRENT_WEEK or PLANNING_WEEK

Moving Tasks
Click any card to expand it. Use the arrow buttons to move it left or right across columns. Claude can also move tasks when you describe updates verbally — just tell it what happened and it will suggest the appropriate move.

Weekly Planning
The board computes two week values automatically at runtime:
•	CURRENT_WEEK: the ISO week containing today (e.g. “2026-W12”)
•	PLANNING_WEEK: CURRENT_WEEK + 1 (used on Fridays to preview next week’s commitments)

The board also contains a WEEKLY_PLAN_COMPLETE constant. Once the Friday planning workflow and the Yearly Accomplishments check are both done, Claude sets this to the planned week string (e.g. “2026-W13”) and saves a new version. At the start of any subsequent Friday session, Claude reads this value — if it already matches PLANNING_WEEK, it skips the planning workflow.

Weekly Rhythm
Friday (plan): Claude checks WEEKLY_PLAN_COMPLETE. If it already matches PLANNING_WEEK, planning is done — skip ahead. Otherwise: walk through each project one at a time. Claude presents what’s already in motion, what’s scheduled to auto-arrive, and backlog candidates — then you pick. Tag chosen tasks with PLANNING_WEEK. When done, Claude shows the full list of → tagged tasks as a confirmation preview. Then: “Did you finish anything this week that should go on your Yearly Accomplishments list?” Once complete, Claude sets WEEKLY_PLAN_COMPLETE and saves a new board version.

Monday (execute): The plan is already set. Hit the ground running. Any tasks tagged for CURRENT_WEEK will be highlighted with ★.

Next Friday (review → plan): Review which planned tasks made it to Done vs. didn’t. Then plan the next week. Then run the Yearly Accomplishments check.

Yearly Accomplishments Document
A running log called Yearly_Accomplishments.docx tracks notable completions throughout the year — useful for performance review self-evaluations. The document has four columns: Date, Project/Area, Accomplishment, and Week.

It is updated during Friday planning sessions. When adding a new entry, Claude builds a new .docx from scratch (the project file stores it as plain text). The output file is always named Yearly_Accomplishments_YYYY-MM-DD.docx using today’s date. Download it and replace the previous version in your project.

Keeping Instructions Current
These instructions live in a .docx file in your Claude project. Whenever the instructions change — new projects, new preferences, workflow tweaks — ask Claude to produce an updated Project_Instructions_YYYY-MM-DD.docx. Download it and add it to the project. Claude will always read the file with the most recent datestamp.

Customization Tips
•	Rename “My Kanban” in the header by editing the JSX directly or asking Claude to update it.
•	Add or remove columns by editing the COLUMNS array and COLUMN_META — but note the move buttons assume a linear order.
•	Change the board title, add a subtitle, or adjust the color scheme by asking Claude to edit the header section of the JSX.
•	Add more projects at any time — just describe them to Claude and it will add the entry and assign a color.
•	The Private project pattern works for any project you want hidden by default — just add 

hiddenByDefault: true to its PROJECTS entry.

Suggested Claude Preferences
Add a “My Preferences” section to your instructions document to shape how Claude interacts with you. Some suggestions:

•	Any time you don’t know something, say so. Don’t make things up.
•	Keep responses friendly, conversational, and concise.
•	When I give you an update on a task, suggest the appropriate board move.
•	Don’t over-format casual responses with excessive headers or bullet points.
•	Remind me when changes made during a session should be reflected in the instructions document.

