// Smart Connector Content Script
console.log("Smart Connector Content Script loaded.");

function calculateMergedExperienceMonths(searchAreaText) {
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    // Matches "Jan 2010 - Present", "Feb 2012 – Mar 2015", "Jan 2020 to Dec 2021", etc.
    const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\s*(?:-|to|–)\s*(present|current|now|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4}))\b/gi;
    
    let match;
    let intervals = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    while ((match = dateRegex.exec(searchAreaText)) !== null) {
        const startMonthStr = match[1].toLowerCase();
        const startYear = parseInt(match[2], 10);
        const startMonth = monthMap[startMonthStr];
        const startAbsolute = startYear * 12 + startMonth;

        let endAbsolute;
        if (match[3].toLowerCase() === 'present' || match[3].toLowerCase() === 'current' || match[3].toLowerCase() === 'now') {
            endAbsolute = currentYear * 12 + currentMonth;
        } else {
            const endMonthStr = match[4].toLowerCase();
            const endYear = parseInt(match[5], 10);
            const endMonth = monthMap[endMonthStr];
            endAbsolute = endYear * 12 + endMonth;
        }

        // Sanity check for valid ranges
        if (startAbsolute <= endAbsolute && startAbsolute > 1970 * 12 && endAbsolute <= (currentYear + 1) * 12) {
            intervals.push([startAbsolute, endAbsolute]);
        }
    }

    if (intervals.length === 0) return 0;

    // Sort intervals by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Merge overlapping intervals
    let merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        let current = intervals[i];
        let lastMerged = merged[merged.length - 1];

        if (current[0] <= lastMerged[1]) {
            // Overlap: update end time if current extends beyond
            lastMerged[1] = Math.max(lastMerged[1], current[1]);
        } else {
            // No overlap: push distinct interval
            merged.push(current);
        }
    }

    // Sum lengths of merged, non-overlapping blocks
    let totalMonths = 0;
    merged.forEach(interval => {
        totalMonths += (interval[1] - interval[0] + 1); // Inclusive months (e.g., Jan to Jan = 1 month)
    });

    return totalMonths;
}

