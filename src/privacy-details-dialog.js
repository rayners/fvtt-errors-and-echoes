/**
 * Privacy Details Dialog
 * 
 * Shows comprehensive privacy information and example payloads.
 * Allows users to make informed decisions about error reporting.
 */
export class PrivacyDetailsDialog extends Dialog {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.Title'),
      template: 'modules/errors-and-echoes/templates/privacy-details.hbs',
      width: 800,
      height: 600,
      classes: ['errors-and-echoes-privacy'],
      resizable: true
    });
  }

  /**
   * Get data for the template
   */
  getData() {
    // Generate example payload to show users exactly what gets sent
    const examplePayload = this.generateExamplePayload();
    
    return {
      examplePayload: JSON.stringify(examplePayload, null, 2)
    };
  }

  /**
   * Generate an example payload based on current privacy level
   */
  generateExamplePayload() {
    const { ConsentManager } = window.ErrorsAndEchoes || {};
    const privacyLevel = ConsentManager?.getPrivacyLevel() || 'standard';
    
    const basePayload = {
      error: {
        message: "Cannot read property 'value' of undefined",
        stack: "TypeError: Cannot read property 'value' of undefined\n    at PartyActor.calculateMovement (modules/journeys-and-jamborees/dist/party-actor.js:123:45)",
        type: "TypeError",
        source: "javascript"
      },
      attribution: {
        moduleId: "journeys-and-jamborees",
        confidence: "high",
        method: "stack-trace"
      },
      foundry: {
        version: game?.version || "12.331"
      },
      meta: {
        timestamp: new Date().toISOString(),
        privacyLevel: privacyLevel,
        reporterVersion: game?.modules?.get('errors-and-echoes')?.version || "0.1.0",
        sessionId: "anon-abc123def456"
      }
    };

    // Add more context based on privacy level
    if (privacyLevel === 'standard' || privacyLevel === 'detailed') {
      basePayload.foundry.system = {
        id: game?.system?.id || "dragonbane",
        version: game?.system?.version || "1.0.0"
      };

      basePayload.foundry.modules = [
        { id: "journeys-and-jamborees", version: "1.2.3", title: "Journeys & Jamborees" },
        { id: "errors-and-echoes", version: "0.1.0", title: "Errors and Echoes" }
      ];

      basePayload.client = {
        sessionId: "anon-abc123def456"
      };
    }

    if (privacyLevel === 'detailed') {
      basePayload.client.browser = "Chrome/120";
      
      if (canvas?.scene) {
        basePayload.foundry.scene = {
          name: "Example Scene",
          active: true
        };
      }

      basePayload.context = {
        filename: "modules/journeys-and-jamborees/dist/party-actor.js",
        line: 123,
        column: 45
      };
    }

    return basePayload;
  }

  /**
   * Activate event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Enable reporting button
    html.find('[data-action="enable-reporting"]').click(async (event) => {
      event.preventDefault();
      
      const { ConsentManager } = await import('./consent-manager.js');
      await ConsentManager.setConsent(true, 'standard');
      
      this.close();
    });

    // Change privacy level button
    html.find('[data-action="change-privacy"]').click((event) => {
      event.preventDefault();
      this.showPrivacyLevelDialog();
    });

    // Close button
    html.find('[data-action="close"]').click((event) => {
      event.preventDefault();
      this.close();
    });
  }

  /**
   * Show privacy level selection dialog
   */
  showPrivacyLevelDialog() {
    const { ConsentManager } = window.ErrorsAndEchoes || {};
    const currentLevel = ConsentManager?.getPrivacyLevel() || 'standard';

    new Dialog({
      title: game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.Buttons.ChangePrivacyLevel'),
      content: `
        <p>Select how much information to include in error reports:</p>
        <div class="form-group">
          <label>
            <input type="radio" name="privacy" value="minimal" ${currentLevel === 'minimal' ? 'checked' : ''}> 
            <strong>Minimal</strong> - ${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Minimal')}
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="radio" name="privacy" value="standard" ${currentLevel === 'standard' ? 'checked' : ''}> 
            <strong>Standard</strong> - ${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Standard')}
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="radio" name="privacy" value="detailed" ${currentLevel === 'detailed' ? 'checked' : ''}> 
            <strong>Detailed</strong> - ${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Detailed')}
          </label>
        </div>
      `,
      buttons: {
        save: {
          label: 'Save',
          callback: async (html) => {
            const level = html.find('input[name="privacy"]:checked').val();
            
            try {
              await game.settings.set('errors-and-echoes', 'privacyLevel', level);
              ui.notifications.info(`Privacy level changed to: ${level}`);
              
              // Refresh this dialog to show new example
              this.render(true);
            } catch (error) {
              console.error('Failed to update privacy level:', error);
              ui.notifications.error('Failed to update privacy level');
            }
          }
        },
        cancel: { 
          label: 'Cancel' 
        }
      }
    }).render(true);
  }
}