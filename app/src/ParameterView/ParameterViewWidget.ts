import 'bootstrap';
import $ from 'jquery';
import { connectionError, didFailToFetch } from '../@types/ErrorMessage';
import Layout from '../Layout/Layout';
import CustomWidget, { Observer } from '../Layout/CustomWidget';
import './style.css';
import ParameterViewSettings from './ParameterViewSettings';
import { Graph } from '../GraphVisualization/GraphVisTypes';
import GraphVisualizationWidget from '../GraphVisualization/GraphVisualizationWidget';
import { GraphTemplates } from '../GraphVisualization/GraphTemplates';

class ParameterViewWidget extends CustomWidget {
  private myLayout: Layout;
  private graphWidget: GraphVisualizationWidget;
  private parameterDiv: JQuery<HTMLDivElement>;
  private userInterface: JQuery<HTMLDivElement>;

  protected resetButton: JQuery<HTMLButtonElement>;
  protected saveButton: JQuery<HTMLButtonElement>;

  protected numberOfVerticesInputField: JQuery<HTMLInputElement>;
  protected edgeProbabilityInputField: JQuery<HTMLInputElement>;
  protected edgeProbabilityTextField: JQuery<HTMLDivElement>;

  protected loadGraphButton: JQuery<HTMLButtonElement>;

  private graphTemplatesList: JQuery<HTMLUListElement>;

  private static initVertices: number = 12;
  private static initEdgeProbability: number = 0.5;

  constructor(layout: Layout) {
    super('parameter-ui', 'Load a Predefined Graph');
    this.myLayout = layout;
    this.graphWidget = layout.GraphVisWidget;
    this.title.closable = false;
    this.settings = new ParameterViewSettings(this);
  }

  public setGraphWidget(graphWidget: GraphVisualizationWidget): void {
    this.graphWidget = graphWidget;
  }

  protected createNodes(): void {
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
      ) as JQuery<HTMLDivElement>;

