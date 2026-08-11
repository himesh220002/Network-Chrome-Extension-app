// Smart Connector Background Script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_CONNECTION') {
    const newConnection = message.payload;
    
    chrome.storage.local.get(['connections'], (result) => {
      const connections = result.connections || [];
      
      const existsIndex = connections.findIndex(c => 
        (c.email && c.email === newConnection.email) || 
        (c.url === newConnection.url)
      );

      if (existsIndex === -1) {
        connections.unshift(newConnection);
        chrome.storage.local.set({ connections });
        
        // Notify user via badge
        chrome.action.setBadgeText({ text: '1' });
        chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' }); // indigo-600
      } else {
        // Smart Profile Merging
        const existing = connections[existsIndex];
        let updated = false;

        // Fill missing direct fields
        if (!existing.name && newConnection.name) { existing.name = newConnection.name; updated = true; }
        if (!existing.email && newConnection.email) { existing.email = newConnection.email; updated = true; }
        if (!existing.phone && newConnection.phone) { existing.phone = newConnection.phone; updated = true; }
        if (!existing.role && newConnection.role) { existing.role = newConnection.role; updated = true; }
        if (!existing.careerStage && newConnection.careerStage) { existing.careerStage = newConnection.careerStage; updated = true; }
        if (!existing.totalYearsExp && newConnection.totalYearsExp) { existing.totalYearsExp = newConnection.totalYearsExp; updated = true; }
        if (newConnection.fullProfileContext && (!existing.fullProfileContext || existing.fullProfileContext.length < newConnection.fullProfileContext.length)) {
            existing.fullProfileContext = newConnection.fullProfileContext;
            updated = true;
        }
        
        // Add secondary URLs as notes if they differ
        if (newConnection.url && existing.url !== newConnection.url) {
          const urlNote = `🔗 ${newConnection.url}`;
          if (!existing.notes || !existing.notes.includes(urlNote)) {
            existing.notes = existing.notes ? `${existing.notes} | ${urlNote}` : urlNote;
            updated = true;
          }
        }

        // Merge distinct notes (skills, company, etc.)
        if (newConnection.notes) {
          const newNotesParts = newConnection.notes.split(' | ');
          for (const part of newNotesParts) {
            if (!existing.notes || !existing.notes.includes(part)) {
              existing.notes = existing.notes ? `${existing.notes} | ${part}` : part;
              updated = true;
            }
          }
        }

        if (updated) {
          existing.timestamp = Date.now(); // bump timestamp to surface recently updated profiles
          connections[existsIndex] = existing;
          chrome.storage.local.set({ connections });
          
          chrome.action.setBadgeText({ text: '+' });
          chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // emerald-500
        }
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'POPUP_OPENED') {
    chrome.action.setBadgeText({ text: '' });
  }
});
