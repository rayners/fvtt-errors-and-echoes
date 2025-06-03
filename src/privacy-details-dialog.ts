/**
 * Privacy Details Dialog
 * 
 * Comprehensive privacy information dialog that shows users exactly
 * what data is collected and how it's used.
 */

import { ConsentManager, type PrivacyLevel } from './consent-manager.js';

interface ExamplePayload {
  error: {
    message: string;
    stack: string;
    type: string;
    source: string;
  };
  attribution: {
    moduleId: string;
    confidence: string;
    method: string;
  };
  foundry: {
    version: string;
    system?: {
      id: string;
      version: string;
    };
    modules?: Array<{
      id: string;
      version: string;
    }>;
  };
  meta: {
    timestamp: string;
    privacyLevel: PrivacyLevel;
    reporterVersion: string;
  };
}

export class PrivacyDetailsDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  
  static DEFAULT_OPTIONS = {
    id: 'errors-and-echoes-privacy-details',
    classes: ['errors-and-echoes', 'privacy-details'],
    tag: 'div',
    window: {
      frame: true,
      positioned: true,
      title: 'ERRORS_AND_ECHOES.PrivacyDetails.Title',
      resizable: true
    },
    position: {
      width: 800,
      height: 600
    },
    actions: {
      enableReporting: PrivacyDetailsDialog.prototype._onEnableReporting,
      changePrivacy: PrivacyDetailsDialog.prototype._onChangePrivacy,
      disableReporting: PrivacyDetailsDialog.prototype._onDisableReporting,
      revokeConsent: PrivacyDetailsDialog.prototype._onRevokeConsent,
      refreshExample: PrivacyDetailsDialog.prototype._onRefreshExample
    }
  };

  static PARTS = {
    main: {
      id: 'main',
      template: 'modules/errors-and-echoes/templates/privacy-details.hbs'
    }
  };

  /**
   * Prepare context data for the template
   */
  async _prepareContext(options = {}): Promise<any> {
    const context = await super._prepareContext(options);
    const currentPrivacyLevel = ConsentManager.getPrivacyLevel();
    const examplePayload = this.generateExamplePayload(currentPrivacyLevel);
    
    return Object.assign(context, {
      examplePayload: this.formatJsonWithSyntaxHighlighting(JSON.stringify(examplePayload, null, 2)),
      privacyLevel: currentPrivacyLevel,
      endpoints: this.getConfiguredEndpoints(),
      hasConsent: ConsentManager.hasConsent(),
      consentDate: ConsentManager.getConsentDate(),
      minimalItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.MinimalItems.ErrorMessage'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.MinimalItems.StackTrace'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.MinimalItems.ErrorType'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.MinimalItems.Timestamp')
      ],
      standardItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.StandardItems.FromMinimal'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.StandardItems.FoundryVersion'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.StandardItems.SystemInfo'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.StandardItems.ModuleList'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.StandardItems.SessionId')
      ],
      detailedItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DetailedItems.FromStandard'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DetailedItems.BrowserInfo'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DetailedItems.SceneName'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DetailedItems.ErrorContext')
      ],
      notCollectedItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.NotCollectedItems.IpAddress'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.NotCollectedItems.WorldData'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.NotCollectedItems.ChatMessages'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.NotCollectedItems.ModuleSettings'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.NotCollectedItems.UserAccounts'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.NotCollectedItems.PersonalInfo')
      ],
      dataUsageItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DataUsageItems.HelpAuthors'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DataUsageItems.ImproveQuality'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DataUsageItems.ProvideContext'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DataUsageItems.NoTracking'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DataUsageItems.NoSelling'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.DataUsageItems.NoIdentification')
      ],
      rightsItems: [
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.RightsItems.OptOut'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.RightsItems.ChangePrivacy'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.RightsItems.DisableEndpoints'),
        game.i18n.localize('ERRORS_AND_ECHOES.PrivacyDetails.RightsItems.Anonymous')
      ]
    });
  }

  /**
   * Generate example payload for demonstration
   */
  private generateExamplePayload(privacyLevel: PrivacyLevel): ExamplePayload {
    const basePayload: ExamplePayload = {
      error: {
        message: "Cannot read property 'value' of undefined",
        stack: "TypeError: Cannot read property 'value' of undefined\\n    at PartyActor.calculateMovement (modules/journeys-and-jamborees/dist/party-actor.js:123:45)",
        type: "TypeError",
        source: "javascript"
      },
      attribution: {
        moduleId: "journeys-and-jamborees",
        confidence: "high",
        method: "stack-trace"
      },
      foundry: {
        version: game.version
      },
      meta: {
        timestamp: new Date().toISOString(),
        privacyLevel: privacyLevel,
        reporterVersion: game.modules.get('errors-and-echoes')?.version || '1.0.0'
      }
    };

    // Add data based on privacy level
    if (privacyLevel === 'standard' || privacyLevel === 'detailed') {
      basePayload.foundry.system = {
        id: game.system.id,
        version: game.system.version
      };

      basePayload.foundry.modules = [
        { id: "journeys-and-jamborees", version: "1.2.3" },
        { id: "realms-and-reaches", version: "0.8.1" },
        { id: "dnd5e", version: "3.1.2" }
      ];
    }

    return basePayload;
  }

  /**
   * Format JSON string with basic syntax highlighting
   */
  private formatJsonWithSyntaxHighlighting(json: string): string {
    return json
      // Highlight strings (including keys)
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
        if (match.endsWith('":')) {
          // It's a key
          return `<span class="json-key">${match}</span>`;
        } else {
          // It's a string value
          return `<span class="json-string">${match}</span>`;
        }
      })
      // Highlight numbers
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
      // Highlight booleans and null
      .replace(/\b(true|false|null)\b/g, '<span class="json-boolean">$1</span>')
      // Highlight punctuation
      .replace(/([,:])/g, '<span class="json-punctuation">$1</span>')
      // Highlight brackets
      .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>');
  }

  /**
   * Get configured endpoints for display
   */
  private getConfiguredEndpoints(): Array<{name: string, url: string, enabled: boolean}> {
    try {
      const endpoints = game.settings.get('errors-and-echoes', 'endpoints') || [];
      return endpoints.map((endpoint: any) => ({
        name: endpoint.name,
        url: endpoint.url,
        enabled: endpoint.enabled
      }));
    } catch (error) {
      return [];
    }
  }


  /**
   * Handle enabling error reporting
   */
  async _onEnableReporting(event: Event, target: HTMLElement): Promise<void> {
    try {
      await ConsentManager.setConsent(true, 'standard');
      this.render(true); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to enable error reporting:', error);
      ui.notifications.error('Failed to enable error reporting');
    }
  }

  /**
   * Handle changing privacy level
   */
  async _onChangePrivacy(event: Event, target: HTMLElement): Promise<void> {
    try {
      // Import welcome dialog for privacy level selection
      const { ErrorReporterWelcomeDialog } = await import('./welcome-dialog.js');
      const selectedLevel = await ErrorReporterWelcomeDialog.showPrivacyLevelDialog();
      
      if (selectedLevel) {
        await game.settings.set('errors-and-echoes', 'privacyLevel', selectedLevel);
        this.render(true); // Refresh to show updated privacy level
        ui.notifications.info(`Privacy level changed to: ${selectedLevel}`);
      }
    } catch (error) {
      console.error('Failed to change privacy level:', error);
      ui.notifications.error('Failed to change privacy level');
    }
  }

  /**
   * Handle disabling error reporting
   */
  async _onDisableReporting(event: Event, target: HTMLElement): Promise<void> {
    try {
      await ConsentManager.setConsent(false);
      this.render(true); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to disable error reporting:', error);
      ui.notifications.error('Failed to disable error reporting');
    }
  }

  /**
   * Handle revoking all consent
   */
  async _onRevokeConsent(event: Event, target: HTMLElement): Promise<void> {
    const confirmed = await Dialog.confirm({
      title: 'Revoke All Consent',
      content: '<p>Are you sure you want to revoke all error reporting consent? This will disable all error reporting and clear your consent preferences.</p>'
    });

    if (confirmed) {
      try {
        await ConsentManager.revokeConsent();
        this.render(true); // Refresh to show updated status
        ui.notifications.info('All error reporting consent has been revoked');
      } catch (error) {
        console.error('Failed to revoke consent:', error);
        ui.notifications.error('Failed to revoke consent');
      }
    }
  }

  /**
   * Handle refreshing the example payload
   */
  async _onRefreshExample(event: Event, target: HTMLElement): Promise<void> {
    // Re-render to get fresh example with current privacy level
    this.render(true);
  }

  /**
   * Static method to show the privacy details dialog
   */
  static show(): PrivacyDetailsDialog {
    const dialog = new this();
    dialog.render(true);
    return dialog;
  }
}