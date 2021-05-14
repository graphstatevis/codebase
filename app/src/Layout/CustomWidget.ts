import { Message, MessageLoop } from '@phosphor/messaging';
import { Widget, TabBar } from '@phosphor/widgets';
import $ from 'jquery';
import Settings from '../Settings/Settings';
import SettingsWidget from '../Settings/SettingsWidget';
import Layout from './Layout';

// tslint:disable-next-line:no-empty-interface
export interface Observer {
}

abstract class CustomWidget extends Widget implements Observer {
  protected container: JQuery<HTMLDivElement>;
  protected errorMessage: JQuery<HTMLDivElement>;
  protected isRendered: boolean;
  protected loadingIndicator: JQuery<HTMLDivElement>;
  protected observers: Observer[];
  protected placeHolder: JQuery<HTMLDivElement>;
  protected settings: Settings;
  protected settingsWidget: SettingsWidget;
  protected shouldRenderOnNextActivation: boolean;

  constructor(id: string, displayName: string) {
    super({
      node: $('<div />')
        .addClass('widget')
        .attr({ id })[0]
    });

    this.container = $(this.node) as JQuery<HTMLDivElement>;
    this.id = id;
    this.title.closable = true;
    this.title.label = (displayName);

    this.createNodes();
  }

  set Observers(observers: Observer[]) {
    this.observers = observers;
  }

  public getSettings(): Settings {
    return this.settings;
  }

  public async render(): Promise<void> {
    if (this.isRendered) {
      this.prepareNextRender();
      this.isRendered = false;
    }

    this.showLoadingIndicator();

    try {
      await this.renderContents();
      this.hideLoadingIndicator();
      await this.renderOverlay();
    } catch (error) {
      this.showError(error.toString());
      throw error;
    } finally {
      this.hideLoadingIndicator();
    }

    if (this.settings !== undefined) this.settings.enableControls();

    this.isRendered = true;
  }

  public select(): void {
    const tabBar: TabBar<Widget> = Layout.getTabBarFor(this);
    tabBar.currentTitle = this.title;
    this.activate();
  }

  public setSettingsWidget(settingsWidget: SettingsWidget): void {
    this.settingsWidget = settingsWidget;
  }

  protected createNodes(): void {
    this.placeHolder = $('<div />')
      .addClass('placeholder')
      .append(
        $(`<span>${('Add SVG with graph visualization here...')}</span>`)
          .css({
          color: 'grey',
          fontSize: '1.75em',
          fontStyle: 'italic'
        })
      )
      .appendTo(this.container) as JQuery<HTMLDivElement>;

    this.loadingIndicator = $('<div />')
      .addClass('loading-indicator')
      .append(
        $('<div />')
          .addClass('spinner-border')
          .attr('role', 'status')
          .append(
            $('<span />')
              .addClass('sr-only')
              .text('Loading...')
          )
      )
      .appendTo(this.container) as JQuery<HTMLDivElement>;
  }

  protected async onActivateRequest(): Promise<void> {
    if (!this.isRendered) {
      this.placeHolder.hide();
      await this.render();
    } else if (this.shouldRenderOnNextActivation) {
      await this.render();

      this.shouldRenderOnNextActivation = false;
    }

    this.showSettings();
  }

  protected prepareNextRender(): void {
    if (this.errorMessage) this.errorMessage.remove();
  }

  protected showLoadingIndicator(): void {
    this.loadingIndicator.css('display', 'flex');
  }

  protected abstract async renderContents(): Promise<void>;

  protected hideLoadingIndicator(): void {
    this.loadingIndicator.css('display', 'none');
  }

  protected async renderOverlay(): Promise<void> {
    return;
  }

  protected showError(message: string): void {
    this.errorMessage = $(
      `<div class="alert alert-danger fade show" role="alert" style="margin-top: 25px; max-width: 75%;">
        ${message}
      </div>`
    ).prependTo(this.container) as JQuery<HTMLDivElement>;
  }

  protected async notifyObservers(...observations: any[]): Promise<void> {
    return;
  }

  protected showSettings(): void {
    if (this.settingsWidget !== undefined) {
      MessageLoop.sendMessage(this.settingsWidget, new Message(`show-settings-${this.id}`));
    }
  }
}

export default CustomWidget;
