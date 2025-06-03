/**
 * Settings UI for Errors and Echoes
 * 
 * Provides configuration interface for error reporting endpoints
 */

import { moduleMatchesAuthor, getFormattedAuthorString } from './author-utils.js';
import { ModuleRegistry, type RegisteredModule } from './module-registry.js';

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
  isProtected: boolean;
}

interface ModuleInfo {
  id: string;
  title: string;
  version: string;
  enabled: boolean;
  authors: string;
}

interface RegisteredModuleInfo {
  id: string;
  title: string;
  version: string;
  enabled: boolean;
  authors: string;
  hasContextProvider: boolean;
  hasErrorFilter: boolean;
  hasCustomEndpoint: boolean;
  registrationTime: string;
  contextCallCount: number;
  filterCallCount: number;
  lastContextCall?: string;
}

interface SettingsData {
  endpoints: EndpointConfigWithIndex[];
  installedModules: ModuleInfo[];
  registeredModules: RegisteredModuleInfo[];
  registrationStats: {
    totalRegistered: number;
    modulesWithContext: number;
    modulesWithFilters: number;
    modulesWithEndpoints: number;
    totalContextCalls: number;
    totalFilterCalls: number;
  };
  privacyLevel: string;
  globalEnabled: boolean;
  i18n: Record<string, string>;
}

