// Smart Connector Content Script
console.log("Smart Connector Content Script loaded.");

function extractData() {
  let url = window.location.href;
  const isLinkedInProfile = url.includes('linkedin.com/in/');
  const isLinkedInCompany = url.includes('linkedin.com/company/');
  const isBusiness = isLinkedInCompany || url.includes('google.com/maps/') || url.includes('google.com/search');
  
  const isNaukri = url.includes('naukri.com/job-listings');
  const isFoundit = url.includes('foundit.in/job');
  const isHirist = url.includes('hirist.tech/j/');
  const isJobPortal = isNaukri || isFoundit || isHirist;

  // Normalize LinkedIn Profile URL to ensure sub-pages merge correctly
  if (isLinkedInProfile) {
    const match = url.match(/(https:\/\/(www\.)?linkedin\.com\/in\/[^\/?#]+)/i);
    if (match) {
        url = match[1];
    }
  } else if (isJobPortal) {
    // Strip query parameters for job portals to keep them clean
    url = url.split('?')[0];
  }

  let connectionsToDispatch = [];

  if (isLinkedInProfile) {
    // SINGLE PROFILE EXTRACTION (LinkedIn)
    let name = document.title.split('-')[0].split('|')[0].trim();
    let role = '';
    let company = '';
    let topSkills = '';

    const h1 = document.querySelector('h1');
    if (h1) name = h1.innerText.trim();

    const headlineNode = document.querySelector('.text-body-medium.break-words');
    if (headlineNode) role = headlineNode.innerText.trim();

    // Robust fallback for Role (especially on /details/experience sub-pages)
    if (!role || url.includes('/details/experience')) {
        const mainContent = document.querySelector('main') || document.body;
        const lines = mainContent.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let startIndex = 0;
        const expHeaderIndex = lines.findIndex(l => l.toLowerCase() === 'experience');
        if (expHeaderIndex !== -1) startIndex = expHeaderIndex + 1;
        
        while (startIndex < lines.length && (lines[startIndex].toLowerCase().includes('linkedin') || lines[startIndex].length < 3)) {
            startIndex++;
        }
        
        if (startIndex < lines.length) {
            const potentialRole = lines[startIndex];
            if (potentialRole && !potentialRole.match(/\d{4}/)) {
                role = potentialRole;
                if (startIndex + 1 < lines.length && !lines[startIndex + 1].match(/\d{4}/)) {
                     company = lines[startIndex + 1];
                }
            }
        }
    }

    const companyNode = document.querySelector('button[aria-label*="Current company"]');
    if (companyNode) {
      company = companyNode.innerText.trim();
    } else {
      const ariaNodes = document.querySelectorAll('[aria-label]');
      for (const node of ariaNodes) {
        if (node.getAttribute('aria-label').includes('Current company')) {
          company = node.innerText.trim();
          break;
        }
      }
    }

    const allSpans = Array.from(document.querySelectorAll('span'));
    const topSkillsSpan = allSpans.find(s => s.innerText.trim() === 'Top skills');
    
    if (topSkillsSpan) {
       let parent = topSkillsSpan.parentElement;
       for(let i=0; i<5; i++) {
         if(parent) parent = parent.parentElement;
       }
       if (parent) {
         const textContent = parent.innerText;
         if (textContent.includes('•')) {
            const lines = textContent.split('\n');
            const skillsLine = lines.find(l => l.includes('•'));
            if (skillsLine) topSkills = skillsLine.trim();
         }
       }
    }
    
    if (!topSkills) {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const bulletDiv = allDivs.find(d => d.innerText && d.innerText.includes('•') && d.innerText.length > 20 && d.innerText.length < 200 && d.children.length === 0);
      if (bulletDiv) topSkills = bulletDiv.innerText.trim();
    }

    let notesArr = [];
    if (company) notesArr.push(`🏢 ${company}`);
    if (topSkills) notesArr.push(`💡 ${topSkills}`);
    const notes = notesArr.join(' | ');

    let careerStage = '';
    let totalYearsExp = 0;
    const textLower = document.body.innerText.toLowerCase();
    
    // Attempt to extract full context for Matcher algorithm
    let fullProfileContext = '';
    try {
        const aboutSection = Array.from(document.querySelectorAll('section')).find(s => s.innerText.toLowerCase().includes('about') && s.innerText.length > 50);
        if (aboutSection) fullProfileContext += aboutSection.innerText + '\n\n';
        
        const expSection = Array.from(document.querySelectorAll('section')).find(s => s.querySelector('h2') && s.querySelector('h2').innerText.toLowerCase().includes('experience'));
        if (expSection) fullProfileContext += expSection.innerText + '\n\n';
    } catch(e) {}
    
    // Match cumulative statements first (e.g. "Over 2.5 years of experience")
    const expMatch = textLower.match(/(\d+(?:\.\d+)?)\+?\s*y(?:ea)?r?s?(?: of)? experience/);
    if (expMatch && expMatch[1]) {
      careerStage = 'Experienced';
      totalYearsExp = Math.round(parseFloat(expMatch[1]) * 10) / 10;
    } else {
      let totalMonths = 0;
      
      // 1. Decade matching
      if (textLower.match(/\bdecade\b/)) totalMonths += 120;
      
      // 2. Decimal matching (e.g. "2.3 years", "1.5 yrs")
      const decimalMatches = textLower.match(/(\d+\.\d+)\s*y(?:ea)?r?s?/g);
      if (decimalMatches) {
         decimalMatches.forEach(m => {
            const val = parseFloat(m);
            if (!isNaN(val)) totalMonths += Math.round(val * 12);
         });
      }
      
      // 3. Standard and abbreviation matching (e.g. "2 years 3 months", "2y 3m", "2y3m")
      const durationMatches = textLower.match(/(\d+)\s*y(?:ea)?r?s?(?:\s*(\d+)\s*m(?:o|onth)?s?)?|(\d+)\s*m(?:o|onth)?s?/g);
      if (durationMatches && durationMatches.length > 0) {
         durationMatches.forEach(m => {
            const yrMatch = m.match(/(\d+)\s*y(?:ea)?r?s?/);
            const moMatch = m.match(/(\d+)\s*m(?:o|onth)?s?/);
            if (yrMatch && yrMatch[1]) totalMonths += parseInt(yrMatch[1], 10) * 12;
            if (moMatch && moMatch[1]) totalMonths += parseInt(moMatch[1], 10);
         });
         
         // Chronological fallback to prevent overlapping roles double-counting
         let chronoMonths = 0;
         const expSection = Array.from(document.querySelectorAll('section')).find(s => s.innerText.toLowerCase().includes('experience'));
         const searchArea = expSection ? expSection.innerText : document.body.innerText;
         const yearMatches = searchArea.match(/\b(199\d|20[0-2]\d)\b/g);
         
         if (yearMatches && yearMatches.length > 0) {
             const years = yearMatches.map(y => parseInt(y, 10));
             const minYear = Math.min(...years);
             const currentYear = new Date().getFullYear();
             if (minYear >= 1970 && minYear <= currentYear) {
                 chronoMonths = (currentYear - minYear) * 12;
             }
         }
         
         // Use the smaller of the two to combat massive double-counts, unless chrono is 0
         const finalMonths = (chronoMonths > 0 && chronoMonths < totalMonths) ? chronoMonths : totalMonths;

         if (finalMonths > 0) {
            careerStage = 'Experienced';
            totalYearsExp = Math.round((finalMonths / 12) * 10) / 10; // Supports 1 decimal place (e.g. 2y3m -> 27mo/12 -> 2.25 -> 2.3)
         }
      } else if (textLower.includes('student at') || textLower.includes('university ') || role.toLowerCase().includes('student')) {
         careerStage = 'Student';
      } else if (role.toLowerCase().includes('intern') || role.toLowerCase().includes('fresher')) {
         careerStage = 'Fresher';
      }
    }

    // Extract emails and phone numbers from the entire page text
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const emails = [...new Set(document.body.innerText.match(emailRegex) || [])];
    const email = emails.length > 0 ? emails[0] : '';

    const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g;
    const phones = [...new Set(document.body.innerText.match(phoneRegex) || [])];
    const phone = phones.length > 0 ? phones[0].trim() : '';

    connectionsToDispatch.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      email: email,
      phone: phone,
      url: url,
      name: name,
      role: role,
      isBusiness: false,
      status: 'Lead',
      notes: notes,
      careerStage: careerStage || undefined,
      totalYearsExp: totalYearsExp > 0 ? totalYearsExp : undefined,
      fullProfileContext: fullProfileContext || undefined,
      timestamp: Date.now()
    });

  } else if (isJobPortal) {
    // SINGLE JOB POSTING EXTRACTION (Naukri, Foundit, Hirist)
    let name = document.title.split('-')[0].split('|')[0].trim();
    let company = '';
    let role = 'Job Posting';
    let careerStage = '';
    let totalYearsExp = 0;

    const textLower = document.body.innerText.toLowerCase();

    // Heuristics to find experience for Job portals
    const expRegex = /(\d+)\s*(?:to|-)\s*(\d+)\s*years?/i;
    const match = textLower.match(expRegex);
    if (match) {
        totalYearsExp = parseInt(match[2], 10); // take the max experience of the range
        careerStage = 'Experienced';
    } else {
        const singleExp = textLower.match(/(\d+)\+?\s*years? of experience/i);
        if (singleExp) {
           totalYearsExp = parseInt(singleExp[1], 10);
           careerStage = 'Experienced';
        } else if (textLower.includes('fresher') || textLower.includes('intern')) {
           careerStage = 'Fresher';
        }
    }

    // Try to extract company name from title (e.g., "Job Title at Company Name")
    if (document.title.includes(' at ')) {
        company = document.title.split(' at ')[1].split('-')[0].split('|')[0].trim();
    } else if (document.title.includes('-')) {
        company = document.title.split('-')[1].trim();
    }

    // Extract emails and phone numbers from the entire page text
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const emails = [...new Set(document.body.innerText.match(emailRegex) || [])];
    const email = emails.length > 0 ? emails[0] : '';

    const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g;
    const phones = [...new Set(document.body.innerText.match(phoneRegex) || [])];
    const phone = phones.length > 0 ? phones[0].trim() : '';

    let notesArr = [];
    if (company) notesArr.push(`🏢 ${company}`);
    notesArr.push(`🔗 Discovered on: ${window.location.hostname.replace('www.', '')}`);
    const notes = notesArr.join(' | ');

    connectionsToDispatch.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      email: email,
      phone: phone,
      url: url,
      name: name,
      role: role,
      isBusiness: true,
      status: 'Lead',
      notes: notes,
      careerStage: careerStage || undefined,
      totalYearsExp: totalYearsExp > 0 ? totalYearsExp : undefined,
      timestamp: Date.now()
    });

  } else {
    // MULTI-PROFILE EXTRACTION (Generic Websites)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const text = document.body.innerText;
    const emails = [...new Set(text.match(emailRegex) || [])];
    
    const links = Array.from(document.querySelectorAll('a'));
    
    // 1. Process LinkedIn Links
    const liProfiles = links.filter(a => a.href.includes('linkedin.com/in/'));
    const uniqueLiProfiles = [];
    const seenUrls = new Set();
    
    liProfiles.forEach(a => {
       const url = a.href.split('?')[0]; // clean tracking params
       if (!seenUrls.has(url)) {
           seenUrls.add(url);
           let name = a.innerText.trim();
           // Fallback name logic if link text is just "LinkedIn"
           if (!name || name.toLowerCase() === 'linkedin') {
               name = url.split('/in/')[1].split('/')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
           }
           uniqueLiProfiles.push({ url, name });
       }
    });

    uniqueLiProfiles.forEach(profile => {
       connectionsToDispatch.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          email: '',
          phone: '',
          url: profile.url,
          name: profile.name,
          role: 'Profile found on website',
          isBusiness: false,
          status: 'Lead',
          notes: `🔗 Discovered on: ${window.location.href}`,
          timestamp: Date.now()
       });
    });

    // 2. Process Emails
    emails.forEach(email => {
       let assumedRole = 'Discovered Contact';
       if (email.toLowerCase().includes('support') || email.toLowerCase().includes('info') || email.toLowerCase().includes('contact')) {
           assumedRole = 'Business Contact';
       }
       connectionsToDispatch.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          email: email,
          phone: '',
          url: window.location.href,
          name: email.split('@')[0], // Use prefix as default name
          role: assumedRole,
          isBusiness: assumedRole === 'Business Contact',
          status: 'Lead',
          notes: `📧 Found email on: ${window.location.href}`,
          timestamp: Date.now()
       });
    });
    
    // 3. Process Generic Business if absolutely no profiles/emails found, but it's a maps/search page
    if (connectionsToDispatch.length === 0 && isBusiness) {
       let name = document.title.split('-')[0].split('|')[0].trim();
       connectionsToDispatch.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          email: '',
          phone: '',
          url: window.location.href,
          name: name,
          role: 'Business Page',
          isBusiness: true,
          status: 'Lead',
          notes: '',
          timestamp: Date.now()
       });
    }
  }

  // Dispatch all discovered connections
  connectionsToDispatch.forEach(connection => {
      // Prevent spamming background with identical payloads on scroll
      const payloadString = JSON.stringify({ name: connection.name, role: connection.role, url: connection.url, email: connection.email, totalYearsExp: connection.totalYearsExp });
      // We use a prefix key per connection so multiple connections don't overwrite the lastPayload
      const cacheKey = `_scLastPayload_${connection.url}_${connection.email}`;
      if (window[cacheKey] !== payloadString) {
          window[cacheKey] = payloadString;
          chrome.runtime.sendMessage({ type: 'NEW_CONNECTION', payload: connection });
      }
  });
}

// Run extraction 4 seconds after page load to allow dynamic content (React/SPA) to fully render
setTimeout(extractData, 4000);
// Run a secondary extraction at 20s to catch data lazy-loaded as the user scrolls
setTimeout(extractData, 20000);

// Watch for URL changes on Single Page Applications (like LinkedIn) without full page reloads
let lastUrl = window.location.href;
new MutationObserver(() => {
  const url = window.location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    window._scLastPayload = null; // reset payload cache on navigation
    setTimeout(extractData, 4000);
    setTimeout(extractData, 20000);
  }
}).observe(document, { subtree: true, childList: true });

// Listen to scroll to catch lazy-loaded sections (like Experience)
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(extractData, 1500);
});

// We can also allow the user to trigger it manually via a message from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'EXTRACT_NOW') {
    extractData();
  }
});
