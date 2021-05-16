/* tslint:disable:no-console */
import './style.css';
import { IMessageHandler } from '@phosphor/messaging';
import DistillIcon from '../../assets/images/chemistry.png';
import $ from 'jquery';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import * as d3 from 'd3';
import contextMenuFactory from 'd3-context-menu';
import { Widget } from '@phosphor/widgets';
import Layout from '../Layout/Layout';
import CustomWidget, { Observer } from '../Layout/CustomWidget';
import ResizeMessage = Widget.ResizeMessage;
import { Helper } from '../Helper/Helper';
import Point from '../Entities/Point';
import Matrix from 'ml-matrix';
import SectorLengthHistogramWidget from '../SectorLengthHistogram/SectorLengthHistogramWidget';
import GlobalNoiseWidget from '../GlobalNoise/GlobalNoiseWidget';
import AdjacencyMatrixWidget from '../AdjacencyMatrix/AdjacencyMatrixWidget';
import { GraphTemplates } from './GraphTemplates';
import { SldCache, Dimensions, Graph, Edge, Node } from './GraphVisTypes';
import SectorLengthTableWidget from '../SectorLengthTable/SectorLengthTableWidget';
import {SectorLengthDistributionCache} from '../Helper/SectorLengthDistributionCache';
import {TimeHelper} from '../Helper/TimeHelper';

export interface GraphVisRenderedObserver extends Observer {
  onExplorationRendered(): Promise<void>;
}

export default class GraphVisualizationWidget extends CustomWidget implements IMessageHandler {
  private static readonly widgetID: string = 'graph-vis-widget';
  private static readonly svgID: string = 'graph-vis-svg';
  public static readonly graphContainerId: string = 'graph-vis-widget__div';
  public static zoomGroupId: string = 'zoomGroup';
  public static zoomingAreaId: string = 'zoomingArea';

  public static useCache: boolean = true;

  public static readonly graphIdRequestParam: string = 'graph';

  public static readonly noise1Color: string = '#4f4fff';
  public static readonly noise2Color: string = '#ff3a3f';
  public static readonly ideal1Color: string = '#888';
  public static readonly ideal2Color: string = '#444';
  public static readonly yellowColor: string = '#ffff00';

  static get WidgetID(): string {
    return this.widgetID;
  }

  protected observers: GraphVisRenderedObserver[];

  private sectorHistogramWidget: SectorLengthHistogramWidget;
  private globalNoiseWidget: GlobalNoiseWidget;
  private sectorLengthTableWidget: SectorLengthTableWidget;
  private AMWidget: AdjacencyMatrixWidget;

  private graphContainer: JQuery<HTMLDivElement>;

  private zoomToFitIcon: JQuery<HTMLImageElement>;
  private distillIcon: JQuery<HTMLImageElement>;  
  private saveGraphIcon: JQuery<HTMLImageElement>;
  private toggleSimulationIcon: JQuery<HTMLImageElement>;
  private toggleParityColoringIcon: JQuery<HTMLImageElement>;
  private shareUrlIcon: JQuery<HTMLImageElement>;

  private isZoomToFitIconVisible: boolean;
  private navigationIconsVisible: boolean;

  private zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomRectangle: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomingArea: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomer: d3.ZoomBehavior<Element, any>;
  private zoomPadding: number;

  private graphSvg: JQuery<HTMLElement>;
  private graphData: Graph;
  private graphMetaDataLabel;
  private graphLinks: number[][];

  private visEdgesGroup;
  private visNodesGroup;
  private visEdge;
  private visNode;

  private simulation: d3.Simulation<any, undefined>;

  private transitionTime: number = 500;

  constructor(
    layout: Layout
  ) {
    super(GraphVisualizationWidget.WidgetID, 'Graph State Visualization');
    this.sectorHistogramWidget = layout.SectorHistogram;
    this.globalNoiseWidget = layout.GlobalNoise;
    this.sectorLengthTableWidget = layout.SectorLengthTab;
    this.AMWidget = layout.AdjacencyMatrixWidget;
    
    this.zoomPadding = 0.7;
    this.AMWidget.setGraphVis(this);
    layout.ParameterWidget.setGraphWidget(this);
    // @ts-ignore
    window.gvw = this;
  }

  get IsRendered(): boolean {
    return this.isRendered;
  }

  protected onResize(msg: ResizeMessage): void {
    d3.select(`#graph-vis-svg`)
      .attr('width', this.Width)
      .attr('height', this.Height);
  }

  get Container(): JQuery<HTMLDivElement> {
    return this.container;
  }

  // DM: Remove this?
  private InitMatrix(): void {
    this.graphLinks = [];
    this.graphLinks.push([0, 1, 1, 1, 0]);
    this.graphLinks.push([1, 0, 0, 1, 0]);
    this.graphLinks.push([1, 0, 0, 1, 1]);
    this.graphLinks.push([1, 1, 1, 0, 1]);
    this.graphLinks.push([0, 0, 1, 1, 0]);
  }

  private forceLock: boolean = false;

  private toggleLock(): void {
    this.forceLock = !this.forceLock;
    const lock = d3.select(`#graph-vis-widget__toggle-simulation`);
    if (this.forceLock) {
      lock.html('lock');
      this.simulation.alphaTarget(0)
        .stop();
    } else {
      lock.html('lock_open');
      this.simulation
        .alphaTarget(0.1)
        .restart();
    }
    // this.updateGraph(false);
  }

