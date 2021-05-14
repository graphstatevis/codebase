/* tslint:disable:no-console */
import $ from 'jquery';
import * as d3 from 'd3';
import './style.css';
import Layout from '../Layout/Layout';
import GraphVisualizationWidget from '../GraphVisualization/GraphVisualizationWidget';
import CustomWidget from '../Layout/CustomWidget';
import { Widget } from '@phosphor/widgets';
import { Helper } from '../Helper/Helper';
import ResizeMessage = Widget.ResizeMessage;
import { IMessageHandler } from '@phosphor/messaging';

export default class SectorLengthHistogramWidget extends CustomWidget implements IMessageHandler {
  private static readonly widgetID: string = 'sector-length-histogram';
  public static readonly histogramContainerId: string = 'histogram-visualization';

  private histogramContainer: JQuery<HTMLDivElement>;
  private mylayout: Layout;

  protected noiseProbabilityInputField: JQuery<HTMLInputElement>;
  protected noiseProbabilityTextField: JQuery<HTMLDivElement>;
  protected enforceSldButton: JQuery<HTMLButtonElement>;
  private static initNoiseProbability: number = 0;

  static get WidgetID(): string {
    return this.widgetID;
  }

  constructor(layout: Layout) {
    super(SectorLengthHistogramWidget.WidgetID, 'Sector Length Distribution');
    this.mylayout = layout;
  }

  protected async renderContents(): Promise<void> {
    // NOT NEEDED
  }

  protected prepareNextRender(): void {
    super.prepareNextRender();

  }

  protected onResize(msg: ResizeMessage): void {
    this.resizeHistogram();
  }

  protected createNodes(): void {
    super.createNodes();

    this.container.empty();

    this.histogramContainer = $('<div />')
      .attr('id', SectorLengthHistogramWidget.histogramContainerId)
      .appendTo(this.container) as JQuery<HTMLDivElement>;

    this.enforceSldButton = $(`<button id="enforce-sld-button" class="btn btn-outline-dark ">Compute Sector Length Distribution</button>`);
    this.enforceSldButton.on('click', () => {
      this.mylayout.GraphVisWidget.updateSLHistogram();
      setTimeout(() => {
        this.updateNoiseBars();
      }, 100);
    });
    this.enforceSldButton.css('display', 'none');

    this.container.append(this.enforceSldButton);

    setTimeout(() => {
      this.initHistogram();
      this.initNoiseProbSlider();
    }, 500);
  }

  public getStretchFactor(k: number): number {
    return Math.pow(1 - SectorLengthHistogramWidget.initNoiseProbability, k * 2);
  }

  public initNoiseProbSlider(): void {
    this.noiseProbabilityInputField =
      $(`<input id="noise-probability-slider" type="range" class="sld" min="0" max="1" step="0.01" 
            value="${SectorLengthHistogramWidget.initNoiseProbability}" />`) 
        .appendTo(this.container) as JQuery<HTMLInputElement>;

    this.noiseProbabilityInputField.on('input', d => {
      this.updateNoiseBars();
    });

    this.noiseProbabilityTextField =
      $(`<span id="noise-probability-text">Noise Probability: p = ${SectorLengthHistogramWidget.initNoiseProbability}</span>`)
        .addClass('btn btn-sm')
        .appendTo(this.container) as JQuery<HTMLDivElement>;
  }

  private histXScale;
  private histYScale;

  public updateScales(slDist: number[]): void {
    try {
      this.histYScale = d3.scaleLinear()
          .range([this.SvgHeight, 0])
          .domain([0, Math.max(...slDist) + 1]);

      this.histXScale = d3.scaleBand()
          .range([0, this.SvgWidth])
          .domain(slDist.map((d, i) => `${i}`))
          .padding(0.2);
    } catch (e) {
      console.log('error', e);
    }
  }

  private currentSldDistMax;

