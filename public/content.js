// Smart Connector Content Script
console.log("Smart Connector Content Script loaded.");

function extractData() {
  const url = window.location.href;
  const isLinkedInProfile = url.includes('linkedin.com/in/');
  const isLinkedInCompany = url.includes('linkedin.com/company/');
  const isBusiness = isLinkedInCompany || url.includes('google.com/maps/') || url.includes('google.com/search');

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
    
    const expMatch = textLower.match(/(\d+)\+?\s*years? of experience/);
    if (expMatch && expMatch[1]) {
      careerStage = 'Experienced';
      totalYearsExp = parseInt(expMatch[1], 10);
    } else {
      const durationMatches = textLower.match(/(\d+)\s*yrs?(?:\s*\d+\s*mos?)?|(\d+)\s*mos?/g);
      if (durationMatches && durationMatches.length > 0) {
         let totalMonths = 0;
         durationMatches.forEach(m => {
            const yrMatch = m.match(/(\d+)\s*yr/);
            const moMatch = m.match(/(\d+)\s*mo/);
            if (yrMatch && yrMatch[1]) totalMonths += parseInt(yrMatch[1], 10) * 12;
            if (moMatch && moMatch[1]) totalMonths += parseInt(moMatch[1], 10);
         });
         if (totalMonths > 0) {
            careerStage = 'Experienced';
            totalYearsExp = Math.min(Math.ceil(totalMonths / 12), 40); 
         }
      } else if (textLower.includes('student at') || textLower.includes('university ') || role.toLowerCase().includes('student')) {
         careerStage = 'Student';
      } else if (role.toLowerCase().includes('intern') || role.toLowerCase().includes('fresher')) {
         careerStage = 'Fresher';
      }
    }

    connectionsToDispatch.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      email: '', // We could extract emails here if wanted
      phone: '',
      url: window.location.href,
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

// Watch for URL changes on Single Page Applications (like LinkedIn) without full page reloads
let lastUrl = window.location.href;
new MutationObserver(() => {
  const url = window.location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    window._scLastPayload = null; // reset payload cache on navigation
    setTimeout(extractData, 4000);
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
