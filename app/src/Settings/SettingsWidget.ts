import { IMessageHandler, Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import $ from 'jquery';
import CustomWidget from '../Layout/CustomWidget';
import Settings from './Settings';
import './style.css';

class SettingsWidget extends Widget implements IMessageHandler {
  private container: JQuery<HTMLElement>;
  private settings: Settings;

  constructor(name: string) {
    super({
      node: $('<div />')
        .addClass('widget')
        .attr({ id: 'settings-widget' })[0]
    });

    this.container = $(this.node);
    this.title.closable = false;
  }

  public addWidgets(widgets: {
    customWidget: CustomWidget
  }): void {
    Object.values(widgets).forEach((widget: CustomWidget) => widget.setSettingsWidget(this));

    this.settings = widgets.customWidget.getSettings();
    this.settings.setContainer(this.container);
  }

  public processMessage(message: Message): void {
    switch (message.type) {
      default:
        this.settings.render();
        break;
    }
  }
}

export default SettingsWidget;
