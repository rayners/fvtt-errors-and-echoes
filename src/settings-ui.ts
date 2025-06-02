/**
 * Settings UI for Errors and Echoes
 * 
 * Provides configuration interface for error reporting endpoints
 */

interface EndpointConfig {
  name: string;
  url: string;
  author?: string;
  modules?: string[];
  enabled: boolean;
}

interface EndpointConfigWithIndex extends EndpointConfig {
  index: number;
  hasConsent: boolean;
  testStatus: 'pending' | 'success' | 'error';
}

interface ModuleInfo {
  id: string;
  title: string;
  version: string;
  enabled: boolean;
  authors: string;
}

interface SettingsData {
  endpoints: EndpointConfigWithIndex[];
  installedModules: ModuleInfo[];
  privacyLevel: string;
  globalEnabled: boolean;
  i18n: Record<string, string>;
}

export class EndpointConfigDialog extends FormApplication {
  
  static override get defaultOptions(): FormApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Title'),
      template: 'modules/errors-and-echoes/templates/settings-config.hbs',
      width: 700,
      height: 600,
      classes: ['errors-and-echoes-config'],
      resizable: true,
      closeOnSubmit: false,
      submitOnChange: false,
      id: 'errors-and-echoes-config'
    });
  }

  override async getData(): Promise<SettingsData> {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    const installedModules = this.getRelevantModules();
    const endpointConsent: Record<string, boolean> = game.settings.get('errors-and-echoes', 'endpointConsent') || {};

    return {
      endpoints: endpoints.map((endpoint, index) => ({
        ...endpoint,
        index,
        hasConsent: endpointConsent[endpoint.url] !== false,
        testStatus: 'pending' as const
      })),
      installedModules,
      privacyLevel: game.settings.get('errors-and-echoes', 'privacyLevel') || 'standard',
      globalEnabled: game.settings.get('errors-and-echoes', 'globalEnabled') || false,
      i18n: {
        addEndpoint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.AddEndpoint'),
        removeEndpoint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.RemoveEndpoint'),
        testEndpoint: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.TestEndpoint'),
        endpointName: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.EndpointName'),
        endpointUrl: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.EndpointUrl'),
        author: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Author'),
        modules: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Modules'),
        enabled: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Enabled'),
        consent: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Consent'),
        status: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Status'),
        monitoredModules: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.MonitoredModules'),
        save: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Save'),
        cancel: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Cancel')
      }
    };
  }

  private getRelevantModules(): ModuleInfo[] {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    const monitoredModules = new Set<string>();

    // Collect all modules from all endpoints
    endpoints.forEach(endpoint => {
      if (endpoint.modules) {
        endpoint.modules.forEach(moduleId => monitoredModules.add(moduleId));
      }
      if (endpoint.author) {
        // Find modules by author
        game.modules.contents
          .filter(mod => mod.authors?.some(author => 
            author.name === endpoint.author || author.github === endpoint.author
          ))
          .forEach(mod => monitoredModules.add(mod.id));
      }
    });

    return Array.from(monitoredModules).map(moduleId => {
      const module = game.modules.get(moduleId);
      return {
        id: moduleId,
        title: module?.title || moduleId,
        version: module?.version || game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Unknown'),
        enabled: module?.active || false,
        authors: module?.authors?.map(a => a.name || a.github).filter(Boolean).join(', ') || 
                game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Unknown')
      };
    });
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Add endpoint button
    html.find('[data-action="add-endpoint"]').click(() => {
      this.addEndpoint();
    });

    // Remove endpoint buttons
    html.find('[data-action="remove-endpoint"]').click((event) => {
      const target = event.currentTarget as HTMLElement;
      const index = parseInt($(target).data('index'));
      this.removeEndpoint(index);
    });

    // Test endpoint buttons
    html.find('[data-action="test-endpoint"]').click(async (event) => {
      const target = event.currentTarget as HTMLElement;
      const index = parseInt($(target).data('index'));
      await this.testEndpoint(index, target);
    });

    // Toggle endpoint enabled
    html.find('.endpoint-enabled').change((event) => {
      const target = event.currentTarget as HTMLInputElement;
      const index = parseInt($(target).data('index'));
      this.toggleEndpoint(index, target.checked);
    });

    // Toggle endpoint consent
    html.find('.endpoint-consent').change((event) => {
      const target = event.currentTarget as HTMLInputElement;
      const index = parseInt($(target).data('index'));
      this.toggleEndpointConsent(index, target.checked);
    });

    // Auto-save on input changes
    html.find('input[type="text"], input[type="url"], textarea').change(() => {
      this.saveSettings();
    });
  }

  private async addEndpoint(): Promise<void> {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    
    endpoints.push({
      name: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.NewEndpoint'),
      url: '',
      author: '',
      modules: [],
      enabled: true
    });

    await game.settings.set('errors-and-echoes', 'endpoints', endpoints);
    this.render(true);
  }

  private async removeEndpoint(index: number): Promise<void> {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    
    if (index >= 0 && index < endpoints.length) {
      // Ask for confirmation
      const confirmed = await Dialog.confirm({
        title: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.ConfirmRemove'),
        content: game.i18n.format('ERRORS_AND_ECHOES.Settings.EndpointConfig.ConfirmRemoveContent', {
          name: endpoints[index].name
        })
      });

      if (confirmed) {
        endpoints.splice(index, 1);
        await game.settings.set('errors-and-echoes', 'endpoints', endpoints);
        this.render(true);
      }
    }
  }

  private async testEndpoint(index: number, buttonElement: HTMLElement): Promise<void> {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    const endpoint = endpoints[index];

    if (!endpoint?.url) {
      ui.notifications.warn(game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.TestNoUrl'));
      return;
    }

    // Update button state
    const $button = $(buttonElement);
    const originalText = $button.text();
    $button.prop('disabled', true).text(game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Testing'));

    try {
      // Import ErrorReporter for testing
      const { ErrorReporter } = await import('./error-reporter.js');
      const success = await ErrorReporter.testEndpoint(endpoint.url);

      if (success) {
        ui.notifications.info(game.i18n.format('ERRORS_AND_ECHOES.Settings.EndpointConfig.TestSuccess', {
          name: endpoint.name
        }));
        $button.addClass('test-success').removeClass('test-error');
      } else {
        throw new Error('Test failed');
      }
    } catch (error) {
      console.warn('Endpoint test failed:', error);
      ui.notifications.error(game.i18n.format('ERRORS_AND_ECHOES.Settings.EndpointConfig.TestError', {
        name: endpoint.name,
        error: error instanceof Error ? error.message : String(error)
      }));
      $button.addClass('test-error').removeClass('test-success');
    } finally {
      // Restore button state
      $button.prop('disabled', false).text(originalText);
    }
  }

  private async toggleEndpoint(index: number, enabled: boolean): Promise<void> {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    if (index >= 0 && index < endpoints.length) {
      endpoints[index].enabled = enabled;
      await game.settings.set('errors-and-echoes', 'endpoints', endpoints);
    }
  }

  private async toggleEndpointConsent(index: number, hasConsent: boolean): Promise<void> {
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    if (index >= 0 && index < endpoints.length) {
      const endpointConsent: Record<string, boolean> = game.settings.get('errors-and-echoes', 'endpointConsent') || {};
      endpointConsent[endpoints[index].url] = hasConsent;
      await game.settings.set('errors-and-echoes', 'endpointConsent', endpointConsent);
    }
  }

  private async saveSettings(): Promise<void> {
    const formElement = this.form;
    if (!formElement) return;

    const formData = new FormDataExtended(formElement);
    const data = formData.object;

    // Parse endpoints from form data
    const endpoints: EndpointConfig[] = [];
    const endpointCount = Object.keys(data).filter(key => key.startsWith('endpoint-name-')).length;

    for (let i = 0; i < endpointCount; i++) {
      const name = data[`endpoint-name-${i}`] as string;
      const url = data[`endpoint-url-${i}`] as string;
      const author = data[`endpoint-author-${i}`] as string;
      const modulesString = data[`endpoint-modules-${i}`] as string;
      const modules = modulesString?.split(',').map(m => m.trim()).filter(m => m) || [];
      const enabled = data[`endpoint-enabled-${i}`] || false;

      if (name && url) {
        endpoints.push({
          name,
          url,
          author: author || '',
          modules,
          enabled: Boolean(enabled)
        });
      }
    }

    await game.settings.set('errors-and-echoes', 'endpoints', endpoints);
  }

  protected override async _updateObject(_event: Event, _formData: any): Promise<void> {
    // This is called when the form is submitted
    await this.saveSettings();
    ui.notifications.info(game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.SaveSuccess'));
  }
}