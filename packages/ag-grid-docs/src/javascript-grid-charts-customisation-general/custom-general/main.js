var columnDefs = [
    { field: "country", width: 150, chartDataType: 'category' },
    { field: "gold", chartDataType: 'series' },
    { field: "silver", chartDataType: 'series' },
    { field: "bronze", chartDataType: 'series' },
    { headerName: "A", valueGetter: 'Math.floor(Math.random()*1000)', chartDataType: 'series' },
    { headerName: "B", valueGetter: 'Math.floor(Math.random()*1000)', chartDataType: 'series' },
    { headerName: "C", valueGetter: 'Math.floor(Math.random()*1000)', chartDataType: 'series' },
    { headerName: "D", valueGetter: 'Math.floor(Math.random()*1000)', chartDataType: 'series' }
];

function createRowData() {
    var countries = [
        "Ireland", "Spain", "United Kingdom", "France", "Germany", "Luxembourg", "Sweden",
        "Norway", "Italy", "Greece", "Iceland", "Portugal", "Malta", "Brazil", "Argentina",
        "Colombia", "Peru", "Venezuela", "Uruguay", "Belgium"
    ];
    
    return countries.map(function(country, index) {
        return {
            country: country,
            gold: Math.floor(((index+1 / 7) * 333)%100),
            silver: Math.floor(((index+1 / 3) * 555)%100),
            bronze: Math.floor(((index+1 / 7.3) * 777)%100),
        };
    });
}

var gridOptions = {
    defaultColDef: {
        width: 100,
        resizable: true
    },
    popupParent: document.body,
    columnDefs: columnDefs,
    rowData: createRowData(),
    enableRangeSelection: true,
    enableCharts: true,
    onFirstDataRendered: onFirstDataRendered,
    processChartOptions: processChartOptions,
};

function processChartOptions(params) {
    var options = params.options;

    console.log('chart options:', options);

    options.width = 700;
    options.height = 400;
    
    options.padding = {
        top: 20, 
        right: 10, 
        bottom: 10, 
        left: 20
    };

    options.background = {
        fill: '#B0E0E6'
    }

    options.title = {
        text: 'Precious Metals Production',
        fontStyle: 'italic',
        fontWeight: 'bold',
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
        color: '#414182'
    };

    options.subtitle = {
        text: 'by country',
        fontStyle: 'oblique',
        fontWeight: 600,
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        color: 'rgb(100, 100, 100)'
    };

    var legend = options.legend;

    legend.enabled = true;
    legend.markerStrokeWidth = 2;
    legend.markerSize = 25;
    legend.markerPadding = 10;
    legend.itemPaddingX = 120;
    legend.itemPaddingY = 20;
    legend.labelFontStyle = 'italic';
    legend.labelFontWeight = 'bold';
    legend.labelFontSize = 18;
    legend.labelFontFamily = 'Arial, sans-serif';
    legend.labelColor = '#555';

    options.legendPosition = 'bottom';
    options.legendPadding = 20;

    options.tooltipClass = 'my-tooltip-class';

    return options;
}

function onFirstDataRendered(params) {
    var cellRange = {
        rowStartIndex: 0,
        rowEndIndex: 4,
        columns: ['country', 'gold', 'silver', 'bronze']
    };

    var createRangeChartParams = {
        cellRange: cellRange,
        chartType: 'groupedBar'
    };

    params.api.createRangeChart(createRangeChartParams);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
});
