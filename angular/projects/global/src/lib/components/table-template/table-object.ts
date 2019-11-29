import { Type } from '@angular/core';

export const DEFAULT_TABLE_PAGE_SIZE = 25;
export const DEFAULT_TABLE_CURRENT_PAGE = 1;
export const DEFAULT_TABLE_SORT_BY = '';
export const DEFAULT_TABLE_KEYWORDS = '';
export const DEFAULT_TABLE_DATASET = '';
export const DEFAULT_TABLE_FILTER = {};

export interface IColumnObject {
  name: string;
  value: string;
  width: string;
  nosort?: boolean;
}
export interface ITableObjectParams {
  columns?: IColumnObject[];
  component: Type<any>;
  dataset?: string;
  currentPage?: number;
  filter?: any;
  items?: any[];
  keywords?: string;
  pageSize?: number;
  sortBy?: string;
}
export class TableObject {
  public columns: IColumnObject[];
  public component: Type<any>;
  public dataset: string;
  public currentPage: number;
  public filter: any;
  public items: any[];
  public keywords: string;
  public pageSize: number;
  public sortBy: string;
  public totalListItems: number;
  constructor(params: ITableObjectParams) {
    if (!params) {
      throw Error('Params are required');
    }
    if (!params.component) {
      throw Error('You must pass in a row component');
    }

    this.columns = (params && params.columns) || [];
    this.component = params && params.component;
    this.dataset = (params && params.dataset) || DEFAULT_TABLE_DATASET;
    this.currentPage = (params && params.currentPage) || DEFAULT_TABLE_CURRENT_PAGE;
    this.filter = (params && params.filter) || DEFAULT_TABLE_FILTER;
    this.items = (params && params.items) || [];
    this.keywords = (params && params.keywords) || DEFAULT_TABLE_KEYWORDS;
    this.pageSize = (params.pageSize && params.pageSize) || DEFAULT_TABLE_PAGE_SIZE;
    this.sortBy = (params && params.sortBy) || DEFAULT_TABLE_SORT_BY;
    this.totalListItems = this.items.length;
  }
}