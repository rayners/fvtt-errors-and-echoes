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

export class ErrorReporterWelcomeDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: 'errors-and-echoes-welcome',
    classes: ['errors-and-echoes', 'welcome-dialog'],
    tag: 'div',
    window: {
      frame: true,
      positioned: true,
      title: 'ERRORS_AND_ECHOES.Welcome.Title',
      resizable: false,
    },
    position: {
      width: 600,
      height: 'auto',
    },
    actions: {
      enable: ErrorReporterWelcomeDialog.prototype._onEnable,
      decline: ErrorReporterWelcomeDialog.prototype._onDecline,
      learnMore: ErrorReporterWelcomeDialog.prototype._onLearnMore,
      selectPrivacyLevel: ErrorReporterWelcomeDialog.prototype._onSelectPrivacyLevel,
    },
  };

  static PARTS = {
    main: {
      id: 'main',
      template: 'modules/errors-and-echoes/templates/welcome-dialog.hbs',
    },
  };

  /**
   * Show the welcome dialog if it hasn't been shown before
   */
  static show(): ErrorReporterWelcomeDialog | null {
    if (!ConsentManager.shouldShowWelcome()) {
      return null;
    }

    const dialog = new this();
    dialog.render(true);
    return dialog;
  }

  /**
   * Prepare context data for the template
   */
  async _prepareContext(options = {}): Promise<WelcomeDialogData> {
    const context = await super._prepareContext(options);

    return Object.assign(context, {
      title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.Title'),
      includedItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.IncludedItems.ErrorMessages'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.IncludedItems.FoundryVersion'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.IncludedItems.SystemInfo'),
      ],
      excludedItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.WorldData'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.ChatMessages'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.PersonalInfo'),
        game.i18n.localize('ERRORS_AND_ECHOES.Welcome.ExcludedItems.ModuleSettings'),
      ],
      privacyNote: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyNote'),
      privacyLevels: {
        title: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Title'),
        minimal: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Minimal'),
        standard: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Standard'),
        detailed: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.PrivacyLevels.Detailed'),
      },
      buttons: {
        enable: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.EnableButton'),
        decline: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.DeclineButton'),
        learnMore: game.i18n.localize('ERRORS_AND_ECHOES.Welcome.LearnMoreButton'),
      },
    });
  }

  /**
   * Handle enabling error reporting
   */
  async _onEnable(event: Event, target: HTMLElement): Promise<void> {
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
  async _onDecline(event: Event, target: HTMLElement): Promise<void> {
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
  async _onLearnMore(event: Event, target: HTMLElement): Promise<void> {
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
   * Handle privacy level selection
   */
  async _onSelectPrivacyLevel(event: Event, target: HTMLElement): Promise<void> {
    const input = target as HTMLInputElement;
    const level = input.value as PrivacyLevel;
    this.updatePrivacyPreview(level);
  }

  /**
   * Get the selected privacy level from the form
   */
  private getSelectedPrivacyLevel(): PrivacyLevel {
    const formElement = this.element?.querySelector('form') as HTMLFormElement;
    if (!formElement) return 'standard';

    const formData = new FormDataExtended(formElement);
    const level = formData.object['privacy-level'] as PrivacyLevel;
    return level || 'standard';
  }

  /**
   * Update the privacy preview based on selected level
   */
  private updatePrivacyPreview(level: PrivacyLevel): void {
    const previewElement = this.element?.querySelector('.privacy-preview');
    if (!previewElement) return;

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

    previewElement.textContent = previewText;
  }

  /**
   * Override close to mark welcome as shown
   */
  override async close(options: any = {}): Promise<this> {
    try {
      // Mark welcome as shown even if user just closes the dialog
      if (ConsentManager.shouldShowWelcome()) {
        await game.settings.set('errors-and-echoes', 'hasShownWelcome', true);
      }
    } catch (error) {
      console.warn('Failed to mark welcome as shown:', error);
    }

    return super.close(options);
  }

  /**
   * Static method to show privacy level selection
   */
  static async showPrivacyLevelDialog(): Promise<PrivacyLevel | null> {
    return new Promise(resolve => {
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
            },
          },
          cancel: {
            label: game.i18n.localize('Cancel'),
            callback: () => resolve(null),
          },
        },
      }).render(true);
    });
  }
}
