# kanban_for_claude
This repo gives you what you need to set up Claude-powered Kanban board in your Claude project.  (We're talking about the Claude AI product from Anthropic.) The board is a single file that lives in your Claude project. Claude reads it at the start of each session, displays it as an interactive board, and can update it based on your instructions.

The board supports five columns (Backlog, Up Next, In Progress, Waiting On, Done), multiple color-coded projects, weekly planning, person tagging, priority flags, recurring tasks, and a hidden “Private” project that surfaces only for tagged weeks.

**Setup**
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

**Keeping The Board Current**

Tell Claude when you want to update a task or move it between columns.  Otherwise the changes will not stick. 

Before you leave a session, Add the latest Kanban board to the project.  (Hint: From the web interface, you can choose Add to Project from the upper-right hand menu.)

**Keeping Instructions Current**
These instructions live in a .docx file in your Claude project. Whenever the instructions change — new projects, new preferences, workflow tweaks — ask Claude to produce an updated Project Instructions. Add it to the project.  (Hint: From the web interface, you can choose Add to Project from the upper-right hand menu.)   Claude will always read the file with the most recent datestamp.

**Weekly Rhythm**
Friday (plan): Claude walks through each project one at a time.  It presents what’s already in motion, what’s scheduled to auto-arrive, and backlog candidates — then you pick.  When done, Claude shows the full list of → tagged tasks as a confirmation preview. Then: “Did you finish anything this week that should go on your Yearly Accomplishments list?” If so, Claude will ask for information to add to your Yearly Accomplishments.

Monday (execute): The plan is already set. Hit the ground running. Any tasks tagged for this week will be highlighted.

Next Friday (review → plan): Review which planned tasks made it to Done vs. didn’t. Then plan the next week. Then run the Yearly Accomplishments check.

**Customization Tips**
•	Rename “My Kanban” in the header by editing the JSX directly or asking Claude to update it.
•	Add or remove columns by editing the COLUMNS array and COLUMN_META — but note the move buttons assume a linear order.
•	Change the board title, add a subtitle, or adjust the color scheme by asking Claude to edit the header section of the JSX.
•	Add more projects at any time — just describe them to Claude and it will add the entry and assign a color.
•	The Private project pattern works for any project you want hidden by default — just tell Claude to add it to the Private project.

**Suggested Claude Preferences**
Add a “My Preferences” section to your instructions document to shape how Claude interacts with you. Some suggestions:

•	Any time you don’t know something, say so. Don’t make things up.
•	Keep responses friendly, conversational, and concise.
•	When I give you an update on a task, suggest the appropriate board move.
•	Don’t over-format casual responses with excessive headers or bullet points.
•	Remind me when changes made during a session should be reflected in the instructions document.

