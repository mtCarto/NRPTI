import { async, TestBed } from '@angular/core/testing';
import { PermitDetailComponent } from './permit-detail.component';
import { TestBedHelper, ActivatedRouteStub } from '../../../../../../common/src/app/spec/spec-utils';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalModule } from 'nrpti-angular-components';
import { RecordDetailDirective } from '../../utils/record-detail.directive';
import { DatePipe } from '@angular/common';
import { CommonModule } from '../../../../../../common/src/app/common.module';

describe('PermitDetailComponent', () => {
  const testBedHelper = new TestBedHelper<PermitDetailComponent>(PermitDetailComponent);

  // component constructor mocks
  const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
  const mockActivatedRoute = new ActivatedRouteStub();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, GlobalModule, CommonModule],
      declarations: [PermitDetailComponent, RecordDetailDirective],
      providers: [
        DatePipe,
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  }));

  it('should create', () => {
    const { component } = testBedHelper.createComponent();

    expect(component).toBeTruthy();
  });
});