  protected createNodes(): void {
    super.createNodes();

    this.container.empty();

    this.toggleSimulationIcon = $(`<i class="material-icons">${this.forceLock ? 'lock' : 'lock_open'}</i>`)
      .attr('id', 'graph-vis-widget__toggle-simulation')
      .addClass('disable-select')
      .click(() => {
        this.toggleLock();            
      })
      .tooltip({ placement: 'right', title: ('Lock / Unlock Force') })
      .prependTo(this.container) as JQuery<HTMLImageElement>;

    this.toggleSimulationIcon.css('display', 'block');

    this.zoomToFitIcon = $('<i class="material-icons">zoom_out_map</i>')
      .attr('id', 'graph-vis-widget__zoom_out-icon')
      .addClass('disable-select')
      .click(() => {
        this.zoomToFitContent();            
      })
      .tooltip({ placement: 'right', title: ('Zoom to Fit') })
      .prependTo(this.container) as JQuery<HTMLImageElement>;

    this.graphMetaDataLabel = d3.select(this.container[0])
      .append('div')
      .attr('id', 'graph-meta-data');

    this.saveGraphIcon = $('<i class="material-icons">save_alt</i>')
        .attr('id', 'graph-vis-widget__save_graph-icon')
        .addClass('disable-select')
        .click(() => {
          // ADD ' ' around the ID
          this.copyToClipboard(`'${this.graphIdFromGraph()}'`);
          alert(`GraphID '${this.graphIdFromGraph()}' has been copied to your clipboard.`);
        })
        .tooltip({ placement: 'right', title: ('Copy Graph ID') })
        .prependTo(this.container) as JQuery<HTMLImageElement>;

    this.shareUrlIcon = $('<i class="material-icons">link</i>')
        .attr('id', 'graph-vis-widget__share_url-icon')
        .addClass('disable-select')
        .click(() => {
          // createUrl from Base URL with current graphId as request parameter
          this.shareGraphViaUrl(`${this.graphIdFromGraph()}`);
        })
        .tooltip({ placement: 'right', title: ('Copy URL of this Graph') })
        .prependTo(this.container) as JQuery<HTMLImageElement>;

    this.toggleParityColoringIcon = $(`<i class="material-icons">brush</i>`)
        .attr('id', 'graph-vis-widget__toggle-parity-coloring')
        .css('display', 'block')
        .addClass('disable-select')
        .click(() => {
          this.toggleParityColoring();
        })
        .tooltip({ placement: 'right', title: ('Parity Coloring') })
        .appendTo(this.container) as JQuery<HTMLImageElement>;

    this.distillIcon = $(`<i class=""><img src="${DistillIcon}"/></i>`)
      .attr('id', 'distillation__icon')
      .addClass('disable-select')
      .click(() => {
        this.toggleDistillColoring();
      })
      .tooltip({ placement: 'right', title: 'Distillation' })
      .appendTo(this.container) as JQuery<HTMLImageElement>;

    this.graphContainer = $('<div />')
      .attr('id', GraphVisualizationWidget.graphContainerId)
      .appendTo(this.container) as JQuery<HTMLDivElement>;

    this.positionIconsProperly();
  }

  private get Width(): number {
    return Math.max($(`#${GraphVisualizationWidget.graphContainerId}`).width(), 400);
  }

  private get Height(): number {
    return Math.max($(`#${GraphVisualizationWidget.graphContainerId}`).height(), 300);
  }

  public shareGraphViaUrl = graphId => {
    let url: string = `${window.location.origin}?${GraphVisualizationWidget.graphIdRequestParam}=${graphId}`;
    this.copyToClipboard(`${url}`);
  };

  public copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  private resetGraphData(): void {
    // Overall Data Object
    this.graphData = {
      edges: [],
      nodes: [],
      title: '',
    };
  }

  public setGraphData(graph: Graph): void {    
    if (this.parityColoring) {      
      this.parityColoring = false;     
      this.updateParityColoring();
    }
    this.graphData = graph;
  }

  public loadGraphFromId(graphId: string): void {
    const graphNodesHexId: string[] = graphId.split('_');
    const numNodes: number = +graphNodesHexId[0];
    const binaryResult = this.hexToBinary(graphNodesHexId[1]);

    if (!binaryResult.valid) {
      console.log(`ERROR - could not load graph from graphID`, graphId);
    } else {
      let binaryString: string = binaryResult.result;
      const loadGraph: Graph = {
        edges : [],
        nodes: [],
        parameterized: false,
        title: graphId
      };

      const numberOfPotentialEdges = (numNodes * (numNodes - 1) / 2);

      if (binaryString.length > numberOfPotentialEdges) {
        binaryString = binaryString.substring(binaryString.length - numberOfPotentialEdges);
      } else if (binaryString.length < numberOfPotentialEdges) {
        let prefix = '';
        for (let i = 0; i < numberOfPotentialEdges - binaryString.length; i++) {
          prefix += '0';
        }
        binaryString = prefix + binaryString;
      }

      // Initialize Edges
      let pos = 0;
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          if (binaryString[pos++] === '1') {
            loadGraph.edges.push({
              optionalLabel: 'Optional Edge Label',
              source: i + 1,
              target: j + 1,
              weight: 1
            });
          }
        }
      }

      // Initialize Nodes
      for (let index = 1; index <= numNodes; index++) {
        loadGraph.nodes.push({
          id: index,
          optionalLabel: 'Optional Node Label'
        });
      }