export class EndpointConfigDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  
  static DEFAULT_OPTIONS = {
    id: 'errors-and-echoes-config',
    classes: ['errors-and-echoes', 'config'],
    tag: 'div',
    window: {
      frame: true,
      positioned: true,
      title: 'ERRORS_AND_ECHOES.Settings.EndpointConfig.Title',
      resizable: true
    },
    position: {
      width: 700,
      height: 600
    },
    actions: {
      addEndpoint: EndpointConfigDialog.prototype._onAddEndpoint,
      removeEndpoint: EndpointConfigDialog.prototype._onRemoveEndpoint,
      testEndpoint: EndpointConfigDialog.prototype._onTestEndpoint,
      toggleEnabled: EndpointConfigDialog.prototype._onToggleEnabled,
      toggleConsent: EndpointConfigDialog.prototype._onToggleConsent,
      saveSettings: EndpointConfigDialog.prototype._onSaveSettings,
      showAvailableModules: EndpointConfigDialog.prototype._onShowAvailableModules,
      clearModules: EndpointConfigDialog.prototype._onClearModules
    }
  };

  static PARTS = {
    main: {
      id: 'main',
      template: 'modules/errors-and-echoes/templates/settings-config.hbs'
    }
  };

  async _prepareContext(options = {}): Promise<SettingsData> {
    const context = await super._prepareContext(options);
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    const installedModules = this.getRelevantModules();
    const registeredModules = this.getRegisteredModules();
    const registrationStats = ModuleRegistry.getStats();
    const endpointConsent: Record<string, boolean> = game.settings.get('errors-and-echoes', 'endpointConsent') || {};

    return Object.assign(context, {
      endpoints: endpoints.map((endpoint, index) => ({
        ...endpoint,
        index,
        hasConsent: endpointConsent[endpoint.url] !== false,
        testStatus: 'pending' as const,
        isProtected: endpoint.author === 'rayners'
      })),
      installedModules,
      registeredModules,
      registrationStats,
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
        registeredModules: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.RegisteredModules') || 'Registered Modules',
        save: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Save'),
        cancel: game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Cancel')
      }
    });
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
          .filter(mod => moduleMatchesAuthor(mod, endpoint.author))
          .forEach(mod => monitoredModules.add(mod.id));
      }
    });

    return Array.from(monitoredModules)
      .map(moduleId => {
        // Get all installed modules for reference
        const allModules = game.modules.contents;
        const moduleInfo = allModules.find(m => m.id === moduleId);
        
        return { moduleId, moduleInfo };
      })
      .filter(({ moduleInfo }) => moduleInfo !== undefined) // Only include modules that actually exist
      .map(({ moduleId, moduleInfo }) => {
	      console.log(moduleInfo);
        // Extract author information using utility function
        const authors = getFormattedAuthorString(
          moduleInfo, 
          game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Unknown')
        );
        
        return {
          id: moduleId,
          title: moduleInfo.title,
          version: moduleInfo.version,
          enabled: moduleInfo.active || false,
          authors
        };
      });
  }

  private getRegisteredModules(): RegisteredModuleInfo[] {
    const registeredModules = ModuleRegistry.getAllRegisteredModules();
    
    return registeredModules.map(registered => {
      const moduleInfo = game.modules.get(registered.moduleId);
      const authors = moduleInfo ? getFormattedAuthorString(
        moduleInfo, 
        game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.Unknown') || 'Unknown'
      ) : 'Unknown';
      
      return {
        id: registered.moduleId,
        title: moduleInfo?.title || registered.moduleId,
        version: moduleInfo?.version || 'Unknown',
        enabled: moduleInfo?.active || false,
        authors,
        hasContextProvider: !!registered.contextProvider,
        hasErrorFilter: !!registered.errorFilter,
        hasCustomEndpoint: !!registered.endpoint,
        registrationTime: registered.registrationTime,
        contextCallCount: registered.contextCallCount,
        filterCallCount: registered.filterCallCount,
        lastContextCall: registered.lastContextCall
      };
    });
  }

  // Note: ApplicationV2 uses actions system instead of activateListeners

  async _onAddEndpoint(event: Event, target: HTMLElement): Promise<void> {
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

  async _onRemoveEndpoint(event: Event, target: HTMLElement): Promise<void> {
    const index = parseInt(target.dataset.index || '0');
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    
    if (index >= 0 && index < endpoints.length) {
      const endpoint = endpoints[index];
      
      // Prevent deletion of protected 'rayners' entry
      if (endpoint.author === 'rayners') {
        ui.notifications.warn('Cannot delete the rayners endpoint - it can only be disabled.');
        return;
      }
      
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

  async _onTestEndpoint(event: Event, target: HTMLElement): Promise<void> {
    const index = parseInt(target.dataset.index || '0');
    const buttonElement = target;
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

  async _onToggleEnabled(event: Event, target: HTMLElement): Promise<void> {
    const input = target as HTMLInputElement;
    const index = parseInt(input.dataset.index || '0');
    const enabled = input.checked;
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    if (index >= 0 && index < endpoints.length) {
      endpoints[index].enabled = enabled;
      await game.settings.set('errors-and-echoes', 'endpoints', endpoints);
    }
  }

  async _onToggleConsent(event: Event, target: HTMLElement): Promise<void> {
    const input = target as HTMLInputElement;
    const index = parseInt(input.dataset.index || '0');
    const hasConsent = input.checked;
    const endpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];
    if (index >= 0 && index < endpoints.length) {
      const endpointConsent: Record<string, boolean> = game.settings.get('errors-and-echoes', 'endpointConsent') || {};
      endpointConsent[endpoints[index].url] = hasConsent;
      await game.settings.set('errors-and-echoes', 'endpointConsent', endpointConsent);
    }
  }

  async _onSaveSettings(event: Event, target: HTMLElement): Promise<void> {
    await this.saveSettingsInternal();
    ui.notifications.info(game.i18n.localize('ERRORS_AND_ECHOES.Settings.EndpointConfig.SaveSuccess'));
  }


  private async saveSettingsInternal(): Promise<void> {
    const formElement = this.element?.querySelector('form') as HTMLFormElement;
    if (!formElement) return;

    const formData = new FormDataExtended(formElement);
    const data = formData.object;

    // Parse endpoints from form data
    const endpoints: EndpointConfig[] = [];
    const endpointCount = Object.keys(data).filter(key => key.startsWith('endpoint-name-')).length;
    
    // Get existing endpoints to check for protected entries
    const existingEndpoints: EndpointConfig[] = game.settings.get('errors-and-echoes', 'endpoints') || [];

    for (let i = 0; i < endpointCount; i++) {
      const name = data[`endpoint-name-${i}`] as string;
      const url = data[`endpoint-url-${i}`] as string;
      let author = data[`endpoint-author-${i}`] as string;
      const modulesString = data[`endpoint-modules-${i}`] as string;
      // Handle both comma and newline separated values
      const modules = modulesString?.split(/[,\n]+/).map(m => m.trim()).filter(m => m) || [];
      const enabled = data[`endpoint-enabled-${i}`] || false;
      
      // Force author to 'rayners' for protected entries
      const existingEndpoint = existingEndpoints[i];
      if (existingEndpoint?.author === 'rayners') {
        author = 'rayners'; // Force protected value
      }

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

    // Only save if the endpoints have actually changed to avoid unnecessary saves
    const currentEndpoints = game.settings.get('errors-and-echoes', 'endpoints') || [];
    const endpointsChanged = JSON.stringify(endpoints) !== JSON.stringify(currentEndpoints);
    
    if (endpointsChanged) {
      await game.settings.set('errors-and-echoes', 'endpoints', endpoints);
    }
  }


  async _onShowAvailableModules(event: Event, target: HTMLElement): Promise<void> {
    const index = parseInt(target.dataset.index || '0');
    const textarea = this.element?.querySelector(`#endpoint-modules-${index}`) as HTMLTextAreaElement;
    
    // Get currently selected modules
    const currentValue = textarea?.value.trim() || '';
    const selectedModules = currentValue ? currentValue.split(/[,\n]+/).map(m => m.trim()).filter(m => m) : [];
    
    const allModules = game.modules.contents
      .filter(m => m.active)
      .sort((a, b) => a.title.localeCompare(b.title));

    // Separate selected and unselected modules
    const unselectedModules = allModules.filter(m => !selectedModules.includes(m.id));
    const alreadySelectedModules = allModules.filter(m => selectedModules.includes(m.id));

    // Create module option HTML
    const createModuleOption = (module: any, isSelected: boolean = false) => {
      const authors = getFormattedAuthorString(module, 'Unknown');
      
      const buttonClass = isSelected ? 'btn-success disabled' : 'btn-secondary';
      const buttonIcon = isSelected ? 'fas fa-check' : 'fas fa-plus';
      const buttonText = isSelected ? 'Selected' : 'Add';
      const disabledAttr = isSelected ? 'disabled' : '';
      const selectedClass = isSelected ? 'module-selected' : '';
      
      return `
        <div class="module-option ${selectedClass}" data-module-id="${module.id}">
          <div class="module-info">
            <strong>${module.title}</strong> (${module.id})
            <br><small>v${module.version} by ${authors}</small>
            ${isSelected ? '<span class="selected-indicator"><i class="fas fa-check-circle"></i> Currently selected</span>' : ''}
          </div>
          <div class="module-actions">
            <button type="button" class="btn btn-sm ${buttonClass} add-module-btn" 
                    data-module-id="${module.id}" ${disabledAttr}>
              <i class="${buttonIcon}"></i> ${buttonText}
            </button>
            ${isSelected ? `
              <button type="button" class="btn btn-sm btn-outline-danger remove-module-btn" 
                      data-module-id="${module.id}">
                <i class="fas fa-times"></i> Remove
              </button>
            ` : ''}
          </div>
        </div>
      `;
    };

    const selectedSection = alreadySelectedModules.length > 0 ? `
      <div class="modules-section">
        <h4><i class="fas fa-check-circle"></i> Currently Selected (${alreadySelectedModules.length})</h4>
        <div class="modules-list selected-modules">
          ${alreadySelectedModules.map(m => createModuleOption(m, true)).join('')}
        </div>
      </div>
    ` : '';

    const availableSection = `
      <div class="modules-section">
        <h4><i class="fas fa-plus-circle"></i> Available to Add (${unselectedModules.length})</h4>
        ${unselectedModules.length > 0 ? `
          <div class="search-container">
            <input type="text" class="module-search" placeholder="Search modules..." />
            <i class="fas fa-search search-icon"></i>
          </div>
          <div class="modules-list available-modules">
            ${unselectedModules.map(m => createModuleOption(m, false)).join('')}
          </div>
        ` : '<p class="no-modules"><em>All active modules are already selected.</em></p>'}
      </div>
    `;

    const content = `
      <div class="enhanced-modules-dialog">
        <div class="dialog-header">
          <p>Manage modules to monitor for this endpoint:</p>
          <div class="stats">
            <span class="stat-item">
              <i class="fas fa-cube"></i> ${selectedModules.length} selected
            </span>
            <span class="stat-item">
              <i class="fas fa-cubes"></i> ${allModules.length} total active
            </span>
          </div>
        </div>
        
        ${selectedSection}
        ${availableSection}
      </div>
    `;

    new Dialog({
      title: 'Manage Monitored Modules',
      content,
      buttons: {
        close: {
          label: '<i class="fas fa-times"></i> Close',
          callback: () => {}
        }
      },
      render: (html) => {
        // Search functionality
        const searchInput = html.find('.module-search');
        const availableModules = html.find('.available-modules .module-option');
        
        searchInput.on('input', (e) => {
          const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
          availableModules.each((_, element) => {
            const moduleText = element.textContent?.toLowerCase() || '';
            const isVisible = moduleText.includes(searchTerm);
            $(element).toggle(isVisible);
          });
        });

        // Add module handlers
        html.find('.add-module-btn:not(.disabled)').on('click', async (e) => {
          const moduleId = e.currentTarget.dataset.moduleId;
          if (textarea && moduleId) {
            const currentValue = textarea.value.trim();
            const modules = currentValue ? currentValue.split(/[,\n]+/).map(m => m.trim()).filter(m => m) : [];
            
            if (!modules.includes(moduleId)) {
              modules.push(moduleId);
              textarea.value = modules.join(', ');
              
              // Trigger multiple events to ensure detection
              textarea.dispatchEvent(new Event('input', { bubbles: true }));
              textarea.dispatchEvent(new Event('change', { bubbles: true }));
              textarea.dispatchEvent(new Event('blur', { bubbles: true }));
              
              // Also manually save to be sure
              await this.saveSettingsInternal();
              
              // Move module to selected section
              const moduleElement = $(e.currentTarget).closest('.module-option');
              moduleElement.fadeOut(200, () => {
                // Re-render dialog would be complex, so just provide feedback
                ui.notifications.info(`Added ${moduleId} to monitored modules`);
              });
            }
          }
        });

        // Remove module handlers
        html.find('.remove-module-btn').on('click', async (e) => {
          const moduleId = e.currentTarget.dataset.moduleId;
          if (textarea && moduleId) {
            const currentValue = textarea.value.trim();
            const modules = currentValue ? currentValue.split(/[,\n]+/).map(m => m.trim()).filter(m => m) : [];
            
            const filteredModules = modules.filter(m => m !== moduleId);
            textarea.value = filteredModules.join(', ');
            
            // Trigger multiple events to ensure detection
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            textarea.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Also manually save to be sure
            await this.saveSettingsInternal();
            
            // Visual feedback
            const moduleElement = $(e.currentTarget).closest('.module-option');
            moduleElement.fadeOut(200, () => {
              ui.notifications.info(`Removed ${moduleId} from monitored modules`);
            });
          }
        });
      }
    }, {
      width: 600,
      height: 500,
      resizable: true
    }).render(true);
  }

  async _onClearModules(event: Event, target: HTMLElement): Promise<void> {
    const index = parseInt(target.dataset.index || '0');
    const textarea = this.element?.querySelector(`#endpoint-modules-${index}`) as HTMLTextAreaElement;
    
    if (textarea) {
      const confirmed = await Dialog.confirm({
        title: 'Clear All Modules',
        content: '<p>Are you sure you want to remove all modules from this endpoint? This action cannot be undone.</p>'
      });
      
      if (confirmed) {
        textarea.value = '';
        
        // Manually save the settings instead of relying on change event
        await this.saveSettingsInternal();
        
        // Re-render to update the UI
        this.render(true);
        ui.notifications.info('All modules cleared from this endpoint');
      }
    }
  }
}