  public updatePadding(): void {
    let width = 0;
    d3.select('#sl-histogram-svg').selectAll('#axis-left .tick text').each(function() {      
        const bBox = (d3.select(this).node() as any).getBoundingClientRect();
        if (width < bBox.width) width = bBox.width;        
    });

    d3.select('#histogram-visualization').style('padding-left', `${width}px`);
  }

  public toggleSldHistogram(show: boolean = true): void {
    this.slHistogramSvg.css('display', show ? '' : 'none');
    this.noiseProbabilityInputField.css('display', show ? '' : 'none');
    this.noiseProbabilityTextField.css('display', show ? '' : 'none');
    this.enforceSldButton.css('display', show ? 'none' : '');
  }

  public updateHistogram(slDist: number[]): void {    
    this.toggleSldHistogram();
    this.currentSLDist = slDist;
    this.updateScales(this.currentSLDist);

    this.histYScale = d3.scaleLinear()
      .range([this.SvgHeight, 0])
      .domain([0, Math.max(...slDist) + 1]);

    this.histXScale = d3.scaleBand()
      .range([0, this.SvgWidth])
      .domain(slDist.map((d, i) => `${i}`))
      .padding(0.2);

    this.currentSldDistMax = Math.max(...slDist);

    if (this.currentSldDistMax >= 1000000) {
      this.chart
      .select('#axis-left')
      .call(d3.axisLeft(this.histYScale).tickFormat(d3.format(`.1e`)));
    } else {
      this.chart
      .select('#axis-left')
      .call(d3.axisLeft(this.histYScale));
    }

    this.chart
      .select('#axis-bottom')
      .attr('transform', `translate(0, ${this.SvgHeight})`)
      .call(d3.axisBottom(this.histXScale));

    this.chart.selectAll('.noise-bar,.bar,.bar-label').attr('changed', 'no');

    for (const [i, val] of Helper.toEntries(slDist)) {
      let bar = this.chart.select(`#bar-${i}`);
      let noiseBar = this.chart.select(`#noise-bar-${i}`);
      let label = this.chart.select(`#bar-label-${i}`);
      if (bar.node() === null) {
        label = this.chart
          .append('text')
          .attr('class', 'bar-label')
          .attr('id', `bar-label-${i}`);
        bar = this.chart
          .append('rect')
          .attr('class', 'bar')
          .attr('id', `bar-${i}`)
          .attr('stroke', 'black')
          .attr('height', 0)
          .attr('width', this.histXScale.bandwidth())
          .attr('stroke-width', '1')
          .attr('fill', i % 2 === 0 ? GraphVisualizationWidget.ideal1Color : GraphVisualizationWidget.ideal2Color);
        noiseBar = this.chart
          .append('rect')
          .attr('class', 'noise-bar')
          .attr('id', `noise-bar-${i}`)
          .attr('stroke', 'black')
          .attr('height', 0)
          .attr('width', this.histXScale.bandwidth())
          .attr('stroke-width', '1')
          .attr('fill', i % 2 === 0 ? GraphVisualizationWidget.noise1Color : GraphVisualizationWidget.noise2Color)
          .append('title');
        bar.append('title');
      }
      bar.attr('x', this.histXScale(i + ''))
        .attr('y', this.histYScale(val))
        .attr('changed', 'yes')
        .attr('height', s => this.SvgHeight - this.histYScale(val))
        .attr('width', this.histXScale.bandwidth());

      noiseBar.attr('x', this.histXScale(i + ''))
        .attr('y', this.histYScale(this.getStretchFactor(i) * val))
        .attr('changed', 'yes')
        .attr('height', s => this.SvgHeight - this.histYScale(this.getStretchFactor(i) * val))
        .attr('width', this.histXScale.bandwidth());

      const value: string = `${this.currentSldDistMax > 1000000 ? this.expo(val, 1) : val}`;
      label.attr('x', this.histXScale(i + '') + this.histXScale.bandwidth() / 2)
        .attr('y', this.histYScale(val) - 5)
        .attr('changed', 'yes')
        .attr('height', s => this.SvgHeight - this.histYScale(val))
        .attr('width', this.histXScale.bandwidth())
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', 'gray')
        .text(value);
      noiseBar.select('title').html(`${val}`);
    }

    this.chart.selectAll('.bar,.noise-bar,.bar-label').each(function() {
      const elem = d3.select(this);
      if (elem.attr('changed') === 'no') {
        elem.remove();
      }
    });

    this.bars = this.chart.selectAll('.bar').data(slDist);
    this.noiseBars = this.chart.selectAll('.noise-bar').data(slDist);
    this.barLabels = this.chart.selectAll('.bar-label').data(slDist);
  }