function extractData() {
  let url = window.location.href;
  const isLinkedInProfile = url.includes('linkedin.com/in/');
  const isLinkedInCompany = url.includes('linkedin.com/company/');
  const isBusiness = isLinkedInCompany || url.includes('google.com/maps/') || url.includes('google.com/search');
  
  const isNaukri = url.includes('naukri.com/job-listings');
  const isFoundit = url.includes('foundit.in') || url.includes('foundit.tech');
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

    const headlineNode = document.querySelector('.text-body-medium.break-words, h2.mt1, .ph5.pb5 h2');
    if (headlineNode) {
        role = (headlineNode.innerText || '').trim();
    } else {
        // Ultimate fallback: LinkedIn always puts the headline in the page title (Name - Headline - Company | LinkedIn)
        const titleParts = document.title.split('-');
        if (titleParts.length > 1) {
            role = titleParts[1].split('|')[0].trim();
        }
    }

    // Robust fallback for Company and Role (especially on /details/experience sub-pages)
    if (!role || url.includes('/details/experience')) {
        const mainContent = document.querySelector('main') || document.body;
        const lines = (mainContent.innerText || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let startIndex = 0;
        const expHeaderIndex = lines.findIndex(l => l.toLowerCase() === 'experience');
        if (expHeaderIndex !== -1) startIndex = expHeaderIndex + 1;
        
        while (startIndex < lines.length && (lines[startIndex].toLowerCase().includes('linkedin') || lines[startIndex].length < 3)) {
            startIndex++;
        }
        
        if (startIndex < lines.length) {
            const potentialRole = lines[startIndex];
            if (potentialRole && !potentialRole.match(/\d{4}/)) {
                role = role || potentialRole;
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

    const allSpans = Array.from(document.querySelectorAll('span, h2, h3'));
    const topSkillsSpan = allSpans.find(s => (s.innerText || '').trim().toLowerCase() === 'top skills');
    
    if (topSkillsSpan) {
       let curr = topSkillsSpan.parentElement;
       let depth = 0;
       while (curr && depth < 10) {
           const textContent = curr.innerText || '';
           if (textContent.includes('•') || textContent.includes('·')) {
               const lines = textContent.split('\n');
               const skillsLine = lines.find(l => l.includes('•') || l.includes('·'));
               if (skillsLine) {
                   topSkills = skillsLine.replace(/^[•·]\s*/, '').trim();
                   break;
               }
           }
           curr = curr.parentElement;
           depth++;
       }
    }
    
    if (!topSkills) {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const bulletDiv = allDivs.find(d => d.innerText && (d.innerText.includes('•') || d.innerText.includes('·')) && d.innerText.length > 20 && d.innerText.length < 200 && d.children.length === 0);
      if (bulletDiv) topSkills = bulletDiv.innerText.replace(/^[•·]\s*/, '').trim();
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
    let expSectionContext;
    try {
        const aboutSection = Array.from(document.querySelectorAll('section')).find(s => (s.innerText || '').toLowerCase().includes('about') && (s.innerText || '').length > 50);
        if (aboutSection) fullProfileContext += aboutSection.innerText + '\n\n';
        
        expSectionContext = Array.from(document.querySelectorAll('section')).find(s => (s.innerText || '').toLowerCase().includes('experience'));
        if (expSectionContext) fullProfileContext += expSectionContext.innerText;
    } catch (e) { console.error('Error extracting context', e); }
    
    // 1. Primary Method: Interval Merging Algorithm for Flawless Timeline Parsing
    const searchAreaText = expSectionContext ? expSectionContext.innerText : document.body.innerText;
    let finalMonths = calculateMergedExperienceMonths(searchAreaText);
    
    // 2. Fallback Method: Cumulative Match ("Over 2.5 years of experience")
    if (finalMonths === 0) {
        const expMatch = textLower.match(/(\d+(?:\.\d+)?)\+?\s*y(?:ea)?r?s?(?: of)? experience/);
        if (expMatch && expMatch[1]) {
            finalMonths = parseFloat(expMatch[1]) * 12;
        }
    }
    
    // 3. Last Resort Fallback Method: Raw Regex Summation (Susceptible to double-counting)
    if (finalMonths === 0) {
        if (textLower.match(/\bdecade\b/)) finalMonths += 120;
        
        const decimalMatches = textLower.match(/(\d+\.\d+)\s*y(?:ea)?r?s?/g);
        if (decimalMatches) {
            decimalMatches.forEach(m => {
                const val = parseFloat(m);
                if (!isNaN(val)) finalMonths += Math.round(val * 12);
            });
        }
        
        const durationMatches = textLower.match(/(\d+)\s*y(?:ea)?r?s?(?:\s*(\d+)\s*m(?:o|onth)?s?)?|(\d+)\s*m(?:o|onth)?s?/g);
        if (durationMatches && durationMatches.length > 0) {
            durationMatches.forEach(m => {
                const yrMatch = m.match(/(\d+)\s*y(?:ea)?r?s?/);
                const moMatch = m.match(/(\d+)\s*m(?:o|onth)?s?/);
                if (yrMatch && yrMatch[1]) finalMonths += parseInt(yrMatch[1], 10) * 12;
                if (moMatch && moMatch[1]) finalMonths += parseInt(moMatch[1], 10);
            });
        }
    }

    if (finalMonths > 0) {
        careerStage = 'Experienced';
        totalYearsExp = Math.round((finalMonths / 12) * 10) / 10;
    } else if (textLower.includes('student at') || textLower.includes('university ') || role.toLowerCase().includes('student')) {
         careerStage = 'Student';
    } else if (role.toLowerCase().includes('intern') || role.toLowerCase().includes('fresher')) {
         careerStage = 'Fresher';
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

// Advanced Dynamic Observation Engine

let extractTimeout;
function debouncedExtract(delay = 1500) {
    clearTimeout(extractTimeout);
    extractTimeout = setTimeout(extractData, delay);
}

// 1. Intersection Observer: Triggers when lazy-loaded sections enter viewport
const sectionObserver = new IntersectionObserver((entries) => {
    let shouldExtract = false;
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const text = (entry.target.innerText || '').toLowerCase();
            if (text.includes('experience') || text.includes('about')) {
                shouldExtract = true;
            }
        }
    });
    if (shouldExtract) {
        debouncedExtract(1000); // Give it a moment to fully render text
    }
}, { threshold: 0.1 });

// Observe existing sections on initial load
document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

// 2. DOM Mutation Observer: Triggers when React/SPA injects new sections
new MutationObserver((mutations) => {
    let newSections = false;
    mutations.forEach(m => {
        m.addedNodes.forEach(node => {
            if (node.nodeName === 'SECTION') {
                sectionObserver.observe(node);
                newSections = true;
            } else if (node.querySelectorAll) {
                const sections = node.querySelectorAll('section');
                if (sections.length > 0) {
                    sections.forEach(s => sectionObserver.observe(s));
                    newSections = true;
                }
            }
        });
    });
    if (newSections) {
        debouncedExtract(1500); 
    }
}).observe(document.body, { subtree: true, childList: true });

// 3. SPA Navigation Observer: Handles URL changes without full page reload
let lastUrl = window.location.href;
new MutationObserver(() => {
  const url = window.location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Clear all payload caches so it forces a re-send on navigation
    for (let key in window) {
       if (key.startsWith('_scLastPayload')) window[key] = null;
    }
    debouncedExtract(2000); // Wait for initial render
  }
}).observe(document, { subtree: true, childList: true });

// Initial run
setTimeout(extractData, 3000);

// We can also allow the user to trigger it manually via a message from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'EXTRACT_NOW') {
    extractData();
  }
});

// 4. Contact Modal Hook (Listens for clicks on contact info and scrapes modal)
document.addEventListener('click', (e) => {
    let target = e.target;
    let clickedContactInfo = false;
    
    // Check clicked element and its parents (in case they clicked an icon inside the link)
    while (target && target !== document.body) {
        const text = (target.innerText || '').toLowerCase();
        if (text.includes('contact info') || (target.tagName === 'A' && (target.href || '').includes('contact-info'))) {
            clickedContactInfo = true;
            break;
        }
        target = target.parentElement;
    }
    
    if (clickedContactInfo) {
        setTimeout(() => {
            const modal = document.querySelector('.artdeco-modal, [role="dialog"]') || document.body;
            const modalText = (modal.innerText || '');
            
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
            const emails = [...new Set(modalText.match(emailRegex) || [])];
            
            const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g;
            const phones = [...new Set(modalText.match(phoneRegex) || [])];
            
            if (emails.length > 0 || phones.length > 0) {
                let url = window.location.href;
                const match = url.match(/(https:\/\/(www\.)?linkedin\.com\/in\/[^\/?#]+)/i);
                if (match) url = match[1]; // normalize URL
                
                chrome.runtime.sendMessage({ 
                    type: 'NEW_CONNECTION', 
                    payload: { 
                        url: url, 
                        email: emails.length > 0 ? emails[0] : undefined, 
                        phone: phones.length > 0 ? phones[0].trim() : undefined,
                        timestamp: Date.now()
                    } 
                });
            }
        }, 1500); // Wait for modal to render
    }
});
