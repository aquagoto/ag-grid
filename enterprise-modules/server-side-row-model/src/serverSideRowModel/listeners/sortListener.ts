import {
    _,
    Autowired,
    Bean,
    BeanStub,
    ColumnController,
    Constants,
    Events,
    GridOptionsWrapper,
    PostConstruct,
    SortController,
    Column,
    SortModelItem,
    RefreshSortParams
} from "@ag-grid-community/core";
import {ServerSideRowModel} from "../serverSideRowModel";

@Bean('ssrmSortService')
export class SortListener extends BeanStub {

    @Autowired('sortController') private sortController: SortController;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('rowModel') private serverSideRowModel: ServerSideRowModel;

    @PostConstruct
    private postConstruct(): void {
        // only want to be active if SSRM active, otherwise would be interfering with other row models
        if (!this.gridOptionsWrapper.isRowModelServerSide()) { return; }

        this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, this.onSortChanged.bind(this));
    }

    public extractSortModel(): SortModelItem [] {
        const sortModel = this.sortController.getSortModel();

        // when using tree data we just return the sort model with the 'ag-Grid-AutoColumn' as is, i.e not broken out
        // into it's constitute group columns as they are not defined up front and can vary per node.
        if (this.gridOptionsWrapper.isTreeData()) {
            return sortModel;
        }

        // it autoCol is active, we don't want to send this to the server. instead we want to
        // send the
        this.replaceAutoGroupColumnWithActualRowGroupColumns(sortModel);
        this.removeMultiColumnPrefixOnColumnIds(sortModel);

        return sortModel;
    }

    private removeMultiColumnPrefixOnColumnIds(sortModel: SortModelItem[]): void {
        if (this.gridOptionsWrapper.isGroupMultiAutoColumn()) {
            const multiColumnPrefix = Constants.GROUP_AUTO_COLUMN_ID + "-";

            for (let i = 0; i < sortModel.length; ++i) {
                if (sortModel[i].colId.indexOf(multiColumnPrefix) > -1) {
                    sortModel[i].colId = sortModel[i].colId.substr(multiColumnPrefix.length);
                }
            }
        }
    }

    private replaceAutoGroupColumnWithActualRowGroupColumns(sortModel: SortModelItem[]): void {
        // find index of auto group column in sort model
        const autoGroupSortModel = sortModel.find( sm => sm.colId == Constants.GROUP_AUTO_COLUMN_ID);

        // replace auto column with individual group columns
        if (autoGroupSortModel) {

            // remove auto group column
            let autoGroupIndex = sortModel.indexOf(autoGroupSortModel);
            _.removeFromArray(sortModel, autoGroupSortModel);

            const isNotInSortModel = (col: Column) => sortModel.filter(sm => sm.colId === col.getColId()).length==0;
            const mapColumnToSortModel = (col: Column) => { return { colId: col.getId(), sort: autoGroupSortModel.sort} };

            const newModels = this.columnController.getRowGroupColumns()
                .filter(isNotInSortModel)
                .map(mapColumnToSortModel);

            _.insertArrayIntoArray(sortModel, newModels, autoGroupIndex);
        }
    }

    private onSortChanged(): void {
        const storeParams = this.serverSideRowModel.getParams();
        const newSortModel = this.extractSortModel();
        const oldSortModel = storeParams.sortModel;

        this.serverSideRowModel.updateSortModel(newSortModel);

        const changedColumnsInSort = this.findChangedColumnsInSort(newSortModel, oldSortModel);
        const valueColSortChanged = this.isSortingWithValueColumn(changedColumnsInSort);
        const secondaryColSortChanged = this.isSortingWithSecondaryColumn(changedColumnsInSort);

        const sortAlwaysResets = this.gridOptionsWrapper.isServerSideSortingAlwaysResets();

        const params: RefreshSortParams = {
            oldSortModel,
            newSortModel,
            valueColSortChanged,
            secondaryColSortChanged,
            sortAlwaysResets,
            changedColumnsInSort
        };

        this.serverSideRowModel.refreshAfterSort(params);
    }


    private isSortingWithValueColumn(changedColumnsInSort: string[]): boolean {
        const valueColIds = this.columnController.getValueColumns().map(col => col.getColId());

        for (let i = 0; i < changedColumnsInSort.length; i++) {
            if (valueColIds.indexOf(changedColumnsInSort[i]) > -1) {
                return true;
            }
        }

        return false;
    }

    private isSortingWithSecondaryColumn(changedColumnsInSort: string[]): boolean {
        if (!this.columnController.getSecondaryColumns()) {
            return false;
        }

        const secondaryColIds = this.columnController.getSecondaryColumns()!.map(col => col.getColId());

        for (let i = 0; i < changedColumnsInSort.length; i++) {
            if (secondaryColIds.indexOf(changedColumnsInSort[i]) > -1) {
                return true;
            }
        }

        return false;
    }

    // returns back all the cols that were effected by the sorting. eg if we were sorting by col A,
    // and now we are sorting by col B, the list of impacted cols should be A and B. so if a cache
    // is impacted by sorting on A or B then it needs to be refreshed. this includes where the cache
    // was previously sorted by A and then the A sort now needs to be cleared.
    private findChangedColumnsInSort(
        newSortModel: { colId: string, sort: string }[],
        oldSortModel: { colId: string, sort: string }[]): string[] {

        let allColsInBothSorts: string[] = [];

        [newSortModel, oldSortModel].forEach(sortModel => {
            if (sortModel) {
                const ids = sortModel.map(sm => sm.colId);
                allColsInBothSorts = allColsInBothSorts.concat(ids);
            }
        });

        const differentSorts = (oldSortItem: any, newSortItem: any) => {
            const oldSort = oldSortItem ? oldSortItem.sort : null;
            const newSort = newSortItem ? newSortItem.sort : null;
            return oldSort !== newSort;
        };

        const differentIndexes = (oldSortItem: any, newSortItem: any) => {
            const oldIndex = oldSortModel.indexOf(oldSortItem);
            const newIndex = newSortModel.indexOf(newSortItem);
            return oldIndex !== newIndex;
        };

        return allColsInBothSorts.filter(colId => {
            const oldSortItem = _.find(oldSortModel, sm => sm.colId === colId);
            const newSortItem = _.find(newSortModel, sm => sm.colId === colId);
            return differentSorts(oldSortItem, newSortItem) || differentIndexes(oldSortItem, newSortItem);
        });
    }

}