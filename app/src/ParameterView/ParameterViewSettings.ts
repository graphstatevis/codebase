import $ from 'jquery';
import Settings from '../Settings/Settings';
import ParameterViewWidget from './ParameterViewWidget';

class ParameterViewSettings implements Settings {
  private container: JQuery<HTMLElement>;
  private parameterWidget: ParameterViewWidget;

  constructor(widget: ParameterViewWidget) {
    this.parameterWidget = widget;
  }

  public enableControls(): void {
    return;
  }

  public render(): void {
    this.container.empty();

    const wrapper = $('<div />', { id: 'info' })
      .text(('no settings for the parameter widget available...'))
      .appendTo(this.container);
  }

  public setContainer(container: JQuery<HTMLElement>): void {
    this.container = container;
  }
}

export default ParameterViewSettings;
