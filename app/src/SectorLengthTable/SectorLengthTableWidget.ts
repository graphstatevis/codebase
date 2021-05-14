/* tslint:disable:no-console */
import './style.css';
import CustomWidget from '../Layout/CustomWidget';
import { IMessageHandler } from '@phosphor/messaging';
import GraphVisualizationWidget from '../GraphVisualization/GraphVisualizationWidget';
import Layout from '../Layout/Layout';
import $ from 'jquery';
import * as d3 from 'd3';
import { Widget } from '@phosphor/widgets';
import ResizeMessage = Widget.ResizeMessage;
import { Helper } from '../Helper/Helper';

export default class SectorLengthTableWidget extends CustomWidget implements IMessageHandler {
  private static readonly widgetID: string = 'global-noise';
  public static readonly noiseContainerId: string = 'sector-length-table';

  private tableContainer: JQuery<HTMLDivElement>;
  private copySldButton: JQuery<HTMLButtonElement>;
  private graphVis: GraphVisualizationWidget;
  private mylayout: Layout;

  static get WidgetID(): string {
    return this.widgetID;
  }

  constructor(layout: Layout) {
    super(SectorLengthTableWidget.WidgetID, 'Sector Length Table');
    this.mylayout = layout;
  }

  protected async renderContents(): Promise<void> {
    //
  }

  protected prepareNextRender(): void {
    super.prepareNextRender();

  }

  protected onResize(msg: ResizeMessage): void {

  }

  protected createNodes(): void {
    super.createNodes();

    this.container.empty();

    this.tableContainer = $('<div />')
      .attr('id', SectorLengthTableWidget.noiseContainerId)
      .appendTo(this.container) as JQuery<HTMLDivElement>;

    this.copySldButton = $(`<button id="split-for-optimal-size" class="btn btn-outline-dark ">Copy</button>`);
    this.copySldButton.on('click', () => {
      this.mylayout.GraphVisWidget.copyToClipboard(JSON.stringify(this.currentSLD));
      alert(`The Sector Length Distribution ${this.currentSLD} has been copied to your clipboard.`);
    });

    this.tableContainer.append(this.copySldButton);

    setTimeout(() => {
      this.init();
    }, 500);
  }

  private get Width(): number {
    return $(`#${SectorLengthTableWidget.widgetID}`).width();
  }

  private get Height(): number {
    return $(`#${SectorLengthTableWidget.widgetID}`).height();
  }

  private currentSLD: number[] = [];

  public toggleSldTable(show: boolean = true): void {
    this.copySldButton.css('display', show ? '' : 'none');
    this.svg.style('display', show ? '' : 'none');
  }

  public updateSLDTable(nums: number[]): void {
    this.toggleSldTable();
    this.currentSLD = nums;
    if (this.svg) {
      let output: string = '';

      nums.forEach((val, i) => {
        output += `A_${i}: ${val}\n`;
      });
      this.svg.html(output);
    }
  }

  private margin: number = 30;

  private get SvgHeight(): number {
    return Math.max(this.Height - this.margin * 2, 10);
  }
  private get SvgWidth(): number {
    return Math.max(this.Width - this.margin * 2, 10);
  }

  private htmlelem: JQuery<HTMLElement>;
  private svg: d3.Selection<HTMLElement, unknown, null, undefined>;

  private init(): void {
    this.htmlelem = $('<pre id="sector-length-dist-table" />');
    this.tableContainer.append(this.htmlelem);
    this.svg = d3.select(this.htmlelem[0]);
    this.svg.attr('style', `height:100%; width:100;`);
  }
}