    this.container.empty();
    this.initUI();
  }

  private initUI(): void {
    this.graphTemplatesList = $('<ul class="list-group"></ul>').appendTo(
      this.container
    ) as JQuery<HTMLUListElement>;

    this.parameterDiv =
      $('<div />').addClass('parameter-view').appendTo(this.container) as JQuery<HTMLDivElement>;

    this.userInterface =
      $('<div />').addClass('ui-buttons').appendTo(this.parameterDiv) as JQuery<HTMLDivElement>;

    this.resetButton = $(`<button type="button" class="btn btn-outline-danger btn-sm">${('Reset')}</button>`).appendTo(
      this.userInterface) as JQuery<HTMLButtonElement>;

    this.resetButton.on('click', () => {
      this.graphWidget.reset();
    });

    const maxNodes: number = 100;
    this.numberOfVerticesInputField = $(`<input min="1" max="${maxNodes}" id="vertices-parameter" class="btn btn-sm btn-outline-secondary" value="${ParameterViewWidget.initVertices}" />`)
      .appendTo(this.userInterface) as JQuery<HTMLInputElement>;

    this.numberOfVerticesInputField.on('change paste keyup', d => {
      ParameterViewWidget.initVertices = Math.min(+this.numberOfVerticesInputField.val(), maxNodes);
      if (d.which === 38) { // ARROW UP
        ParameterViewWidget.initVertices = Math.min(+this.numberOfVerticesInputField.val() + 1, maxNodes);
      } else if (d.which === 40) { // ARROW DOWN
        ParameterViewWidget.initVertices = Math.max(+this.numberOfVerticesInputField.val() - 1, 1);
      }
      if (isNaN(ParameterViewWidget.initVertices)){
        this.numberOfVerticesInputField.val(12);
      } else {
        this.numberOfVerticesInputField.val(ParameterViewWidget.initVertices);
      }

      if (d.which === 13) { // ENTER
        this.graphWidget.setGraphData(this.graph2load(ParameterViewWidget.initVertices));
        this.graphWidget.initGraphSVG();
      }
    });

    this.loadGraphButton = $(`<button type="button" class="btn btn-outline-dark btn-sm graph-button">${('Load Graph')}</button>`).appendTo(
      this.userInterface) as JQuery<HTMLButtonElement>;

    this.loadGraphButton.on('click', () => {
      this.graphWidget.setGraphData(this.graph2load(ParameterViewWidget.initVertices));
      this.graphWidget.initGraphSVG();
    });

    this.edgeProbabilityTextField =
      $(`<span id="edge-probability-text">Edge Probability: p = 0.5</span>`)
        .addClass('btn btn-sm')
        .appendTo(this.userInterface) as JQuery<HTMLDivElement>;

    this.edgeProbabilityInputField = $(`<input id="edge-probability-range" type="range" class="sld" min="0" max="1" step="0.01" value="${ParameterViewWidget.initEdgeProbability}" />`)
      .appendTo(this.userInterface) as JQuery<HTMLInputElement>;

    this.edgeProbabilityInputField.css('display', 'none');
    this.edgeProbabilityTextField.css('display', 'none');

    this.edgeProbabilityInputField.on('input', d => {
      ParameterViewWidget.initEdgeProbability = +this.edgeProbabilityInputField.val();
      this.edgeProbabilityTextField.html('Edge Probability: p = ' + ParameterViewWidget.initEdgeProbability);
      GraphTemplates.probability = ParameterViewWidget.initEdgeProbability;
    });

    this.createGraphTemplatesList(GraphTemplates.All);

    this.graph2load = GraphTemplates.CompleteGraph;
  }

  private createGraphTemplatesList(graphTemplates: ((vertices: number, start?: number) => Graph)[]): void {
    graphTemplates.forEach((graph: (vertices?: number) => Graph) => {
      const graphTemplate: JQuery<HTMLDivElement> = $(
        '<div class="list-group-item list-group-item-action flex-column align-items-start"></div>'
      );
      const graphHeadline: JQuery<HTMLHeadingElement> = $(`<h6>${graph().title}</h6>`);

      const graphItemContainer: JQuery<HTMLDivElement> = $('<div />').append(
        graphHeadline
      ) as JQuery<HTMLDivElement>;

      graphTemplate.append(graphItemContainer);

      graphHeadline.css('lineHeight', 0.5);
      graphHeadline.css('margin-bottom', 0);

      graphTemplate
        .addClass(
          false ? 'list-group-item-primary' : null
        )
        .click(
          async (event: JQuery.ClickEvent<HTMLElement, null, HTMLElement, HTMLElement>) => {
            $('.list-group-item').removeClass('list-group-item-primary');
            graphTemplate.addClass('list-group-item-primary');

            this.edgeProbabilityInputField.css('display', graph.name === 'Random' ? 'block' : 'none');
            this.edgeProbabilityTextField.css('display', graph.name === 'Random' ? 'block' : 'none');

            return await this.onGraphTemplateSelected(event.target, graph);
          }
        )
        .appendTo(this.graphTemplatesList);
    });

    this.graphTemplatesList.css('margin-bottom', 5);
  }

  private async onGraphTemplateSelected(selectedListElement: HTMLElement, graph:
    ((vertices: number, start?: number) => Graph)): Promise<void> {
    this.graph2load = graph;
  }

  private graph2load: ((vertices: number, start?: number) => Graph);

  protected onAfterAttach(): void {
    this.render();
  }

  protected async renderContents(): Promise<void> {
    this.settings.render();
  }

  protected showError(message: string): void {
    if (didFailToFetch(message)) {
      message = connectionError;
    }

    $(
      `<div class="alert alert-danger fade show" role="alert">
        ${message}
      </div>`
    ).prependTo(this.container);
  }
}

export { ParameterViewWidget as default };
