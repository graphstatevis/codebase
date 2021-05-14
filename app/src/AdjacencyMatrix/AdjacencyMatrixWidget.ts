import $ from 'jquery';
import * as d3 from 'd3';
import './style.css';
import GraphVisualizationWidget from '../GraphVisualization/GraphVisualizationWidget';
import Layout from '../Layout/Layout';
import CustomWidget from '../Layout/CustomWidget';
import { Widget } from '@phosphor/widgets';
import { IMessageHandler } from '@phosphor/messaging';
import ResizeMessage = Widget.ResizeMessage;
import Matrix from 'ml-matrix';

export default class AdjacencyMatrixWidget extends CustomWidget implements IMessageHandler {
  private static readonly widgetID: string = 'adjacency-matrix-widget';
  public static readonly adjacencyMatrixContainerId: string = 'adjacency-matrix-div';
  private static readonly tableID: string = 'adjacency-matrix-table';
  public static readonly cellPrefix: string = 'am-cell-edge-';

  private adjacencyMatrixContainer: JQuery<HTMLDivElement>;
  private graphVis: GraphVisualizationWidget;

  static get WidgetID(): string {
    return this.widgetID;
  }

  constructor(layout: Layout) {
    super(AdjacencyMatrixWidget.WidgetID, 'Adjacency Matrix');
    this.graphVis = layout.GraphVisWidget;
  }

  protected async renderContents(): Promise<void> {
    //
  }

  protected prepareNextRender(): void {
    super.prepareNextRender();

  }

  public setGraphVis(graphVisualizationWidget: GraphVisualizationWidget) {
    this.graphVis = graphVisualizationWidget;
  }

  protected onResize(msg: ResizeMessage): void {
    // this.resizeHistogram();
  }

  protected createNodes(): void {
    super.createNodes();

    this.container.empty();

    this.adjacencyMatrixContainer = $('<div />')
      .attr('id', AdjacencyMatrixWidget.adjacencyMatrixContainerId)
      .attr('class', 'ui-widget-content')
      .appendTo(this.container) as JQuery<HTMLDivElement>;

    setTimeout(() => {
      this.initAdjacencyMatrix();
      this.initializeTableZoom();
    }, 500);
  }

  private currentCellFontSize: number;

  private initializeTableZoom(): void {
    const minFontSize: number = 3;
    const maxFontSize: number = 30;
    const diff: number = 2;
    const elem: string = '#adjacency-matrix-table thead tr th,#adjacency-matrix-table tbody tr td';
    d3.select(`#${AdjacencyMatrixWidget.adjacencyMatrixContainerId}`)
      .on('wheel', e => {        
        const elems = d3.selectAll(elem);
        // tslint:disable-next-line:radix
        let currentFontSize: number = parseInt(elems.style('font-size'));
        if (d3.event.wheelDelta > 0 || d3.event.deltaY < 0) { // zoomIn
          currentFontSize += diff;
          this.currentCellFontSize = currentFontSize > maxFontSize ? maxFontSize : currentFontSize;
        } else {
          currentFontSize -= diff;
          this.currentCellFontSize = currentFontSize < minFontSize ? minFontSize : currentFontSize;
        }
        elems.style('font-size', `${this.currentCellFontSize}px`)
              .style('width', `${this.currentCellFontSize * 1.5}px`)
              .style('height', `${this.currentCellFontSize * 1.5}px`);
      });    
  }

  public highlightVertex(id: number, color: string): void {
    if (id > 0) {
      d3.select(`#id-${id} circle`)
        .transition()
        .attr('fill', color);
    }
  }

