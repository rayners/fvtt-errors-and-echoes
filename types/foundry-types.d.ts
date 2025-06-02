/**
 * Basic Foundry VTT type definitions for Errors and Echoes module
 * These are minimal types focused on what the error reporting module needs
 */

declare global {
  interface Window {
    ErrorsAndEchoes: any;
  }

  interface Game {
    modules: Collection<Module>;
    settings: ClientSettings;
    system: System;
    version: string;
    i18n: Localization;
    actors: ActorsCollection;
    user: User;
  }

  interface Module {
    id: string;
    title: string;
    version: string;
    authors: Array<{ name?: string; github?: string; email?: string }>;
    active: boolean;
    api?: any;
  }

  interface Collection<T> {
    contents: T[];
    get(key: string): T | undefined;
    has(key: string): boolean;
    find(predicate: (item: T) => boolean): T | undefined;
    filter(predicate: (item: T) => boolean): T[];
    map<U>(mapper: (item: T) => U): U[];
  }

  interface ClientSettings {
    register(module: string, key: string, options: SettingConfig): void;
    registerMenu(module: string, key: string, options: SettingMenuConfig): void;
    get(module: string, key: string): any;
    set(module: string, key: string, value: any): Promise<any>;
  }

  interface SettingConfig {
    name?: string;
    hint?: string;
    scope: 'world' | 'client';
    config: boolean;
    type: any;
    default?: any;
    choices?: Record<string, string>;
    onChange?: (value: any) => void | Promise<void>;
  }

  interface SettingMenuConfig {
    name: string;
    label: string;
    hint: string;
    icon: string;
    type: new (...args: any[]) => FormApplication;
    restricted: boolean;
  }

  interface System {
    id: string;
    version: string;
    title: string;
  }

  interface Localization {
    localize(key: string): string;
    format(key: string, data: Record<string, any>): string;
  }

  interface ActorsCollection extends Collection<Actor> {
    // Extends base Collection with Actor-specific methods if needed
  }

  interface Actor {
    id: string;
    name: string;
    type: string;
    sheet?: ActorSheet;
  }

  interface ActorSheet {
    rendered: boolean;
  }

  interface User {
    id: string;
    name: string;
    isGM: boolean;
  }

  interface Canvas {
    scene: Scene | null;
  }

  interface Scene {
    id: string;
    name: string;
  }

  interface UI {
    notifications: Notifications;
  }

  interface Notifications {
    info(message: string, options?: NotificationOptions): void;
    warn(message: string, options?: NotificationOptions): void;
    error(message: string, options?: NotificationOptions): void;
  }

  interface NotificationOptions {
    permanent?: boolean;
    localize?: boolean;
  }

  interface HooksManager {
    once(hook: string, callback: (...args: any[]) => void): void;
    on(hook: string, callback: (...args: any[]) => void): void;
    call(hook: string, ...args: any[]): boolean;
    callAll(hook: string, ...args: any[]): void;
  }

  interface DialogData {
    title: string;
    content: string;
    buttons: Record<string, DialogButton>;
    default?: string;
    render?: (html: JQuery) => void;
    close?: () => void;
  }

  interface DialogButton {
    label: string;
    callback?: (html: JQuery) => void;
    icon?: string;
  }

  interface FormApplicationOptions {
    title?: string;
    template?: string;
    width?: number;
    height?: number | string;
    classes?: string[];
    resizable?: boolean;
    closeOnSubmit?: boolean;
    submitOnChange?: boolean;
    id?: string;
  }

  class Application {
    static get defaultOptions(): FormApplicationOptions;
    constructor(options?: Partial<FormApplicationOptions>);
    render(force?: boolean): this;
    close(): Promise<void>;
    activateListeners(html: JQuery): void;
    getData(): any;
  }

  class FormApplication extends Application {
    protected form?: HTMLFormElement;
    protected element?: JQuery;
    protected _updateObject(event: Event, formData: any): Promise<void>;
  }

  class Dialog extends Application {
    protected element?: JQuery;
    constructor(data: DialogData, options?: Partial<FormApplicationOptions>);
    static confirm(config: {
      title: string;
      content: string;
      yes?: (html: JQuery) => void;
      no?: (html: JQuery) => void;
      defaultYes?: boolean;
    }): Promise<boolean>;
  }

  class FormDataExtended {
    constructor(form: HTMLFormElement);
    object: Record<string, any>;
  }

  // Global variables
  declare const game: Game;
  declare const canvas: Canvas;
  declare const ui: UI;
  declare const Hooks: HooksManager;
  declare const foundry: {
    utils: {
      mergeObject(original: any, other: any, options?: any): any;
    }
  };

  // jQuery types for Foundry
  interface JQuery {
    find(selector: string): JQuery;
    click(handler?: (event: Event) => void): JQuery;
    change(handler?: (event: Event) => void): JQuery;
    text(text?: string): JQuery | string;
    val(value?: any): JQuery | any;
    prop(property: string, value?: any): JQuery | any;
    data(key: string): any;
    addClass(className: string): JQuery;
    removeClass(className: string): JQuery;
    closest(selector: string): JQuery;
    after(content: string | JQuery): JQuery;
    append(content: string | JQuery): JQuery;
    get(index: number): Element | undefined;
    length: number;
  }

  declare const $: (selector: string | Element | Document) => JQuery;
}

export {};