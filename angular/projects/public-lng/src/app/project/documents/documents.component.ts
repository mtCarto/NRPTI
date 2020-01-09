import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Document } from '../../models/document';
import { PageTypes } from '../../utils/page-types.enum';
import { TableObject, TableTemplateUtils, IPageSizePickerOption } from 'nrpti-angular-components';
import { ComplianceTableRowsComponent } from '../compliance/compliance-rows/compliance-table-rows.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthorizationsTableRowsComponent } from '../authorizations/authorizations-rows/authorizations-table-rows.component';
import { NationsTableRowsComponent } from '../nations/nations-rows/nations-table-rows.component';
import { PlansTableRowsComponent } from '../plans/plans-rows/plans-table-rows.component';

/**
 * Documents component.
 * Displays a list of documents, including filter side panel.
 *
 * @export
 * @class DocumentsComponent
 * @implements {OnInit}
 */
@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  @Input() pageType: PageTypes;

  public documents: Document[] = [];
  private basePath: string;

  public tableData: TableObject;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();
  public loading = true;

  constructor(
    public router: Router,
    private _changeDetectionRef: ChangeDetectorRef,
    private tableTemplateUtils: TableTemplateUtils,
    public route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.basePath = this.router.url.split(';')[0];
    const projectPath = this.basePath.split('/')[3];

    // Dynamically setup the tableColumns and searchQuery to get the right stuff.
    let tableColumns = null;

    switch (projectPath) {
      case 'compliance': {
        tableColumns = [
          {
            name: 'Name',
            value: '_master.recordName',
            width: 'col-2'
          },
          {
            name: 'Government Agency',
            value: '_master.issuingAgency',
            width: 'col-2'
          },
          {
            name: 'Author',
            value: '_master.author',
            width: 'col-2'
          },
          {
            name: 'Type',
            value: '_master.recordType',
            width: 'col-2'
          },
          {
            name: 'Date',
            value: '_master.dateIssued',
            width: 'col-2'
          },
          {
            name: 'Description',
            value: 'description',
            width: 'col-2'
          }
        ];
        this.tableData = new TableObject({ component: ComplianceTableRowsComponent });
      }
        break;
      case 'authorizations':
        {
          tableColumns = [
            {
              name: 'Name',
              value: '_master.recordName',
              width: 'col-2'
            },
            {
              name: 'Government Agency',
              value: '_master.issuingAgency',
              width: 'col-2'
            },
            {
              name: 'Type',
              value: '_master.recordType',
              width: 'col-2'
            },
            {
              name: 'Subtype',
              value: '_master.recordSubType',
              width: 'col-2'
            },
            {
              name: 'Date',
              value: '_master.dateIssued',
              width: 'col-2'
            },
            {
              name: 'Description',
              value: 'description',
              width: 'col-2'
            }
          ];
          this.tableData = new TableObject({ component: AuthorizationsTableRowsComponent });
        }
        break;
      case 'plans':
        {
          tableColumns = [
            {
              name: 'Name',
              value: '_master.recordName',
              width: 'col-2'
            },
            {
              name: 'Government Agency',
              value: '_master.issuingAgency',
              width: 'col-2'
            },
            {
              name: 'Phase',
              value: '_master.recordPhase',
              width: 'col-2'
            },
            {
              name: 'Type',
              value: '_master.recordType',
              width: 'col-2'
            },
            {
              name: 'Date',
              value: '_master.dateIssued',
              width: 'col-2'
            }
          ];
          this.tableData = new TableObject({ component: PlansTableRowsComponent });
        }
        break;
      case 'nations': {
        tableColumns = [
          {
            name: 'Name',
            value: '_master.recordName',
            width: 'col-2'
          },
          {
            name: 'Indigenous Nation',
            value: '_master.nationName',
            width: 'col-2'
          },
          {
            name: 'Date',
            value: '_master.date',
            width: 'col-2'
          }
        ];
        this.tableData = new TableObject({ component: NationsTableRowsComponent });
      }
        break;
    }

    this.route.params.pipe(takeUntil(this.ngUnsubscribe)).subscribe(params => {
      // Get params from route, shove into the tableTemplateUtils so that we get a new dataset to work with.
      this.tableData = this.tableTemplateUtils.updateTableObjectWithUrlParams(params, this.tableData);

      this._changeDetectionRef.detectChanges();
    });

    this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res: any) => {
      if (res && res.records !== undefined) {
        this.tableData.items = res.records[0].data.searchResults;

        if (res.records[0].data.meta.length > 0) {
          this.tableData.totalListItems = res.records[0].data.meta[0].searchResultsTotal;
        }

        this.tableData.columns = tableColumns;
        this.loading = false;
        this._changeDetectionRef.detectChanges();
      }
    });
  }

  itemClicked() { }

  itemSelected() { }

  setColumnSort(column) {
    if (this.tableData.sortBy.charAt(0) === '+') {
      this.tableData.sortBy = '-' + column;
    } else {
      this.tableData.sortBy = '+' + column;
    }
    this.submit();
  }

  onPageNumUpdate(pageNumber) {
    this.tableData.currentPage = pageNumber;
    this.submit();
  }

  onPageSizeUpdate(pageSize: IPageSizePickerOption) {
    this.tableData.pageSize = pageSize.value;
    this.submit();
  }

  submit() {
    this.tableTemplateUtils.navigateUsingParams(this.tableData, [this.basePath]);
  }

  checkChange() { }
}
