import { BoxPanel, DockPanel, Widget, TabBar } from '@phosphor/widgets';
import * as d3 from 'd3';
import GraphVisualizationWidget from '../GraphVisualization/GraphVisualizationWidget';
import ParameterViewWidget from '../ParameterView/ParameterViewWidget';
import SettingsWidget from '../Settings/SettingsWidget';
import './style.css';
import SectorLengthHistogramWidget from '../SectorLengthHistogram/SectorLengthHistogramWidget';
import GlobalNoiseWidget from '../GlobalNoise/GlobalNoiseWidget';
import SectorLengthTableWidget from '../SectorLengthTable/SectorLengthTableWidget';
import AdjacencyMatrixWidget from '../AdjacencyMatrix/AdjacencyMatrixWidget';

class Layout {
  private panel: DockPanel = new DockPanel();
  private panelWrapper: BoxPanel = new BoxPanel({ direction: 'top-to-bottom' });

  private graphVisualizationWidget: GraphVisualizationWidget;

  private parameterViewWidget: ParameterViewWidget;
  private sectorLengthHistogramWidget: SectorLengthHistogramWidget;
  private sectorLengthTableWidget: SectorLengthTableWidget;
  private globalNoiseWidget: GlobalNoiseWidget;
  private adjacencyMatrixWidget: AdjacencyMatrixWidget;

  private settings: SettingsWidget;
  private previousVisualQueryWidgetIndex: number = 0;

  public get Panel(): DockPanel {
    return this.panel;
  }

  public get ParameterWidget(): ParameterViewWidget {
    return this.parameterViewWidget;
  }

  public get GraphVisWidget(): GraphVisualizationWidget {
    return this.graphVisualizationWidget;
  }

  public get SectorHistogram(): SectorLengthHistogramWidget {
    return this.sectorLengthHistogramWidget;
  }

  public get GlobalNoise(): GlobalNoiseWidget {
    return this.globalNoiseWidget;
  }

  public get SectorLengthTab(): SectorLengthTableWidget {
    return this.sectorLengthTableWidget;
  }

  public get AdjacencyMatrixWidget(): AdjacencyMatrixWidget {
    return this.adjacencyMatrixWidget;
  }

  public static getTabBarFor(widget: Widget): TabBar<Widget> | null {
    const tabBars = (widget.parent as DockPanel).tabBars();

    for (let tabBar: TabBar<Widget> = tabBars.next(); tabBar !== undefined; tabBar = tabBars.next()) {
      // If the tab bar contains the title of `widget`, we found the correct one.
      if (tabBar.titles.some(title => title.owner === widget)) {
        return tabBar;
      }
    }

    return null;
  }

  public async initialize(): Promise<void> {
    this.createWidgets();
    this.layoutWidgets();
    this.graphVisualizationWidget.render();
  }

  public resize(): void {
    this.panelWrapper.update();
  }

  private createWidgets(): void {

    this.sectorLengthHistogramWidget = new SectorLengthHistogramWidget(this);
    this.globalNoiseWidget = new GlobalNoiseWidget(this);
    this.sectorLengthTableWidget = new SectorLengthTableWidget(this);
    this.adjacencyMatrixWidget = new AdjacencyMatrixWidget(this);
    this.parameterViewWidget = new ParameterViewWidget(this);

    this.graphVisualizationWidget =
      new GraphVisualizationWidget(this);

    this.parameterViewWidget.Observers = [
      this.graphVisualizationWidget
    ];

    this.settings = new SettingsWidget('Settings');
    this.settings.addWidgets({
      customWidget: this.parameterViewWidget
    });
  }

  private layoutWidgets(): void {
    this.panel.addWidget(this.parameterViewWidget);

    this.panel.addWidget(this.graphVisualizationWidget, {
      mode: 'split-right',
      ref: this.parameterViewWidget
    });

    this.panel.addWidget(this.sectorLengthHistogramWidget, {
      mode: 'split-bottom',
      ref: this.parameterViewWidget
    });

    this.panel.addWidget(this.adjacencyMatrixWidget, {
      mode: 'split-right',
      ref: this.parameterViewWidget
    });

    this.panel.addWidget(this.globalNoiseWidget, {
      mode: 'split-bottom',
      ref: this.parameterViewWidget
    });

    this.panel.addWidget(this.sectorLengthTableWidget, {
      mode: 'split-right',
      ref: this.sectorLengthHistogramWidget
    });

    this.panelWrapper.id = 'layout-wrapper';
    this.panelWrapper.addWidget(this.panel);

    // TODO: this is so ugly, get some grip...
    const panelLayout: any = this.panel.saveLayout();

    panelLayout.main.sizes[0] = 0.55;
    panelLayout.main.sizes[1] = 0.45;

    try {
      panelLayout.main.children[0].sizes[0] = 0.6;
      panelLayout.main.children[0].sizes[1] = 0.4;
      
      panelLayout.main.children[0].children[0].sizes[0] = 0.3;
      panelLayout.main.children[0].children[0].sizes[1] = 0.7;
      panelLayout.main.children[0].children[0].children[0].sizes[0] = 0.6;
      panelLayout.main.children[0].children[0].children[0].sizes[1] = 0.3;

      panelLayout.main.children[0].children[1].sizes[0] = 0.7;
      panelLayout.main.children[0].children[1].sizes[1] = 0.2;
    } catch (e) {
      console.log(panelLayout.main);
    }    

    this.panel.restoreLayout(panelLayout);
    Widget.attach(this.panelWrapper, document.getElementById('app'));
  }
}

const layout: Layout = new Layout();

window.onload = async () => {
  await layout.initialize();   
  // @ts-ignore
  window.layout = layout;  
  document.getElementById('copy-right').innerHTML = `© ${new Date().getFullYear()}`;
};

window.onresize = () => layout.resize();
// @ts-ignore
window.d3 = d3;

export default Layout;
