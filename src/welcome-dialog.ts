/**
 * Welcome Dialog for Error Reporting
 * 
 * First-run dialog that explains error reporting and asks for user consent.
 * Provides clear information about privacy and data collection.
 */

import { ConsentManager, type PrivacyLevel } from './consent-manager.js';

interface WelcomeDialogData {
  title: string;
  includedItems: string[];
  excludedItems: string[];
  privacyNote: string;
  privacyLevels: {
    title: string;
    minimal: string;
    standard: string;
    detailed: string;
  };
  buttons: {
    enable: string;
    decline: string;
    learnMore: string;
  };
}

export class ErrorReporterWelcomeDialog extends Dialog {
  
  static override get defaultOptions(): FormApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.Title'),
      template: 'modules/errors-and-echoes/templates/welcome-dialog.hbs',
      width: 600,
      height: 'auto',
      classes: ['errors-and-echoes-welcome-dialog'],
      resizable: false,
      closeOnSubmit: false,
      id: 'errors-and-echoes-welcome'
    });
  }

  /**
   * Show the welcome dialog if it hasn't been shown before
   */
  static show(): ErrorReporterWelcomeDialog | null {
    if (!ConsentManager.shouldShowWelcome()) {
      return null;
    }

    const dialog = new this({}, {});
    dialog.render(true);
    return dialog;
  }

  constructor(data: any = {}, options: Partial<FormApplicationOptions> = {}) {
    super(data, options);
  }

  /**
   * Get data for the template
   */
  override getData(): WelcomeDialogData {
    return {
      title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.Title'),
      includedItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.IncludedItems.ErrorMessages'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.IncludedItems.FoundryVersion'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.IncludedItems.SystemInfo')
      ],
      excludedItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.WorldData'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.ChatMessages'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.PersonalInfo'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.ModuleSettings')
      ],
      privacyNote: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyNote'),
      privacyLevels: {
        title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Title'),
        minimal: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Minimal'),
        standard: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Standard'),
        detailed: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Detailed')
      },
      buttons: {
        enable: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.EnableButton'),
        decline: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.DeclineButton'),
        learnMore: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.LearnMoreButton')
      }
    };
  }

  /**
   * Activate event listeners
   */
  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
    
    html.find('[data-action="enable"]').click(async () => {
      await this.handleEnableReporting();
    });

    html.find('[data-action="decline"]').click(async () => {
      await this.handleDeclineReporting();
    });

    html.find('[data-action="learn-more"]').click(async () => {
      await this.handleLearnMore();
    });

    // Privacy level selection
    html.find('input[name="privacy-level"]').change((event) => {
      const target = event.target as HTMLInputElement;
      const level = $(target).val() as PrivacyLevel;
      this.updatePrivacyPreview(html, level);
    });
  }

  /**
   * Handle enabling error reporting
   */
  private async handleEnableReporting(): Promise<void> {
    try {
      const privacyLevel = this.getSelectedPrivacyLevel();
      await ConsentManager.setConsent(true, privacyLevel);
      this.close();
      
      ui.notifications.info(game.i18n.localize('ERRORS_AND_ECHOES.Notifications.Enabled'));
    } catch (error) {
      console.error('Failed to enable error reporting:', error);
      ui.notifications.error('Failed to enable error reporting');
    }
  }

  /**
   * Handle declining error reporting
   */
  private async handleDeclineReporting(): Promise<void> {
    try {
      await ConsentManager.setConsent(false);
      this.close();
    } catch (error) {
      console.error('Failed to decline error reporting:', error);
    }
  }

  /**
   * Handle learn more button - show privacy details dialog
   */
  private async handleLearnMore(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { PrivacyDetailsDialog } = await import('./privacy-details-dialog.js');
      new PrivacyDetailsDialog().render(true);
    } catch (error) {
      console.error('Failed to show privacy details:', error);
      ui.notifications.error('Failed to load privacy details');
    }
  }

  /**
   * Get the selected privacy level from the form
   */
  private getSelectedPrivacyLevel(): PrivacyLevel {
    const formElement = this.element?.find('form').get(0) as HTMLFormElement;
    if (!formElement) return 'standard';

    const formData = new FormDataExtended(formElement);
    const level = formData.object['privacy-level'] as PrivacyLevel;
    return level || 'standard';
  }

  /**
   * Update the privacy preview based on selected level
   */
  private updatePrivacyPreview(html: JQuery, level: PrivacyLevel): void {
    const previewElement = html.find('.privacy-preview');
    if (!previewElement.length) return;

    let previewText = '';
    
    switch (level) {
      case 'minimal':
        previewText = game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Minimal');
        break;
      case 'standard':
        previewText = game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Standard');
        break;
      case 'detailed':
        previewText = game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Detailed');
        break;
    }

    previewElement.text(previewText);
  }

  /**
   * Override close to mark welcome as shown
   */
  override async close(): Promise<void> {
    try {
      // Mark welcome as shown even if user just closes the dialog
      if (ConsentManager.shouldShowWelcome()) {
        await game.settings.set('errors-and-echoes', 'hasShownWelcome', true);
      }
    } catch (error) {
      console.warn('Failed to mark welcome as shown:', error);
    }
    
    return super.close();
  }

  /**
   * Static method to show privacy level selection
   */
  static async showPrivacyLevelDialog(): Promise<PrivacyLevel | null> {
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Title'),
        content: `
          <div class="privacy-level-selection">
            <p>${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Description')}</p>
            <div class="form-group">
              <label>
                <input type="radio" name="privacy" value="minimal"> 
                <strong>${game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.minimal')}</strong>
              </label>
              <p class="hint">${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Minimal')}</p>
            </div>
            <div class="form-group">
              <label>
                <input type="radio" name="privacy" value="standard" checked> 
                <strong>${game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.standard')}</strong>
              </label>
              <p class="hint">${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Standard')}</p>
            </div>
            <div class="form-group">
              <label>
                <input type="radio" name="privacy" value="detailed"> 
                <strong>${game.i18n.localize('ERRORS_AND_ECHOES.Settings.PrivacyLevel.Choices.detailed')}</strong>
              </label>
              <p class="hint">${game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Detailed')}</p>
            </div>
          </div>
        `,
        buttons: {
          save: {
            label: game.i18n.localize('Save'),
            callback: (html: JQuery) => {
              const level = html.find('input[name="privacy"]:checked').val() as PrivacyLevel;
              resolve(level || 'standard');
            }
          },
          cancel: { 
            label: game.i18n.localize('Cancel'),
            callback: () => resolve(null)
          }
        }
      }).render(true);
    });
  }
}