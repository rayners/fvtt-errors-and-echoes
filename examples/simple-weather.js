/**
 * Integration Example: Simple Weather
 * 
 * This example shows how to integrate the Errors and Echoes Registration API
 * with the Simple Weather module for enhanced error reporting.
 */

// Wait for both modules to be ready
Hooks.once('ready', () => {
  // Check if Errors and Echoes is available
  if (!window.ErrorsAndEchoesAPI) {
    console.warn('Simple Weather: Errors and Echoes API not available');
    return;
  }

  try {
    // Register with enhanced error reporting
    window.ErrorsAndEchoesAPI.register({
      moduleId: 'foundry-simple-weather',
      
      // Context provider - adds weather and scene information
      contextProvider: () => {
        const context = {};
        
        // Add current weather information
        if (game.modules.get('foundry-simple-weather')?.active) {
          try {
            // Check if Simple Weather API is available
            if (window.SimpleWeather) {
              const currentWeather = window.SimpleWeather.getCurrentWeather();
              if (currentWeather) {
                context.currentWeather = {
                  type: currentWeather.type || 'unknown',
                  intensity: currentWeather.intensity || 'normal',
                  temperature: currentWeather.temperature || null,
                  hasEffects: currentWeather.effects?.length > 0 || false
                };
              }
              
              // Add weather generation settings
              context.weatherGeneration = {
                autoGenerate: window.SimpleWeather.getSettings?.().autoGenerate || false,
                climateType: window.SimpleWeather.getSettings?.().climate || 'temperate',
                seasonalEffects: window.SimpleWeather.getSettings?.().useSeasons || false
              };
            }
            
            // Add scene-specific weather data
            if (game.scenes?.active) {
              const scene = game.scenes.active;
              const sceneWeather = scene.getFlag('foundry-simple-weather', 'weather');
              if (sceneWeather) {
                context.sceneWeatherOverride = true;
                context.sceneWeatherType = sceneWeather.type;
              }
            }
            
          } catch (e) {
            context.weatherAPIError = e.message;
          }
        }
        
        // Add calendar integration status (for weather generation)
        const calendarModules = [
          'foundryvtt-simple-calendar',
          'about-time',
          'smalltime'
        ];
        
        context.calendarIntegration = {
          available: calendarModules.some(id => game.modules.get(id)?.active),
          activeCalendar: calendarModules.find(id => game.modules.get(id)?.active) || 'none'
        };
        
        // Add system information
        context.gameSystem = game.system.id;
        context.foundryVersion = game.version;
        
        return context;
      },
      
      // Error filter - focus on weather-related errors
      errorFilter: (error) => {
        const stack = error.stack || '';
        const message = error.message || '';
        
        // Always report errors directly from Simple Weather
        if (stack.includes('foundry-simple-weather') || 
            stack.includes('simple-weather') ||
            message.includes('weather') ||
            message.includes('SimpleWeather')) {
          return false; // Don't filter (report this error)
        }
        
        // Report errors related to weather effects or canvas layers
        if (message.includes('WeatherEffects') ||
            message.includes('weather-effect') ||
            stack.includes('WeatherLayer') ||
            stack.includes('SpecialEffectsLayer')) {
          return false; // Don't filter
        }
        
        // Report calendar integration errors that might affect weather
        if ((message.includes('calendar') || message.includes('time')) &&
            (stack.includes('foundry-simple-weather') || 
             message.includes('weather'))) {
          return false; // Don't filter
        }
        
        // Filter out errors from other audio/visual modules unless they mention weather
        const avModules = [
          'dice-so-nice', 'animated-spell-effects', 'jb2a',
          'token-magic-fx', 'sequencer'
        ];
        
        for (const module of avModules) {
          if (stack.includes(module) && !message.includes('weather')) {
            return true; // Filter out
          }
        }
        
        // Default: filter out unless clearly related
        return !message.toLowerCase().includes('weather');
      }
    });
    
    console.log('Simple Weather: Successfully registered with Errors and Echoes');
    
  } catch (error) {
    console.error('Simple Weather: Failed to register with Errors and Echoes:', error);
  }
});

// Example: Manual error reporting for weather-specific scenarios
window.SimpleWeatherErrorReporting = {
  /**
   * Report a weather generation error
   */
  reportWeatherGenError: (error, climate, season) => {
    if (window.ErrorsAndEchoesAPI?.reportError) {
      window.ErrorsAndEchoesAPI.reportError(error, {
        category: 'weather-generation',
        climate: climate,
        season: season,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Report a weather effect rendering error
   */
  reportEffectError: (error, weatherType, effectName) => {
    if (window.ErrorsAndEchoesAPI?.reportError) {
      window.ErrorsAndEchoesAPI.reportError(error, {
        category: 'weather-effects',
        weatherType: weatherType,
        effectName: effectName,
        canvasSize: {
          width: canvas.dimensions.width,
          height: canvas.dimensions.height
        },
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Report a calendar integration error
   */
  reportCalendarError: (error, calendarModule, operation) => {
    if (window.ErrorsAndEchoesAPI?.reportError) {
      window.ErrorsAndEchoesAPI.reportError(error, {
        category: 'calendar-integration',
        calendarModule: calendarModule,
        operation: operation,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Example: Hook into weather events for automatic error reporting
Hooks.on('simpleWeatherChange', (weatherData) => {
  console.log('Simple Weather: Weather changed, enhanced error reporting active for effects');
});

Hooks.on('canvasReady', () => {
  // Weather effects are often initialized when canvas is ready
  console.log('Simple Weather: Canvas ready, monitoring for weather effect errors');
});