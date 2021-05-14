import $ from 'jquery';
import * as d3 from 'd3';
import './style.css';
import Layout from '../Layout/Layout';
import { Widget } from '@phosphor/widgets';
import GraphVisualizationWidget from '../GraphVisualization/GraphVisualizationWidget';
import CustomWidget from '../Layout/CustomWidget';
import { IMessageHandler } from '@phosphor/messaging';
import ResizeMessage = Widget.ResizeMessage;

export default class GlobalNoiseWidget extends CustomWidget implements IMessageHandler {
  private static readonly widgetID: string = 'global-noise';
  public static readonly noiseContainerId: string = 'global-noise-visualization';

  private noiseContainer: JQuery<HTMLDivElement>;
  private graphVis: GraphVisualizationWidget;

  static get WidgetID(): string {
    return this.widgetID;
  }

  constructor(layout: Layout) {
    super(GlobalNoiseWidget.WidgetID, 'Noise Robustness');
    this.graphVis = layout.GraphVisWidget;
  }

  protected async renderContents(): Promise<void> {
    //
  }

  protected prepareNextRender(): void {
    super.prepareNextRender();

  }

  protected onResize(msg: ResizeMessage): void {
    this.resizeNoises();
  }

  protected createNodes(): void {
    super.createNodes();

    this.container.empty();

    this.noiseContainer = $('<div />')
      .attr('id', GlobalNoiseWidget.noiseContainerId)
      .appendTo(this.container) as JQuery<HTMLDivElement>;

    setTimeout(() => {
      this.initNoises();
    }, 500);
  }

  public updateNoises(noises: number[]): void {
    this.currentNoises = noises;

    if (this.svg) {
      let map = [{
        key: 'Majoriz.:',
        value: noises[2]
      }, {
        key: 'N-Sector:',
        value: noises[3]
      }, {
        key: 'Distill.:',
        value: noises[5]
      }];
      map = map.sort((a, b) => (a.value > b.value) ? -1 : 1);
      let output: string = '<span>Lower bounds on local-white-noise <br>entanglement threshold:</span><br><br>';
      map.forEach(d => {

        let val: string = `${d.value}`;
        try {
          val = d.value.toFixed(7);
        } catch (e) {
          // CATCH ERROR
        }
        output += `${d.key} ${val}\n`;
      });
      this.svg.html(output);
    }
  }

  private get Width(): number {
    return $(`#${GlobalNoiseWidget.widgetID}`).width();
  }

  private get Height(): number {
    return $(`#${GlobalNoiseWidget.widgetID}`).height();
  }

  private noiseSvg: JQuery<HTMLElement>;
  private svg: d3.Selection<HTMLElement, unknown, null, undefined>;

  private currentNoises: number[];

  private margin: number = 30;

  private get SvgHeight(): number {
    return Math.max(this.Height - this.margin * 2, 10);
  }
  private get SvgWidth(): number {
    return Math.max(this.Width - this.margin * 2, 10);
  }

  private initNoises(): void {
    this.noiseSvg = $('<pre id="noise-svg" />');
    this.noiseContainer.append(this.noiseSvg);
    this.svg = d3.select(this.noiseSvg[0]);
    this.svg.attr('width', this.Width);
    this.svg.attr('height', this.Height);
    this.svg.attr('style', `overflow:scroll; height:${this.Height}px; width:${this.Width}px;`);
  }

  private resizeNoises(): void {
    if (this.svg) {
      this.svg.attr('width', this.Width);
      this.svg.attr('height', this.Height);
      this.svg.attr('style', `overflow:scroll; height:${this.Height}px; width:${this.Width}px;`);
    }
  }

}