  private expo(x, f): string {
    return Number.parseFloat(x).toExponential(f);
  }

  private get Width(): number {
    return $(`#${SectorLengthHistogramWidget.widgetID}`).width();
  }

  private get Height(): number {
    return $(`#${SectorLengthHistogramWidget.widgetID}`).height();
  }

  private slHistogramSvg: JQuery<HTMLElement>;
  private svg: d3.Selection<HTMLElement, unknown, null, undefined>;
  private chart: d3.Selection<SVGElement, unknown, null, undefined>;
  private bars: d3.Selection<d3.BaseType, number, SVGElement, unknown>;
  private noiseBars: d3.Selection<d3.BaseType, number, SVGElement, unknown>;
  private barLabels;
  private currentSLDist: number[];
  private margin: number = 32;

  private get SvgHeight(): number {
    return Math.max(this.Height - this.margin * 2, 10);
  }
  private get SvgWidth(): number {
    return Math.max(this.Width - this.margin * 2, 10);
  }

  private initHistogram(): void {
    this.slHistogramSvg = $('<svg id="sl-histogram-svg" />');
    this.histogramContainer.append(this.slHistogramSvg);
    this.svg = d3.select(this.slHistogramSvg[0]);
    this.svg.attr('width', this.Width);
    this.svg.attr('height', this.Height);

    this.chart = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin * 1.5},${this.margin})`);

    this.chart.append('g')
      .attr('id', 'axis-left');

    this.chart.append('g')
      .attr('id', 'axis-bottom');
  }

  public updateNoiseBars(): void {        
    SectorLengthHistogramWidget.initNoiseProbability = +this.noiseProbabilityInputField.val();
    this.noiseProbabilityTextField
        .html(`Noise Probability: p = ${SectorLengthHistogramWidget.initNoiseProbability}`);
    this.updateSvgGroup(this.noiseBars, true);
  }

  private resizeHistogram(): void {
    if (this.svg) {
      try {
        this.svg.attr('width', this.Width);
        this.svg.attr('height', this.Height);
  
        this.updateScales(this.currentSLDist);
  
        if (this.currentSldDistMax >= 1000000) {
          this.chart.select('#axis-left')
          .call(d3.axisLeft(this.histYScale).tickFormat(d3.format(`.1e`)));
        } else {
          this.chart.select('#axis-left')
          .call(d3.axisLeft(this.histYScale));
        }
        this.chart.select('#axis-bottom')
          .attr('transform', `translate(0, ${this.SvgHeight})`)
          .call(d3.axisBottom(this.histXScale));
  
        this.updateSvgGroup(this.bars);
        this.updateSvgGroup(this.noiseBars, true);
        this.updateSvgGroup(this.barLabels, false, true);
      } catch (e) {
        console.log('Width of HistogramWidget could not be accessed');
      }
    }
  }

  private updateSvgGroup(group, streched: boolean = false, centered: boolean = false): void {
    if (group && this.histXScale && this.histYScale) {      
      this.updateScales(this.currentSLDist);
      group
        .attr('x', (s, i) => this.histXScale(i + '') + (centered ? this.histXScale.bandwidth() / 2 : 0))
        .attr('y', (s, i) => this.histYScale(streched ? this.getStretchFactor(i) * s : s) - (centered ? 5 : 0))
        .attr('height', (s, i) => this.SvgHeight - this.histYScale(streched ? this.getStretchFactor(i) * s : s))
        .attr('width', this.histXScale.bandwidth());
    }
  }

}