      this.setGraphData(loadGraph);
    }
  }

  public updateBrowserURL(): void {
    const cacheParam = GraphVisualizationWidget.useCache ? '' : '&cache=no';

    window.history.pushState({}, null,
        `?${GraphVisualizationWidget.graphIdRequestParam}=${this.graphIdFromGraph()}${cacheParam}`);
  }

  public get Graph(): Graph {
    return this.graphData;
  }

  private parityColoring: boolean = false;
  private distillColoring: boolean = false;
  private saveGraphIconVisible: boolean = false;
  private shareUrlIconVisibile: boolean = false;
  private distillIconVisible: boolean = false;

  /**
   * DistillColoring
   */
  public toggleDistillColoring(): void {
    this.distillColoring = !this.distillColoring;
    this.updateDistillColoring();
  }

  private updateDistillColoring(): void {
    if (this.distillColoring) {
      this.parityColoring = false;
      this.resetNodeColoring();
      const e = this.localDistillation.edge;
      this.colorNode(e.source, GraphVisualizationWidget.yellowColor);
      this.colorNode(e.target, GraphVisualizationWidget.yellowColor);
    } else {
      this.resetNodeColoring();
    }
  }

  /**
   * Parity
   */
  public toggleParityColoring(): void {
    this.parityColoring = !this.parityColoring;
    this.updateParityColoring();
  }

  private colorNode(nodeId: number, color: string): void {
    d3.select(`#node-${nodeId} circle`)
      .transition()
      .attr('fill', GraphVisualizationWidget.yellowColor);
  }

  private resetNodeColoring(): void {
    d3.selectAll('.node circle')
      .transition()
      .attr('fill', 'white');
  }

  private updateParityColoring(): void {
    if (this.parityColoring) {
      this.distillColoring = false;
      this.Nodes.forEach(node => {
        this.colorNodeParity(node.id);
      });
    } else {
      this.resetNodeColoring();
    }
  }

  private colorNodeParity(nodeId): void {
    const l = this.getNeighbors(nodeId).length;
    d3.select(`#node-${nodeId} circle`)
      .transition()
      .attr('fill', l % 2 !== 0 ?
        GraphVisualizationWidget.noise1Color : GraphVisualizationWidget.noise2Color);
  }

  public initGraphSVG(withTimeout: boolean = true): void {
    d3.select(`#${GraphVisualizationWidget.svgID}`).remove();
    const self = this;

    this.graphSvg = $(`<svg id="${GraphVisualizationWidget.svgID}" />`);
    this.graphContainer.append(this.graphSvg);
    const svg = d3.select(this.graphSvg[0]);

    this.zoomGroup = svg.append('g').attr('id', GraphVisualizationWidget.zoomGroupId);
    this.zoomRectangle = this.zoomGroup.append('rect')
      .attr('id', 'zoomRectangle')
      .attr('x', '0').attr('y', '0')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('contextmenu', () => {
        this.canvasContextMenu();
      })
      .on('mousemove', () => {
        const zoomAreaTransform = d3.zoomTransform(this.zoomingArea.node());
        //
      });

    this.zoomingArea = this.zoomGroup.append('g')
      .attr('id', GraphVisualizationWidget.zoomingAreaId);

    // Define SVG Dimensions
    svg.attr('width', this.Width);
    svg.attr('height', this.Height);

    // VISUELL
    self.visEdgesGroup = self.zoomingArea
      .append('g')
      .attr('class', 'edges')
      .attr('stroke-opacity', 0.6);

    // create a nesting group for each node
    self.visNodesGroup = self.zoomingArea
      .append('g')
      .attr('class', 'nodes');

    this.createGraph();
    this.updateGraph();
    this.initNodes(this.visNode);

    this.simulation.on('tick', () => {
      this.visEdge
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      this.visNode.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    const scale = d3.scaleOrdinal(d3.schemeCategory10);
    const coloring = d => scale(d.group);

    const zooming = () => {
      try {
        this.zoomingArea.attr('transform', d3.event.transform);
      } catch (e) {
        console.log(d3.event.transform, 'not working - be patient');
      }
    };

    this.zoomer = d3.zoom().scaleExtent([0.01, 10])
      .on('start', d => {
        if (!d3.event.sourceEvent) return;
        if (d3.event.sourceEvent.type === 'mousedown') {
          d3.select('#zoomRectangle').style('cursor', 'grabbing');
        } else if (d3.event.sourceEvent.type === 'wheel') {
          if (d3.event.sourceEvent.wheelDeltaY < 0) {
            d3.select('#zoomRectangle').style('cursor', 'zoom-out');
          } else {
            d3.select('#zoomRectangle').style('cursor', 'zoom-in');
          }
        }
      })
      .on('zoom', zooming)
      .on('end', d => {
        d3.select('#zoomRectangle').style('cursor', 'grab');
      });

    this.zoomGroup.call(this.zoomer);
    this.zoomGroup.on('dblclick.zoom', null);

    if (this.tooManyNodesForSLD() && withTimeout) {
      this.updateDistillationWithoutSLD(withTimeout);
    } else {
      this.updateSLHistogram(withTimeout);
    }

    if (this.parityColoring) {
      this.parityColoring = false;
      this.toggleParityColoring();
    }
  }

  public reset(): void {
    this.resetGraphData();
    this.initGraphSVG();
    this.createNode(Helper.array2Point([250, 250]));
  }

  private tryParseJSON(json, cnsl = false, name = '__') {
    if (cnsl) {
      console.log(name, json);
    }

    return JSON.parse(json);
  }

  private canvasContextMenu(): void {
    const menuSettings = [];
    menuSettings.push({
      action: (d, i) => {
        this.createNode(Helper.array2Point(d3.mouse(this.zoomingArea.node())));
      },
      disabled: false,
      title: 'Create Vertex'
    });

    contextMenuFactory(menuSettings)();
  }

  private visited = []; // global array used for components() and dfs()

  private graphComponents: Graph[] = [];

  private get components(): number {
    let count = 0;
    this.visited = []; // delete bool array
    this.graphComponents = [];

    // computes the number of connected components
    for (let i = 1; i <= this.N; i++) { this.visited.push(false); }
    
    let componentIndex = 0;

    // At the start, no vertex has been visited.
    for (let i = 1; i <= this.N; i++) {
      if (!this.visited[i - 1]) {
        const newGraphComponent = {
          edges: [],
          nodes: [{
            id: i
          }],
          title: `comp-${componentIndex++}`
        };
        count += 1;  // new connected component starts here
        this.graphComponents.push(this.dfs(i, newGraphComponent));
      }
    }
    
    return count;
  }

  private dfs(i: number, comp: Graph): Graph {
    // depth first search
    this.visited[i - 1] = true;
    for (let j = 1; j <= this.N; j++) {
      if (this.isNeighbor(i, j) && i < j) {
        comp.edges.push({
          source: i,
          target: j
        });
      }
      // loop through all neighbors of i which have not been visited so far
      if (this.isNeighbor(i, j) && !this.visited[j - 1]) {
        comp.nodes.push({
          id: j,
        });
        if (!this.visited[j - 1]) this.dfs(j, comp);
      }
    }
    
    return comp;
  }

  private get cycles(): number {
    // The number of cycles b2 follows from the Euler characteristic of the graph: chi = V-E = b1-b2
    return this.components + this.Edges.length - this.N;
  }

  private AdjacencyMatrix(graph: Graph = null): Matrix {
    if (graph == null) {
      graph = this.graphData;
    }
    const N: number = graph.nodes.length;

    if (N < 1) return;    

    const matrix = new Matrix(N, N);
    const nodeIds = graph.nodes.map(d => d.id);

    graph.edges.forEach(e => {
      const sourceIndex = nodeIds.indexOf(e.source);
      const targetIndex = nodeIds.indexOf(e.target);
      matrix.set(sourceIndex, targetIndex, e.weight ? e.weight : 1);
      matrix.set(targetIndex, sourceIndex, e.weight ? e.weight : 1);
    });

    return matrix;
  }

  private updateNoises(forceSLD: boolean = false): void {
    if (this.tooManyNodesForSLD() && !forceSLD) {
      this.globalNoiseWidget.updateNoises([null, null, `???`, `???`, null, this.localDistillation.p]);
    } else {
      this.globalNoiseWidget.updateNoises([this.globalPPT, this.globalWitnessGME, this.localShadow,
        this.localNsec, this.localNsecSemi, this.localDistillation.p]);
    }
  }

  public updateSLHistogram(withTimeout: boolean = true): void {
    if (withTimeout) {
      setTimeout(() => {
        this.sectorLengthTableWidget.updateSLDTable(this.SLDistribution());
        this.sectorHistogramWidget.updateHistogram(this.SLDistribution());
        this.updateNoises(true);
      }, 10);
    } else {
      this.sectorLengthTableWidget.updateSLDTable(this.SLDistribution());
      this.sectorHistogramWidget.updateHistogram(this.SLDistribution());
      this.updateNoises(true);
    }

  }

  private updateDistillationWithoutSLD(withTimeout: boolean = true): void {
    if (withTimeout) {
      setTimeout(() => {
        this.sectorHistogramWidget.toggleSldHistogram(false);
        this.sectorLengthTableWidget.toggleSldTable(false);
        this.updateNoises();
      }, 10);
    } else {
      this.sectorHistogramWidget.toggleSldHistogram(false);
      this.sectorLengthTableWidget.toggleSldTable(false);
      this.updateNoises();
    }

  }

  public isSldCached(graph: Graph = null): boolean {
    if (graph == null) {
      graph = this.graphData;
    }
    
    return this.sldCache[this.graphIdFromGraph(graph)] !== undefined;
  }

  public getSldCache() {
    return this.sldCache;
  }

  private sldCache: SldCache = {};

  public arrayEquals(arr1, arr2): boolean {
    if (!arr1) {
        return false;
    }

    // compare lengths - can save a lot of time 
    if (arr2.length !== arr1.length) {
        return false;
    }

    for (let i = 0, l = arr2.length; i < l; i++) {
        // Check if we have nested arrays
        if (arr2[i] instanceof Array && arr1[i] instanceof Array) {
            // recurse into the nested arrays
            if (!arr2[i].equals(arr1[i])) {
                return false;
            }       
          // tslint:disable-next-line:triple-equals
        } else if (arr2[i] != arr1[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }

    return true;
  }

  // tslint:disable-next-line:cyclomatic-complexity
  private SLDistribution(graph: Graph = null): number[] {
    let mainGraph = false;
    if (graph == null) {
      graph = this.graphData;
      mainGraph = true;
    }

    const N: number = graph.nodes.length;

    const t0 = performance.now();
    if (N < 1) return [];
    const graphId: string = this.graphIdFromGraph(graph);

    if (this.sldCache[graphId] && GraphVisualizationWidget.useCache) {
      return this.sldCache[graphId];
    }

    let d = new Date().toTimeString();
    if (d.indexOf('(')) {
      d = d.substring(0, d.indexOf('(') - 1);
    }

    if (mainGraph) console.log(`>>> Time before loading SLD: ${d}  >>>`);

    let slDist: number[] = new Array(N + 1).fill(0);

    if (this.graphComponents.length === 1 || !mainGraph) {
      const adjMatr = this.AdjacencyMatrix(graph);
  
      for (let i = 0; i < Math.pow(2, N); i++) {
        const r: Matrix = this.dec2vec(i, graph);
        let s: Matrix = adjMatr.mmul(r);
        s = s.mod(2);
        slDist[this.swt2(r, s, graph)] += 1;
      }    
    } else {
      slDist[0] = 1;
      this.graphComponents.forEach((comp: Graph, i: number) => {
        const compSLD: number[] = this.SLDistribution(comp);
        while (compSLD.length <= this.N) {
          compSLD.push(0);
        }        
        const slDistTemp: number[] = new Array(this.N + 1).fill(0);
        for (let k = 0; k <= this.N; k++) {
          for (let j = 0; j <= k; j++) {
            slDistTemp[k] += slDist[k - j] * compSLD[j];
          } 
        }
        slDist = slDistTemp;                
      });      
    }

    // Overwrite cache in case it doesn't exist at all.
    let cacheIsIncorrectOrDoesntExist: boolean = true; 

    if (this.sldCache[graphId] && mainGraph) {
      cacheIsIncorrectOrDoesntExist = !this.arrayEquals(this.sldCache[graphId], slDist);      
      
      if (cacheIsIncorrectOrDoesntExist) {
        console.log(`ERROR: old cache differs from new computation!`);
      }        
    }

    this.sldCache[this.graphIdFromGraph(graph)] = slDist;

    if (mainGraph) console.log(`>>> SLD Performance: ${TimeHelper.msToTime(performance.now() - t0)}  >>>`);

    return slDist;
  }

  public graphIdFromGraph(graph: Graph = null): string {
    if (graph == null) {
      graph = this.graphData;
    }
    try {
      const adj: Matrix = this.AdjacencyMatrix(graph);
      let bitString: string = '';
      for (let row = 0; row < adj.columns; row++) {
        for (let col = row + 1; col < adj.getRow(row).length; col++) {
          bitString += adj.getRow(row)[col];
        }
      }

      // FOR OTHER CONVERSION DIRECTION (DEC -> BIN) WE NEED to check for leading zeros for some cases
      // in total it must be (n(n-1))/2 bits
      return `${this.N}_${this.binaryToHex(bitString).result}`;
    } catch (e) {
      console.log('error',e);
    }    
  }

  public binaryToHex(s) {
    // tslint:disable-next-line:one-variable-per-declaration
    let i, k, part, accum, ret = '';
    for (i = s.length - 1; i >= 3; i -= 4) {
      // extract out in substrings of 4 and convert to hex
      part = s.substr(i + 1 - 4, 4);
      accum = 0;
      for (k = 0; k < 4; k += 1) {
        if (part[k] !== '0' && part[k] !== '1') {
          // invalid character
          return { valid: false };
        }
        // compute the length 4 substring
        accum = accum * 2 + parseInt(part[k], 10);
      }
      if (accum >= 10) {
        // 'A' to 'F'
        ret = String.fromCharCode(accum - 10 + 'A'.charCodeAt(0)) + ret;
      } else {
        // '0' to '9'
        ret = String(accum) + ret;
      }
    }
    // remaining characters, i = 0, 1, or 2
    if (i >= 0) {
      accum = 0;
      // convert from front
      for (k = 0; k <= i; k += 1) {
        if (s[k] !== '0' && s[k] !== '1') {
          return { valid: false };
        }
        accum = accum * 2 + parseInt(s[k], 10);
      }
      // 3 bits, value cannot exceed 2^3 - 1 = 7, just convert
      ret = String(accum) + ret;
    }

    return { valid: true, result: ret };
  }

  // converts hexadecimal string to a binary string
  // returns an object with key 'valid' to a boolean value, indicating
  // if the string is a valid hexadecimal string.
  // If 'valid' is true, the converted binary string can be obtained by
  // the 'result' key of the returned object
  public hexToBinary(s) {
    let ret = '';
    // lookup table for easier conversion. '0' characters are padded for '1' to '7'
    const lookupTable = {
      0: '0000', 1: '0001', 2: '0010', 3: '0011', 4: '0100',
      5: '0101', 6: '0110', 7: '0111', 8: '1000', 9: '1001',
      a: '1010', b: '1011', c: '1100', d: '1101', e: '1110', f: '1111',
      // tslint:disable-next-line:object-literal-sort-keys
      A: '1010', B: '1011', C: '1100', D: '1101', E: '1110', F: '1111'
    };

    for (const character of s) {
      if (lookupTable.hasOwnProperty(character)) {
        ret += lookupTable[character];
      } else {
        return { valid: false };
      }
    }

    return { valid: true, result: ret };
  }

  // returns symplectic weight of two binary vectors
  private swt2(r: Matrix, s: Matrix, graph: Graph = null): number {
    if (graph == null) {
      graph = this.graphData;
    }

    let out = 0;
    for (let i = 0; i < graph.nodes.length; i++) {
      out += r.get(i, 0) || s.get(i, 0);
    }

    return out;
  }

  private dec2vec(dec: number, graph: Graph = null): Matrix {
    if (graph == null) {
      graph = this.graphData;
    }
    let sMask = '';
    // nMask must be between -2147483648 and 2147483647
    for (let nFlag = 0, nShifted = dec; nFlag < 32;
      nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1);

    sMask = sMask.slice(-graph.nodes.length);
    const vec: number[] = [];
    for (const [i, bit] of Helper.toEntries([...sMask])) {
      vec.push(+bit);
    }

    return Matrix.columnVector(vec);
  }

  private get N(): number {
    return this.Nodes.length;
  }

  private get globalPPT(): number {
    if (this.Edges.length > 0) {
      return 1 - 1 / (Math.pow(2, this.N - 1) + 1);
    } else {
      return 0;
    }
  }

  private get globalWitnessGME(): number {
    if (this.components === 1) {
      return 1 / 2 + 1 / (Math.pow(2, this.N + 1) - 2);
    } else {
      return 0;
    }
  }

  private get localNsec(): number {
    const slDist: number[] = this.SLDistribution();

    return 1 - Math.pow(slDist[this.N], -1 / (this.N * 2));
  }

  private get localNsecSemi(): number {
    const slDist: number[] = this.SLDistribution();
    const bound: number = Math.pow(2, this.N - 2) + (this.N % 2);

    return Math.max(0, 1 - Math.pow(bound / slDist[this.N], 1 / (this.N * 2)));
  }

  private get localShadow(): number {
    const slDist: number[] = this.SLDistribution();
    let pmin = 0;
    let pmax = 1;
    const eps = 0.00000000000001;
    while (pmax - pmin > eps) {
      const p = (pmin + pmax) / 2;
      let shadow = 0;
      for (let i = 0; i <= this.N; i++) {
        shadow += (this.N - i * 2) * slDist[i] * Math.pow(1 - p, i * 2);
      }
      if (shadow < 0) {// noise small enough
        pmin = p;
      } else {
        pmax = p;
      }
    }

    return pmin;
  }

  private get localDistillation(): any {
    if (this.Edges.length === 0) { return 0; }
    let pMin = 1;
    let edgeMin;
    for (const edge of this.graphData.edges) {
      const degSource = this.getNeighbors(edge.source).length;
      const degTarget = this.getNeighbors(edge.target).length;
      const p = Math.min(pMin, 1 - Math.pow(2, -2 / (degSource + degTarget + 2)));
      if (p < pMin) {
        pMin = p;
        edgeMin = edge;
      }
    }

    return {
      edge: edgeMin,
      p: pMin
    };
  }

  // Is the generic SL-Distribution a binomial distribution?
  private get shiftedBinomialParameter(): number {
    const slDist: number[] = this.SLDistribution();
    let expecationvalue = 0;
    for (let i = 0; i <= this.N; i++) {
      expecationvalue += slDist[i] * i;
    }

    return expecationvalue / Math.pow(2, this.N) / this.N;
  }

  private get singles(): number {
    // counts number of isolated vertices
    // return (3-4*this.shiftedBinomialParameter)*this.N;
    let out = 0;
    for (const [ind, node] of Helper.toEntries(this.graphData.nodes)) {
      if (this.getNeighbors(node.id).length === 0) {
        out++;
      }
    }

    return out;
  }

  private get leaves(): number {
    // counts number of leaves
    let out = 0;
    for (const [ind, node] of Helper.toEntries(this.graphData.nodes)) {
      if (this.getNeighbors(node.id).length === 1) {
        out++;
      }
    }

    return out;
  }

  private get twins(): number {
    /**
     * T=0
     * for i = 1 ... N
     * for j = i+1 ... N
     * twins = True
     * for k = 1... N
     * if k == i or k== j
     * skip
     * if not adj(i,k) == adj(j,k)
     * twins = False
     * if twins
     * T+=1
     * return T
     */

    let twinCount: number = 0;
    const matrix: Matrix = this.AdjacencyMatrix();

    for (let i = 0; i < this.N; i++) {
      for (let j = i + 1; j < this.N; j++) {
        let twins: boolean = true;
        for (let k = 0; k < this.N; k++) {
          if (k === i || j === k) {
            continue;
          }
          if (matrix.get(i, k) !== matrix.get(j, k)) {
            twins = false;
            break;
          }
        }
        if (twins) twinCount++;
      }
    }

    return twinCount;
  }

  private get rank(): number {
    const adjMatr = this.AdjacencyMatrix();

    return 0;
  }

  public edgeContextMenu(edge): void {
    const menuSettings = [{ title: `Edge ${edge.source}-${edge.target}` }];

    menuSettings.push({
      // @ts-ignore
      action: (d, i) => {
        this.deleteEdge(edge);
      },
      disabled: false, // Optional, defaults to false
      title: 'Delete Edge'
    } /*, {
      action: (d, i) => {
        console.log('Change Label');
      },
      disabled: false, // Optional, defaults to false
      title: 'Change Label'
    }*/);

    contextMenuFactory(menuSettings)();
  }

  private edgeExists(start, end): boolean {
    for (const [ind, val] of Helper.toEntries(this.graphData.edges)) {
      if (start === val.source && end === val.target) return true;
    }

    return false;
  }

  public deleteEdge(edge, update = true): void {
    for (const [ind, val] of Helper.toEntries(this.graphData.edges)) {
      if ((edge.source === val.source && edge.target === val.target)
        || edge.source === val.target && edge.target === val.source) {
        this.graphData.edges.splice(ind, 1);
        break;
      }
    }
    if (update) this.updateGraph();
  }

  public addNewEdge(source: number, target: number, update = true) {
    this.graphData.edges.push({ source, target, weight: 1 });
    if (update) this.updateGraph();

  }

  private updateGraph(updateSL = true): void {
    const self = this;

    const edges = this.graphData.edges.map(d => Object.create(d));

    self.visEdge = this.visEdgesGroup
      .selectAll('line')
      .data(edges)
      .join('line')
      .on('contextmenu', function() {
        const source: number = +d3.select(this).attr('source');
        const target: number = +d3.select(this).attr('target');
        self.edgeContextMenu({ source, target });
      })
      .attr('stroke', '#333')
      .attr('id', d => `edge-${d.source}-${d.target}`)
      .attr('source', d => d.source)
      .attr('target', d => d.target)
      .attr('stroke-width', 3);

    self.visEdge.append('title').text(d => d.optionalLabel);

    // @ts-ignore
    self.simulation.force('link').links(edges).id(d => d.id);

    self.visEdge
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    self.visNode = self.visNodesGroup
      .selectAll('.node')
      .data(self.simulation.nodes())
      .join('g')
      .attr('stroke', '#000')
      .attr('stroke-width', .5)
      .attr('class', 'node')
      .call(d3.drag().on('drag', fixdrag))
      // .call(drag(simulation))
      .attr('id', d => `node-${d.id}`)
      .attr('index', d => d.id)
      .on('contextmenu', d => {
        this.nodeContextMenu(d);
      })
      .on('click', function(d) {
        const vertex = d3.select(this);
        if (self.startNode !== null
          && vertex.attr('potential-neighbor') === 'yes') {
          self.addNewEdge(self.startNode, d.id);
          self.startNode = null;
          self.resetNodesColor();
        }
      });

    const drag = sim => {
      const dragstarted = d => {
        if (!d3.event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      };

      const dragged = d => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      };

      const dragended = d => {
        if (!d3.event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      };

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    };

    /* if (this.forceLock) {
      self.visNode
        .call(d3.drag().on('drag', fixdrag));
    } else {
      self.visNode
        .call(drag);
    } */

    self.visNode.exit().remove();

    function fixdrag(d) {
      d.x = d3.event.x, d.y = d3.event.y;
      d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
      self.visEdge.filter(l => l.source === d)
        .attr('x1', d.x).attr('y1', d.y);
      self.visEdge.filter(l => l.target === d)
        .attr('x2', d.x).attr('y2', d.y);
    }

    self.visNode.attr('transform', d => `translate(${d.x}, ${d.y})`);

    // tslint:disable-next-line:no-unused-expression
    this.components; // Need to initialize components

    if (updateSL && (!this.tooManyNodesForSLD() || (this.isSldCached() && GraphVisualizationWidget.useCache)) ) {
      this.updateSLHistogram();
    } else {
      this.updateDistillationWithoutSLD();
    }

    this.graphMetaDataLabel.html(
      // Rank(G): ${this.rank} <br>
      `<span id="graph-properties-title">Graph Properties</span> <br>
         Vertices: ${this.N} <br> 
         Edges: ${this.Edges.length} <br>  
         Components: ${this.components} <br>
         Cycles: ${this.cycles}  <br>
         Isolated Vertices: ${this.singles} <br> 
         Leaves: ${this.leaves} <br> 
         Twins: ${this.twins}`);
    // Shift: q=${this.shiftedBinomialParameter} <br>

    this.AMWidget.updateMatrix(this.AdjacencyMatrix());

    this.updateParityColoring();

    this.updateBrowserURL();
  }

  private manualNodePlacement(nodeId, xPos, yPos) {   
      const self = this; 
      d3.select(`#node-${nodeId}`).attr('transform', `translate(${xPos}, ${yPos})`);
    // tslint:disable-next-line:triple-equals
      self.visEdge.filter(l => l.source.index == nodeId)
        .attr('x1', xPos).attr('y1', yPos);
    // tslint:disable-next-line:triple-equals
      self.visEdge.filter(l => l.target.index == nodeId)
        .attr('x2', xPos).attr('y2', yPos);    

      d3.selectAll(`#node-${nodeId}`).each((d: any) => {
        d.x = xPos;
        d.y = yPos;
        d.vx = 0;
        d.vy = 0;
      });  
  }

  private updateGraphEdgesManually() {
    // Loop through all edges and update both ends based on node positions.
    this.visEdge.each(edge => {
      const src = edge.source.index + 1;
      const trg = edge.target.index + 1;
      const srcPos = Helper.getTranslation(d3.select(`#node-${src}`).attr('transform'));
      const trgPos = Helper.getTranslation(d3.select(`#node-${trg}`).attr('transform'));
      d3.select(`#edge-${src}-${trg}`)
        .attr('x1', srcPos[0])
        .attr('y1', srcPos[1])
        .attr('x2', trgPos[0])
        .attr('y2', trgPos[1]);
    });
  }

  private initNodes(d3Selection): void {
    // create circle for each node
    d3Selection.append('circle')
      .attr('r', 10)
      // .attr('fill', coloring);
      .attr('fill', 'white')
      .style('opacity', 0)
      .transition()
      .duration(this.transitionTime)
      .style('opacity', 1);

    // create text label for each node
    d3Selection.append('text')
      .text(d => d.id)
      .attr('transform', 'translate(0, 1)')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr('stroke', 'black')
      .attr('font-size', 15)
      .attr('font-weight', 100)
      .style('opacity', 0)
      .transition()
      .duration(this.transitionTime)
      .style('opacity', 1);

    // create hovering
    d3Selection.append('title').text(d => d.optionalLabel)
      .style('opacity', 0)
      .transition()
      .duration(this.transitionTime)
      .style('opacity', 1);
  }

  private createGraph(): void {
    const self = this;

    const edges = this.graphData.edges.map(d => Object.create(d));
    const nodes = this.graphData.nodes.map(d => Object.create(d));

    self.simulation = d3.forceSimulation(nodes)
      // @ts-ignore
      .force('link', d3.forceLink(edges).id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(self.Width / 2, self.Height / 2))
      .alphaTarget(0.1);
  }

  // private deleteEdge
  public isNeighbor(start: number, end: number): boolean {
    for (const edge of this.graphData.edges) {
      if (edge.source === start && edge.target === end ||
        edge.target === start && edge.source === end) {
        return true;
      }
    }

    return false;
  }

  private resetNodesColor() {
    d3.selectAll('.node circle').attr('fill', 'white');
  }

  // Interaction States
  private startNode: number = null;

  public nodeContextMenu(node): void {
    if (node.id < 1) return;
    const menuSettings = [{ title: `Vertex ${node.id}` }];
    const self = this;
    menuSettings.push({
      // @ts-ignore
      action: (d, i) => {
        this.startNode = node.id;
        d3.selectAll('.node')
          .each(function() {
            const vertex = d3.select(this);
            const curId: number = +vertex.attr('index');
            if (!self.isNeighbor(node.id, curId)
              && node.id !== curId) {
              vertex.attr('potential-neighbor', 'yes');
              vertex.select('circle').attr('fill', 'green');
            } else {
              vertex.attr('potential-neighbor', 'no');
              vertex.select('circle').attr('fill', 'red');
            }
          });
      },
      disabled: false, // Optional, defaults to false
      title: 'Add New Edge'
    }, {
      action: (d, i) => {
        this.executeLocalComplementation(node.id);
      },
      disabled: false, // Optional, defaults to false
      title: 'Local Complementation'
    }, /*{
      action: (d, i) => {
        console.log('Change Label');
      },
      disabled: false, // Optional, defaults to false
      title: 'Change Label'
    }, {
      action: (d, i) => {
        console.log('Change Info Text');
      },
      disabled: false, // Optional, defaults to false
      title: 'Change Info Text'
    }, */ {
        action: (d, i) => {
          this.deleteNode(node.id);
        },
        disabled: false, // Optional, defaults to false
        title: 'Delete Vertex'
      });

    contextMenuFactory(menuSettings)();
  }

  public get Edges(): Edge[] {
    return this.graphData.edges;
  }

  public get Nodes(): Node[] {
    return this.graphData.nodes;
  }

  private createNode(position: Point): void {
    const old = new Map(this.simulation.nodes().map(d => [d.id, d]));
    const oldNodes = this.simulation.nodes().map(d => Object.assign(old.get(d.id) || {}, d));

    const newId: number = this.N + 1;
    this.graphData.nodes.push({
      id: newId,
      optionalLabel: 'OptionalLabel'
    });

    const nodes = this.Nodes.map(d => Object.create(d));

    for (const [i, n] of Helper.toEntries(oldNodes)) {
      nodes[i].x = oldNodes[i].x;
      nodes[i].y = oldNodes[i].y;
      nodes[i].vx = oldNodes[i].vx;
      nodes[i].vy = oldNodes[i].vy;
    }
    nodes[nodes.length - 1].x = position.x;
    nodes[nodes.length - 1].y = position.y;
    nodes[nodes.length - 1].vx = 0;
    nodes[nodes.length - 1].vy = 0;

    this.simulation.nodes(nodes);

    this.updateGraph();

    this.initNodes(d3.select(`#node-${newId}`));

    if (this.parityColoring) {
      setTimeout(() => {
        this.colorNodeParity(newId);
      }, this.transitionTime);
    }
    
    setTimeout(() => {
      this.sectorHistogramWidget.updateNoiseBars();
    }, this.transitionTime);
  }

  private executeLocalComplementation(nodeId: number): void {
    const nbrs: number[] = this.getNeighbors(nodeId);
    for (const [i, na] of Helper.toEntries(nbrs)) {
      for (const [j, nb] of Helper.toEntries(nbrs)) {
        if (i > j) {
          if (this.isNeighbor(na, nb)) {
            this.deleteEdge({
              source: na,
              target: nb
            }, false);
          } else {
            this.addNewEdge(na, nb, false);
          }
        }
      }
    }

    this.updateGraph(!this.tooManyNodesForSLD()); // SL invariant under loc compl
    this.updateNoises();
  }

  private tooManyNodesForSLD(): boolean {

    const threshold = this.graphComponents.reduce((accumulator, component) => {   
      return  accumulator + 2 ** component.nodes.length;
    }, 0);

    if (GraphVisualizationWidget.useCache) {
      return threshold > 2 ** 16 && !this.isSldCached();
    } else {
      return threshold > 2 ** 16;
    }
    
  }

  private deleteNode(nodeId: number): void {
    const old = new Map(this.simulation.nodes().map(d => [d.id, d]));
    const oldNodes = this.simulation.nodes().map(d => Object.assign(old.get(d.id) || {}, d));

    const neighbors: number[] = this.getNeighbors(nodeId);

    neighbors.forEach(neighbor => {
      this.deleteEdge({
        source: nodeId,
        target: neighbor
      }, false);
    });

    for (const [i, n] of Helper.toEntries(this.graphData.nodes)) {
      if (n.id === nodeId) {
        this.graphData.nodes.splice(i, 1);
      }
    }

    for (const [i, n] of Helper.toEntries(this.graphData.nodes)) {
      if (n.id > nodeId) {
        this.graphData.nodes[i].id--;
      }
    }

    for (const [i, e] of Helper.toEntries(this.graphData.edges)) {
      if (e.source > nodeId) {
        this.graphData.edges[i].source--;
      }
      if (e.target > nodeId) {
        this.graphData.edges[i].target--;
      }
    }

    const nodes = this.Nodes.map(d => Object.create(d));

    for (const [i, n] of Helper.toEntries(oldNodes)) {
      if (n.id > nodeId) {
        nodes[i - 1].x = oldNodes[i].x;
        nodes[i - 1].y = oldNodes[i].y;
        nodes[i - 1].vx = oldNodes[i].vx;
        nodes[i - 1].vy = oldNodes[i].vy;
      } else if (n.id < nodeId) {
        nodes[i].x = oldNodes[i].x;
        nodes[i].y = oldNodes[i].y;
        nodes[i].vx = oldNodes[i].vx;
        nodes[i].vy = oldNodes[i].vy;
      } else if (i < oldNodes.length - 1) {
        nodes[i].x = oldNodes[i + 1].x;
        nodes[i].y = oldNodes[i + 1].y;
        nodes[i].vx = oldNodes[i + 1].vx;
        nodes[i].vy = oldNodes[i + 1].vy;
      }
    }

    this.simulation.nodes(nodes);

    this.updateGraph();
  }

  private getNeighbors(nodeId: number): number[] {
    const neighbors: number[] = [];
    for (const [ind, n] of Helper.toEntries(this.graphData.nodes)) {
      if (this.isNeighbor(nodeId, n.id)) {
        neighbors.push(n.id);
      }
    }

    return neighbors;
  }

  protected prepareNextRender(): void {
    super.prepareNextRender();
    this.toggleZoomToFitIcon();
    this.toggleNavigationIcons();
    this.toggleGraphSaveIcon();
    this.toggleShareUrlIcon();
    this.graphContainer.hide();
    this.graphContainer.empty();
  }

  private toggleZoomToFitIcon(): void {
    this.isZoomToFitIconVisible = !this.isZoomToFitIconVisible;
    this.zoomToFitIcon.css('display', this.isZoomToFitIconVisible ? 'block' : 'none');
  }  

  private toggleGraphSaveIcon(): void {
    this.saveGraphIconVisible = !this.saveGraphIconVisible;
    this.saveGraphIcon.css('display', this.saveGraphIconVisible ? 'block' : 'none');
  }

  private toggleShareUrlIcon(): void {
    this.shareUrlIconVisibile = !this.shareUrlIconVisibile;
    this.shareUrlIcon.css('display', this.shareUrlIconVisibile ? 'block' : 'none');
  }

  private toggleDistillIcon(): void {
    this.distillIconVisible = !this.distillIconVisible;
    this.distillIcon.css('display', this.distillIconVisible ? 'block' : 'none');
  }

  private toggleNavigationIcons(): void {
    this.navigationIconsVisible = !this.navigationIconsVisible;
  }

  private positionIconsProperly(): void {
    let topOffset: number = 220;
    const diff: number = 30;
    this.shareUrlIcon.css('top', `${topOffset}px`);
    topOffset += diff;
    this.saveGraphIcon.css('top', `${topOffset}px`);
    topOffset += diff * 1.25;
    this.zoomToFitIcon.css('top', `${topOffset}px`);
    topOffset += diff;
    this.toggleSimulationIcon.css('top', `${topOffset}px`);
    topOffset += diff * 1.25;
    this.toggleParityColoringIcon.css('top', `${topOffset}px`);
    topOffset += diff;
    this.distillIcon.css('top', `${topOffset}px`);

  }

  protected async renderContents(): Promise<void> {
    this.notifyObservers();

    const params = Helper.getUrlSearchParameters();

    if (params.cache === 'no') {
      GraphVisualizationWidget.useCache = false;
    } else {
      GraphVisualizationWidget.useCache = true; // default
    }

    this.sldCache = SectorLengthDistributionCache.SLD_CACHE;
    
    setTimeout(() => {
      if (params.graph) {
        this.loadGraphFromId(params.graph);
      } else {
        this.graphData = GraphTemplates.Pusteblume();
      }

      this.initGraphSVG();
    }, 500);
  }

  public initializeSLDCache(start: number = 26, end: number = 27): void {
    const self = this;
    const graphTemplates: any[] = [
      GraphTemplates.Star,
      GraphTemplates.Pusteblume,
      GraphTemplates.BellPairs,
      GraphTemplates.Cylinder,
      GraphTemplates.Moebius,
      GraphTemplates.Cycle,
      GraphTemplates.CompleteGraph,      
    ];
    for (let i = start; i <= end; i++) {
      console.log(`>>> LOAD SLD Cache for # nodes: ${i}`);
      graphTemplates.forEach(template => {
        console.log(`>>> LOAD SLD Cache for ${template.name}`);
        const graph = template(i);
        try {
          self.setGraphData(graph);
          self.initGraphSVG(false);
        } catch (e) {
          console.log(`!!! Could not load SLD of Graph '${graph.title}' with ${i} nodes..`);
        }
      });
      if (i >= 25) {
        setTimeout( () => {this.downloadSldCache(i); }, 100);
      }
    }

    console.log(`>>> SLD Cache: `, this.sldCache);
  }

  public setSldCache(obj: string) {
    this.sldCache = JSON.parse(obj);
  }

  public downloadSldCache(nodes: number): void {
    d3.selectAll(`#downloadAnchorElem`).remove();
    d3.select('body').append('a').attr('id', 'downloadAnchorElem');
    const date =  (new Date());
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this.sldCache))}`;
    const dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute('href',     dataStr     );
    dlAnchorElem.setAttribute('download', `sld-cache${nodes ? `_nodes-${nodes}` : ''}_${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.json`);
    dlAnchorElem.click();
  }

  public static highlightButton(id: string): void {
    d3.select(`#${id}`)
      .style('background', 'lightblue')
      .transition()
      .style('background', 'white');
  }

  public static ElementRectangle(domElement: string): Dimensions {
    const bounds = (d3.select(domElement).node() as SVGSVGElement).getBBox();

    return {
      height: bounds.height,
      width: bounds.width,
      x: bounds.x,
      y: bounds.y
    };
  }

  /**
   * We need to be able to adjust the zoom level to fit to the bounding box of the content.
   */
  public zoomToFitContent(): void {
    if (this.Nodes.length < 1) return;
    try {
      let originTranslate: [number, number]
        = Helper.getTranslation(d3.select('#zoomingArea').attr('transform'));
      if (isNaN(originTranslate[0]) || isNaN(originTranslate[1])) originTranslate = [0, 0];
      const originScale: number = Helper.getScale(d3.select('#zoomingArea').attr('transform'));

      const bounds = GraphVisualizationWidget.ElementRectangle('#zoomRectangle');
      const fullWidth: number = bounds.width;
      const fullHeight: number = bounds.height;
      let scale: number = 1000;

      this.zoomGroup
        .call(this.zoomer.transform,
          d3.zoomIdentity
            .translate(originTranslate[0], originTranslate[1])
            .scale(scale));
      d3.selectAll('.bridging-elements').style('display', 'none');
      const bbox = GraphVisualizationWidget.ElementRectangle('#zoomingArea');
      d3.selectAll('.bridging-elements').style('display', 'block');

      this.zoomGroup
        .call(this.zoomer.transform,
          d3.zoomIdentity
            .translate(originTranslate[0], originTranslate[1])
            .scale(originScale));
      const midX: number = bbox.x + bbox.width / 2;
      const midY: number = bbox.y + bbox.height / 2;
      scale = this.zoomPadding / Math.max(bbox.width / fullWidth, bbox.height / fullHeight);
      const translate: [number, number] = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      // Finally perform animation on the correct values.
      this.zoomGroup.transition()
        .duration(Helper.TransitionTime)
        .call(this.zoomer.transform,
          d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale));

    } catch (error) {
      console.log(error);
    }
  }

  protected async notifyObservers(): Promise<void> {
    //
  }

  protected async renderOverlay(): Promise<void> {
    this.toggleZoomToFitIcon();
    this.toggleGraphSaveIcon();
    this.toggleDistillIcon();
    this.toggleNavigationIcons();
    this.showContainer();
  }

  private showContainer(): void {
    this.graphContainer.css('height', '100%');
  }

  private eventListeners: EventListener[];

  private registerEvents(): void {
    const listenTo = (window: Window) => {
      ['keydown'].forEach(eventName => {
        const listener = e => {
          handleEvent(e);
        };
        this.eventListeners.push(listener);
        window.addEventListener(eventName, listener);
      });
    };

    // tslint:disable-next-line
    const handleEvent = (event: KeyboardEvent) => {
      const { key } = event;

    };

    listenTo(window);
  }
}
