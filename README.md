# 🚀 Smart Connector Extension

An intelligent Chrome Extension built with React, Vite, and Tailwind CSS that acts as an automated Networking AI CRM. The Smart Connector automatically scrapes, aligns, and scores professional profiles across the web based on your own Career Profile and custom Target Personas.

## ✨ Features

- **🧠 Intelligent Target Radar**: Define multiple target personas (including required roles, core skills, and weighted importance) and let the extension auto-score every lead you visit. Target matches are visibly flagged!
- **🌐 Multi-Profile Extraction**: Automatically parses emails, phone numbers, and LinkedIn links from *any* webpage—whether you're on a LinkedIn Profile or a startup's generic "About Us" page. 
- **🔎 Full Context Fuzzy Matching**: Powered by **Fuse.js**, the extension silently scrapes a candidate's full "About" and "Experience" sections, understanding typos, formatting variations, and deeply nested skills.
- **💼 ATS Matcher**: Paste a Job Description into the ATS tab and the extension will compare it against your saved profile, highlighting missing skills and penalizing for missing years of experience.
- **📊 Smart CRM UI**: View, sort, edit, and manually add leads directly from the sleek extension popup. It automatically categorizes leads as 'Student', 'Fresher', or 'Experienced'.
- **📥 One-Click Export**: Export your entire lead list to a cleanly formatted CSV, complete with Match Scores, extracted emails, phone numbers, and auto-populated target names.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Matching Engine**: Fuse.js (Fuzzy Searching)
- **Architecture**: Manifest V3 (Chrome Extension Background & Content Scripts)

## 📥 Installation

Since this is a custom Chrome Extension, you'll need to load it directly into your browser:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/himesh220002/Network-Chrome-Extension-app.git
   cd SmartConnectorExtension
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the extension:**
   ```bash
   npm run build
   ```
4. **Load into Chrome:**
   - Open Google Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in the top right corner).
   - Click **"Load unpacked"** in the top left.
   - Select the `dist` folder located inside the project directory.

## 💻 How to Use

1. **Pin the Extension**: Click the puzzle piece icon in Chrome and pin the Smart Connector for easy access.
2. **Configure Your Profile**: Open the extension and go to the **Profile** tab. Fill out your core skills and experience so the ATS Matcher can accurately score you against Job Descriptions.
3. **Set Up a Radar Target**: Go to the **Radar** tab and create a new Target Persona (e.g., "Senior React Developers"). Assign weights to their role and skills.
4. **Start Browsing**: Navigate to a LinkedIn Profile, a LinkedIn Search page, or a corporate website. The extension will automatically extract the profiles, calculate their Match Score against your Active Radar, and silently add them to your CRM!
5. **Manage Leads**: Open the **Connections** tab to view all extracted leads, manually add new ones, update their statuses, or export them to CSV.

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
