import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Subject, of } from 'rxjs';
import { FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { Picklists, StateStatus, StateIDs } from '../../../../../common/src/app/utils/record-constants';
import { ActivatedRoute, Router } from '@angular/router';
import { RecordUtils } from '../../records/utils/record-utils';
import { FactoryService } from '../../services/factory.service';
import { LoadingScreenService, Utils, StoreService } from 'nrpti-angular-components';
import { DialogService } from 'ng2-bootstrap-modal';
import moment from 'moment';
import { ConfirmComponent } from '../../confirm/confirm.component';
import { takeUntil, catchError } from 'rxjs/operators';

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
    this.loadingScreenService.setLoadingState(true, 'main');

    this.setOrRemoveRecordAddEditState();
    this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res: any) => {
      this.isEditing = res.breadcrumb !== 'Add Record';
      if (this.isEditing) {
        if (res && res.record && res.record[0] && res.record[0].data) {
          this.record = res.record[0].data;
          this.populateTextFields();
        } else {
          alert('Error: could not load record.');
          this.router.navigate(['mines']);
        }
      }
      this.buildForm();

      this.loading = false;
      this.loadingScreenService.setLoadingState(false, 'main');
      this._changeDetectionRef.detectChanges();
    })
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
   * Build the add-edit form.
   *
   * If editing, pre-populate any existing values. If StoreService contains an item named 'recordAddEdit', use any
   * values set in that piece of state to pre-populate the form fields, and then clear that item from the store.
   *
   * @private
   * @memberof MinesRecordsAddEditComponent
   */
  private buildForm() {
    this.myForm = new FormGroup({
      recordName: new FormControl(
        (this.recordState && this.recordState.recordName) || (this.record && this.record.name) || ''
      ),
      recordDate: new FormControl(
        (this.recordState &&
          this.recordState.recordDate &&
          this.utils.convertJSDateToNGBDate(new Date(this.recordState.recordDate.date))) ||
          (this.record && this.record.date && this.utils.convertJSDateToNGBDate(new Date(this.record.date))) ||
          '' || null
      ),
      recordType: new FormControl(
        (this.recordState && this.recordState.recordType) || (this.record && this.record.type) || ''
      ),
      recordAgency: new FormControl(
        (this.recordState && this.recordState.recordAgency) ||
          (this.record && this.record.agency) || ''
      ),
      recordPublish: new FormControl(
        (this.recordState && this.recordState.recordPublish) ||
          (this.record && this.record.read.includes('public')) || false
      )
    });

    if (this.recordState) {
      // State was saved from before, so mark everything dirty so as not to miss any previous user edits
      this.myForm.get('recordName').markAsDirty();
      this.myForm.get('recordDate').markAsDirty();
      this.myForm.get('recordType').markAsDirty();
      this.myForm.get('recordAgency').markAsDirty();
      this.myForm.get('recordPublish').markAsDirty();

      // Remove used state
      this.storeService.removeItem(StateIDs.recordAddEdit);
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
   * Delete the record.
   *
   * @memberof MinesRecordsTableRowComponent
   */
  deleteRecord() {
    this.dialogService
      .addDialog(
        ConfirmComponent,
        { title: 'Confirm Deletion', message: 'Do you really want to delete this Record?', okOnly: false },
        { backdropColor: 'rgba(0, 0, 0, 0.5)' }
      )
      .pipe(
        takeUntil(this.ngUnsubscribe),
        catchError(() => {
          alert('Failed to delete record.');
          return of(null);
        })
      )
      .subscribe(async isConfirmed => {
        if (!isConfirmed) {
          return;
        }

        try {
          await this.factoryService.deleteMineRecord(this.record._id, this.record.type);

          this.router.navigate(['../../records'], { relativeTo: this.route });
        } catch (e) {
          alert('Could not delete Record.');
        }
      });
  }

  /**
   * Submit form data to API.
   *
   * @memberof MinesRecordsAddEditComponent
   */
  async submit() {
    this.loadingScreenService.setLoadingState(true, 'main');

    const record = {};

    this.myForm.get('recordName').dirty && (record['name'] = this.myForm.get('recordName').value);
    this.myForm.get('recordDate').dirty &&
      (record['date'] = this.utils.convertFormGroupNGBDateToJSDate(this.myForm.get('recordDate').value));
    this.myForm.get('recordType').dirty && (record['type'] = this.myForm.get('recordType').value);
    this.myForm.get('recordAgency').dirty && (record['agency'] = this.myForm.get('recordAgency').value);

    if (this.myForm.get('recordPublish').dirty && this.myForm.get('recordPublish').value) {
      record['addRole'] = 'public';
    }

    if (this.isEditing) {
      record['_id'] = this.record._id;

      this.factoryService.editMineRecord(record).subscribe(async res => {
        this.recordUtils.parseResForErrors(res);

        this.loadingScreenService.setLoadingState(false, 'main');
        this.router.navigate(['mines', this.record._master, 'records', this.record._id, 'detail']);
      })
    } else {
      // todo keep as mineId?
      record['_master'] = this.route.snapshot.paramMap.get('mineId');
      record['project'] = this.route.snapshot.paramMap.get('mineId');

      this.factoryService.createMineRecord(record).subscribe(async (res: any) => {
        this.recordUtils.parseResForErrors(res);

        const createedRecord = res && res.length && res[0] && res[0].length && res[0][0] && res[0][0].object;

        this.loadingScreenService.setLoadingState(false, 'main');
        if (createedRecord) {
          this.router.navigate(['mines', createedRecord._master, 'records', createedRecord._id, 'detail']);
        } else {
          this.router.navigate(['../'], {relativeTo: this.route});
        }
      });
    }

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
