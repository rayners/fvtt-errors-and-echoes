/**
 * Welcome Dialog for First-Time Users
 * 
 * Displays a comprehensive consent dialog with privacy level selection.
 * Follows Phase 2 requirements from the implementation plan.
 */
export class ErrorReporterWelcomeDialog extends Dialog {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.Title'),
      template: 'modules/errors-and-echoes/templates/welcome-dialog.hbs',
      width: 600,
      height: 'auto',
      classes: ['errors-and-echoes-welcome'],
      resizable: false
    });
  }

  /**
   * Show the welcome dialog if needed
   */
  static async show() {
    const { ConsentManager } = await import('./consent-manager.js');
    
    if (ConsentManager.shouldShowWelcome()) {
      return new this().render(true);
    }
  }

  /**
   * Get data for the template
   */
  getData() {
    return {
      // Template will use localize helper for all text
    };
  }

  /**
   * Activate event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Enable error reporting button
    html.find('[data-action="enable"]').click(async (event) => {
      event.preventDefault();
      
      // Get selected privacy level
      const privacyLevel = html.find('input[name="privacy-level"]:checked').val() || 'standard';
      
      const { ConsentManager } = await import('./consent-manager.js');
      await ConsentManager.setConsent(true, privacyLevel);
      
      this.close();
    });

    // Decline button
    html.find('[data-action="decline"]').click(async (event) => {
      event.preventDefault();
      
      const { ConsentManager } = await import('./consent-manager.js');
      await ConsentManager.setConsent(false);
      
      this.close();
    });

    // Learn more button - show privacy details
    html.find('[data-action="learn-more"]').click(async (event) => {
      event.preventDefault();
      
      const { PrivacyDetailsDialog } = await import('./privacy-details-dialog.js');
      new PrivacyDetailsDialog().render(true);
    });

    // Update description when privacy level changes
    html.find('input[name="privacy-level"]').change((event) => {
      const level = event.target.value;
      this.updatePrivacyDescription(html, level);
    });
  }

  /**
   * Update the privacy description based on selected level
   */
  updatePrivacyDescription(html, level) {
    const descriptions = {
      'minimal': game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Minimal'),
      'standard': game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Standard'),
      'detailed': game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Detailed')
    };

    const description = descriptions[level] || descriptions['standard'];
    
    // Update any description area if it exists
    const descArea = html.find('.privacy-description');
    if (descArea.length) {
      descArea.text(description);
    }
  }

  /**
   * Handle form submission
   */
  async _updateObject(event, formData) {
    // This is called when dialog is submitted via buttons
    // Individual button handlers take care of the logic
  }
}