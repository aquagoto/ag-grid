var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Autowired, Events, Qualifier, RowNodeCache, } from "@ag-grid-community/core";
import { InfiniteBlock } from "./infiniteBlock";
var InfiniteCache = /** @class */ (function (_super) {
    __extends(InfiniteCache, _super);
    function InfiniteCache(params) {
        return _super.call(this, params) || this;
    }
    InfiniteCache.prototype.setBeans = function (loggerFactory) {
        this.logger = loggerFactory.create('InfiniteCache');
    };
    InfiniteCache.prototype.moveItemsDown = function (block, moveFromIndex, moveCount) {
        var startRow = block.getStartRow();
        var endRow = block.getEndRow();
        var indexOfLastRowToMove = moveFromIndex + moveCount;
        // all rows need to be moved down below the insertion index
        for (var currentRowIndex = endRow - 1; currentRowIndex >= startRow; currentRowIndex--) {
            // don't move rows at or before the insertion index
            if (currentRowIndex < indexOfLastRowToMove) {
                continue;
            }
            var indexOfNodeWeWant = currentRowIndex - moveCount;
            var nodeForThisIndex = this.getRow(indexOfNodeWeWant, true);
            if (nodeForThisIndex) {
                block.setRowNode(currentRowIndex, nodeForThisIndex);
            }
            else {
                block.setBlankRowNode(currentRowIndex);
                block.setDirty();
            }
        }
    };
    InfiniteCache.prototype.insertItems = function (block, indexToInsert, items) {
        var pageStartRow = block.getStartRow();
        var pageEndRow = block.getEndRow();
        var newRowNodes = [];
        // next stage is insert the rows into this page, if applicable
        for (var index = 0; index < items.length; index++) {
            var rowIndex = indexToInsert + index;
            var currentRowInThisPage = rowIndex >= pageStartRow && rowIndex < pageEndRow;
            if (currentRowInThisPage) {
                var dataItem = items[index];
                var newRowNode = block.setNewData(rowIndex, dataItem);
                newRowNodes.push(newRowNode);
            }
        }
        return newRowNodes;
    };
    InfiniteCache.prototype.insertItemsAtIndex = function (indexToInsert, items) {
        // get all page id's as NUMBERS (not strings, as we need to sort as numbers) and in descending order
        var _this = this;
        var newNodes = [];
        this.forEachBlockInReverseOrder(function (block) {
            var pageEndRow = block.getEndRow();
            // if the insertion is after this page, then this page is not impacted
            if (pageEndRow <= indexToInsert) {
                return;
            }
            _this.moveItemsDown(block, indexToInsert, items.length);
            var newNodesThisPage = _this.insertItems(block, indexToInsert, items);
            newNodesThisPage.forEach(function (rowNode) { return newNodes.push(rowNode); });
        });
        if (this.isMaxRowFound()) {
            this.hack_setVirtualRowCount(this.getVirtualRowCount() + items.length);
        }
        this.onCacheUpdated();
        var event = {
            type: Events.EVENT_ROW_DATA_UPDATED,
            api: this.gridApi,
            columnApi: this.columnApi
        };
        this.eventService.dispatchEvent(event);
    };
    // the rowRenderer will not pass dontCreatePage, meaning when rendering the grid,
    // it will want new pages in the cache as it asks for rows. only when we are inserting /
    // removing rows via the api is dontCreatePage set, where we move rows between the pages.
    InfiniteCache.prototype.getRow = function (rowIndex, dontCreatePage) {
        if (dontCreatePage === void 0) { dontCreatePage = false; }
        var blockId = Math.floor(rowIndex / this.cacheParams.blockSize);
        var block = this.getBlock(blockId);
        if (!block) {
            if (dontCreatePage) {
                return null;
            }
            else {
                block = this.createBlock(blockId);
            }
        }
        return block.getRow(rowIndex);
    };
    InfiniteCache.prototype.createBlock = function (blockNumber) {
        var newBlock = this.createBean(new InfiniteBlock(blockNumber, this.cacheParams));
        this.postCreateBlock(newBlock);
        return newBlock;
    };
    // we have this on infinite row model only, not server side row model,
    // because for server side, it would leave the children in inconsistent
    // state - eg if a node had children, but after the refresh it had data
    // for a different row, then the children would be with the wrong row node.
    InfiniteCache.prototype.refreshCache = function () {
        this.forEachBlockInOrder(function (block) { return block.setDirty(); });
        this.checkBlockToLoad();
    };
    __decorate([
        Autowired('columnApi')
    ], InfiniteCache.prototype, "columnApi", void 0);
    __decorate([
        Autowired('gridApi')
    ], InfiniteCache.prototype, "gridApi", void 0);
    __decorate([
        __param(0, Qualifier('loggerFactory'))
    ], InfiniteCache.prototype, "setBeans", null);
    return InfiniteCache;
}(RowNodeCache));
export { InfiniteCache };
