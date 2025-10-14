// Initialize default settings in the database
const { db } = require('./server/database');
const { getInitialSettings } = require('./services/mockDataService');

const initializeDefaultSettings = () => {
  try {
    console.log('Initializing default settings...');
    
    const defaultSettings = getInitialSettings();
    const settingsData = JSON.stringify(defaultSettings);
    
    // Check if settings already exist
    const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();
    
    if (!existing) {
      db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)').run(settingsData);
      console.log('✅ Default settings inserted successfully');
    } else {
      console.log('ℹ️ Settings already exist, skipping initialization');
    }
    
    // Test read back
    const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
    if (row) {
      const settings = JSON.parse(row.data);
      console.log('✅ Settings verified:', Object.keys(settings));
    }
    
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
  }
};

initializeDefaultSettings();