  public updateMatrix(matrix: Matrix): void {
    const self = this;
    this.currentAdjMatrix = matrix;
    this.table.selectAll('*').remove();

    if (!matrix) return;

    const thead = this.table.append('thead');
    const	tbody = this.table.append('tbody');

    const cols = Array.from(Array(matrix.columns), (_, i) => (i + 1));
    cols.unshift(0);

    // append the header row
    thead.append('tr')
      .selectAll('th')
      .data(cols).enter()
      .append('th')
      .style('font-size', `${this.currentCellFontSize}px`)
      .style('width', `${this.currentCellFontSize * 1.5}px`)
      .style('height', `${this.currentCellFontSize * 1.5}px`)
      .attr('class', 'table-vertex')
      .on('mouseover', d => {
        this.highlightVertex(d, 'red');
      }).on('mouseout',  d => {
        this.highlightVertex(d, 'white');
      })
      .on('contextmenu', d => {
          this.graphVis.nodeContextMenu({id: d});
      })
      .text(column => column > 0 ? column : '');

    const data = [];

    for (let i = 0; i < matrix.rows; i++) {
      const row = matrix.getRow(i);
      row.unshift((i + 1));
      data.push(row);
    }

    const rows = tbody.selectAll('tr')
      .data(data)
      .enter()
      .append('tr');

    // create a cell in each row for each column
    const cells = rows.selectAll('td')
      .data((row, i) => {
        return cols.map(column => {
          return {
            column,
            rowIndex: i + 1,
            value: row[column]
          };
        });
      })
      .enter()
      .append('td')
      .attr('id', d => `${AdjacencyMatrixWidget.cellPrefix}${d.rowIndex}-${d.column + 1}`)
      .attr('class', d => d.column < 1 ? 'table-vertex' : '')
      .attr('edge', d => `${d.rowIndex}-${d.column + 1}`)
      .style('font-size', `${this.currentCellFontSize}px`)
      .style('width', `${this.currentCellFontSize * 1.5}px`)
      .style('height', `${this.currentCellFontSize * 1.5}px`)
      .text(d => d.column !== d.rowIndex ? d.value : '')
      .style('background-color', d => {
        if (d.column !== d.rowIndex) {
          if (d.column > 0) {
            return d.value < 1 ? '#faa' : '#afa';
          }
        } else {
          return '#aaa';
        }
      }).on('mouseover', function(d) {
        const cell = d3.select(this);
        if (d.column !== d.rowIndex) cell.style('cursor', 'pointer');
        if (d.column > 0) {
          d3.select(`#edge-${d.column}-${d.rowIndex}, #edge-${d.rowIndex}-${d.column}`)
            .transition()
            .attr('stroke', 'red');
        } else {
          self.highlightVertex(d.rowIndex, 'red');
        }
      }).on('mouseout',  function(d) {
        if (d.column > 0) {
          const cell = d3.select(this);
          cell.style('cursor', null);

          d3.select(`#edge-${d.column}-${d.rowIndex}, #edge-${d.rowIndex}-${d.column}`)
            .transition()
            .attr('stroke', '#333');
        } else {
          self.highlightVertex(d.rowIndex, 'white');
        }
      }).on('click', d => {
        if (d.column !== d.rowIndex) {
          if (d.column > 0) {
            const source = d.rowIndex;
            const target = d.column;
            if (this.graphVis.isNeighbor(source, target)) {
              this.graphVis.deleteEdge({ source, target });
            } else {
              this.graphVis.addNewEdge(source, target);
            }
          }
        }
      }).on('contextmenu', d => {
        if (d.column !== d.rowIndex) {
          if (d.column > 0) {
            const source = d.rowIndex;
            const target = d.column;
            if (this.graphVis.isNeighbor(source, target)) {
              this.graphVis.edgeContextMenu({source, target});
            }
          } else {
            this.graphVis.nodeContextMenu({id: d.rowIndex});
          }
        }
      });
  }

  private AMTable: JQuery<HTMLElement>;
  private table: d3.Selection<HTMLElement, unknown, null, undefined>;
  private currentAdjMatrix: Matrix;

  private initAdjacencyMatrix(): void {
    this.AMTable = $(`<table id="${AdjacencyMatrixWidget.tableID}" />`);
    this.adjacencyMatrixContainer.append(this.AMTable);
    this.table = d3.select(this.AMTable[0]);
  }
}
