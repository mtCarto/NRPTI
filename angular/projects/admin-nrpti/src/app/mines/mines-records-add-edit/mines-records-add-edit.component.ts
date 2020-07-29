import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Picklists, StateStatus, StateIDs } from 'projects/common/src/app/utils/record-constants';
import { ActivatedRoute, Router } from '@angular/router';
import { RecordUtils } from '../../records/utils/record-utils';
import { FactoryService } from '../../services/factory.service';
import { LoadingScreenService, Utils, StoreService } from 'projects/global/src/public-api';
import { DialogService } from 'ng2-bootstrap-modal';
import moment from 'moment';

@Component({
  selector: 'app-mines-records-add-edit',
  templateUrl: './mines-records-add-edit.component.html',
  styleUrls: ['./mines-records-add-edit.component.scss']
})
export class MinesRecordsAddEditComponent implements OnInit {

  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  // flags
  public loading = true;
  public isEditing = false;
  public isPublished = false;
  public canPublish = false;

  // form
  public myForm: FormGroup;

  // data
  public record = null;
  public lastEditedSubText = null;

  // Pick lists
  public recordTypes = Picklists.mineRecordTypePickList;
  public recordAgencies = Picklists.collectionAgencyPicklist;

  // collection add edit state
  public recordState = null;

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private location: Location,
    private recordUtils: RecordUtils,
    private factoryService: FactoryService,
    private loadingScreenService: LoadingScreenService,
    private utils: Utils,
    private dialogService: DialogService,
    private storeService: StoreService,
    private _changeDetectionRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
  }

  /**
   * Sets the initial recordAddEdit state, or removes it from the store if it is invalid.
   *
   * @memberof MinesRecordsAddEditComponent
   */
  setOrRemoveRecordAddEditState() {
    const temprecordAddEditState = this.storeService.getItem(StateIDs.recordAddEdit);
    if (temprecordAddEditState) {
      if (temprecordAddEditState.status === StateStatus.invalid) {
        this.storeService.removeItem(StateIDs.recordAddEdit);
      } else {
        this.recordState = temprecordAddEditState;
      }
    }
  }

  /**
   * Derive static text strings.
   *
   * @memberof MinesRecordsAddEditComponent
   */
  populateTextFields() {
    if (!this.record) {
      return;
    }

    if (this.record.dateUpdated) {
      this.lastEditedSubText = `Last Edited on ${moment(this.record.dateUpdated).format('MMMM DD, YYYY')}`;
    } else if (this.record.dateAdded) {
      this.lastEditedSubText = `Added on ${moment(this.record.dateAdded).format('MMMM DD, YYYY')}`;
    }
  }

  /**
   * Toggle the publish formcontrol.
   *
   * @param {*} event
   * @memberof MinesRecordsAddEditComponent
   */
  togglePublish(event) {
    if (!event.checked) {
      // always allow unpublishing
      this.myForm.get('recordublish').setValue(event.checked);
    } else if (this.canPublish) {
      // conditionally allow publishing
      this.myForm.get('recordPublish').setValue(event.checked);
    }

    this._changeDetectionRef.detectChanges();
  }

  /**
   * Cancel editing.
   *
   * @memberof MinesRecordsAddEditComponent
   */
  cancel() {
    const shouldCancel = confirm(
      'Leaving this page will discard unsaved changes. Are you sure you would like to continue?'
    );
    if (shouldCancel) {
      if (this.isEditing) {
        this.router.navigate(['mines', this.record._master, 'records', this.record._id, 'detail']);
      } else {
        this.location.back();
      }
    }
  }
}
