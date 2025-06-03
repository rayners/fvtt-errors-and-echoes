/**
 * Integration Example: Journeys and Jamborees
 * 
 * This example shows how to integrate the Errors and Echoes Registration API
 * with the Journeys and Jamborees module for enhanced error reporting.
 */

// Wait for the Errors and Echoes module to be ready
Hooks.once('ready', () => {
  // Check if Errors and Echoes is available
  if (!window.ErrorsAndEchoesAPI) {
    console.warn('Journeys and Jamborees: Errors and Echoes API not available');
    return;
  }

  try {
    // Register with enhanced error reporting
    window.ErrorsAndEchoesAPI.register({
      moduleId: 'journeys-and-jamborees',
      
      // Context provider - adds useful debugging information
      contextProvider: () => {
        const context = {};
        
        // Add party information if available
        if (game.actors) {
          const partyActors = game.actors.filter(a => a.type === 'party');
          context.partyCount = partyActors.length;
          
          if (partyActors.length > 0) {
            const activeParty = partyActors.find(p => p.getFlag('journeys-and-jamborees', 'isActive'));
            if (activeParty) {
              context.activePartyId = activeParty.id;
              context.activePartyName = activeParty.name;
              context.partyMemberCount = activeParty.system?.members?.length || 0;
            }
          }
        }
        
        // Add current scene travel information
        if (game.scenes?.active) {
          const scene = game.scenes.active;
          const travelData = scene.getFlag('journeys-and-jamborees', 'travel');
          if (travelData) {
            context.sceneHasTravelData = true;
            context.travelMode = travelData.mode;
            context.currentBiome = travelData.biome;
          }
        }
        
        // Add system information
        context.gameSystem = game.system.id;
        context.systemVersion = game.system.version;
        
        // Add key module settings that might affect behavior
        try {
          context.autoGatherFood = game.settings.get('journeys-and-jamborees', 'autoGatherFood') || false;
          context.partyHudEnabled = game.settings.get('journeys-and-jamborees', 'showPartyHud') || false;
        } catch (e) {
          // Settings might not be registered yet
          context.settingsError = 'Could not read module settings';
        }
        
        return context;
      },
      
      // Error filter - only report errors that are likely J&J related
      errorFilter: (error) => {
        const stack = error.stack || '';
        const message = error.message || '';
        
        // Report errors that mention our module
        if (stack.includes('journeys-and-jamborees') || 
            message.includes('journeys-and-jamborees') ||
            message.includes('J&J') ||
            message.includes('party') && (stack.includes('PartyActor') || stack.includes('PartySheet'))) {
          return false; // Don't filter (report this error)
        }
        
        // Filter out errors that are clearly from other modules
        const otherModules = [
          'simple-calendar', 'foundryvtt-simple-calendar', 'smalltime',
          'dice-so-nice', 'lib-wrapper', 'socketlib'
        ];
        
        for (const module of otherModules) {
          if (stack.includes(module) && !stack.includes('journeys-and-jamborees')) {
            return true; // Filter out (don't report)
          }
        }
        
        // Report core Foundry errors that might affect our module
        if (stack.includes('foundry.js') || stack.includes('ClientDatabaseBackend')) {
          return false; // Don't filter (these might affect us)
        }
        
        // Filter out most other errors unless they seem related
        return true;
      },
      
      // Optional: Custom endpoint (remove this to use default endpoints)
      endpoint: {
        name: 'J&J Development Reports',
        url: 'https://errors.rayners.dev/report/journeys-and-jamborees',
        author: 'rayners',
        modules: ['journeys-and-jamborees'],
        enabled: true
      }
    });
    
    console.log('Journeys and Jamborees: Successfully registered with Errors and Echoes');
    
  } catch (error) {
    console.error('Journeys and Jamborees: Failed to register with Errors and Echoes:', error);
  }
});

// Example: Manual error reporting for specific scenarios
window.JandJErrorReporting = {
  /**
   * Report a travel calculation error with context
   */
  reportTravelError: (error, partyId, destination) => {
    if (window.ErrorsAndEchoesAPI?.reportError) {
      window.ErrorsAndEchoesAPI.reportError(error, {
        category: 'travel-calculation',
        partyId: partyId,
        destination: destination,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Report a party management error
   */
  reportPartyError: (error, partyData) => {
    if (window.ErrorsAndEchoesAPI?.reportError) {
      window.ErrorsAndEchoesAPI.reportError(error, {
        category: 'party-management',
        partySize: partyData?.members?.length || 0,
        partyType: partyData?.type || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Example: Hook into J&J specific events for automatic error reporting
Hooks.on('jj.partyCreated', (party) => {
  console.log('Journeys and Jamborees: Party created, enhanced error reporting active');
});

Hooks.on('jj.travelStarted', (travelData) => {
  console.log('Journeys and Jamborees: Travel started, monitoring for travel-related errors');
});