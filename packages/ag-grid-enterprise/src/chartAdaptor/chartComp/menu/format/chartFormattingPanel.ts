import { _, ChartType, Component, PostConstruct, RefSelector } from "ag-grid-community";
import { ChartController } from "../../chartController";
import { LegendPanel } from "./legend/legendPanel";
import { BarSeriesPanel } from "./series/barSeriesPanel";
import { AxisPanel } from "./axis/axisPanel";
import { LineSeriesPanel } from "./series/lineSeriesPanel";
import { PieSeriesPanel } from "./series/pieSeriesPanel";
import { ChartPanel } from "./chart/chartPanel";
import { AreaSeriesPanel } from "./series/areaSeriesPanel";
import { ScatterSeriesPanel } from "./series/scatterSeriesPanel";

export class ChartFormattingPanel extends Component {
    public static TEMPLATE = `<div class="ag-chart-format-wrapper"></div>`;

    private activePanels: Component[] = [];
    private readonly chartController: ChartController;

    constructor(chartController: ChartController) {
        super();
        this.chartController = chartController;
    }

    @PostConstruct
    private init() {
        this.setTemplate(ChartFormattingPanel.TEMPLATE);
        this.createFormatPanel();
        this.addDestroyableEventListener(this.chartController, ChartController.EVENT_CHART_MODEL_UPDATED, this.createFormatPanel.bind(this));
    }

    private createFormatPanel() {
        this.destroyActivePanels();

        this.addComponent(new ChartPanel(this.chartController));
        this.addComponent(new LegendPanel(this.chartController));

        const chartType = this.chartController.getChartType();

        switch (this.chartController.getChartType()) {
            case ChartType.GroupedColumn:
            case ChartType.StackedColumn:
            case ChartType.NormalizedColumn:
            case ChartType.GroupedBar:
            case ChartType.StackedBar:
            case ChartType.NormalizedBar:
                this.addComponent(new AxisPanel(this.chartController));
                this.addComponent(new BarSeriesPanel(this.chartController));
                break;
            case ChartType.Pie:
            case ChartType.Doughnut:
                this.addComponent(new PieSeriesPanel(this.chartController));
                break;
            case ChartType.Line:
                this.addComponent(new AxisPanel(this.chartController));
                this.addComponent(new LineSeriesPanel(this.chartController));
                break;
            case ChartType.Scatter:
            case ChartType.Bubble:
                this.addComponent(new AxisPanel(this.chartController));
                this.addComponent(new ScatterSeriesPanel(this.chartController));
                break;
            case ChartType.Area:
            case ChartType.StackedArea:
            case ChartType.NormalizedArea:
                this.addComponent(new AxisPanel(this.chartController));
                this.addComponent(new AreaSeriesPanel(this.chartController));
                break;
            default:
                console.warn(`ag-Grid: ChartFormattingPanel - unexpected chart type index: ${chartType} supplied`);
        }
    }

    private addComponent(component: Component): void {
        this.getContext().wireBean(component);
        this.getGui().appendChild(component.getGui());
        this.activePanels.push(component);
    }

    private destroyActivePanels(): void {
        this.activePanels.forEach(panel => {
            _.removeFromParent(panel.getGui());
            panel.destroy();
        });
    }

    public destroy(): void {
        this.destroyActivePanels();
        super.destroy();
    }
}
