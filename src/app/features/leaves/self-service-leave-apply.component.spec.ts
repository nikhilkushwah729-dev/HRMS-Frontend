import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LeaveService, LeaveTypeBalance } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';
import { SelfServiceLeaveApplyComponent } from './self-service-leave-apply.component';

describe('SelfServiceLeaveApplyComponent (UI Rebuild & Validation Spec)', () => {
  let component: SelfServiceLeaveApplyComponent;
  let fixture: ComponentFixture<SelfServiceLeaveApplyComponent>;
  let leaveServiceSpy: jasmine.SpyObj<LeaveService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockLeaveTypes: LeaveTypeBalance[] = [
    {
      id: 1,
      orgId: 1001,
      typeName: 'Casual Leave',
      daysAllowed: 12,
      carryForward: true,
      maxCarryDays: 5,
      isPaid: true,
      requiresDoc: false,
      type: 'Casual Leave',
      color: '#f59e0b',
      year: 2026,
      total: 12,
      used: 2,
      remaining: 10,
    },
    {
      id: 2,
      orgId: 1001,
      typeName: 'Sick Leave',
      daysAllowed: 10,
      carryForward: false,
      maxCarryDays: 0,
      isPaid: true,
      requiresDoc: true,
      type: 'Sick Leave',
      color: '#10b981',
      year: 2026,
      total: 10,
      used: 1,
      remaining: 9,
    },
  ];

  beforeEach(async () => {
    leaveServiceSpy = jasmine.createSpyObj('LeaveService', ['getLeaveTypes', 'applyLeave']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['show']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    leaveServiceSpy.getLeaveTypes.and.returnValue(of({ status: 'success', data: mockLeaveTypes }));

    await TestBed.configureTestingModule({
      imports: [SelfServiceLeaveApplyComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: LeaveService, useValue: leaveServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'requestKind' ? 'leave' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelfServiceLeaveApplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create SelfServiceLeaveApplyComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load leave types on init and set leaveTypes signal', () => {
    expect(leaveServiceSpy.getLeaveTypes).toHaveBeenCalled();
    expect(component.leaveTypes().length).toBe(2);
    expect(component.leaveTypes()[0].typeName).toBe('Casual Leave');
  });

  it('should mark form invalid initially and disable submit button', () => {
    expect(component.form.invalid).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBeTrue();
  });

  it('should conditionally show halfDaySession field when durationType is set to half_day', () => {
    expect(component.form.value.durationType).toBe('full_day');
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Half Day Session');

    component.form.patchValue({ durationType: 'half_day' });
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Half Day Session');
  });

  it('should construct correct payload on submit with half_day and halfDaySession', () => {
    leaveServiceSpy.applyLeave.and.returnValue(
      of({
        id: 99,
        employeeId: 1,
        orgId: 1001,
        leaveTypeId: 1,
        startDate: '2026-10-01',
        endDate: '2026-10-01',
        totalDays: 0.5,
        reason: 'Medical Checkup',
        supportingDoc: null,
        status: 'pending',
        approvedBy: null,
        approvedAt: null,
        rejectionNote: null,
        cancelledBy: null,
        cancelledAt: null,
        createdAt: '2026-09-25T12:00:00.000Z',
        durationType: 'half_day',
        halfDaySession: 'first_half',
      }),
    );

    component.form.patchValue({
      leaveTypeId: 1,
      durationType: 'half_day',
      halfDaySession: 'first_half',
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      reason: 'Medical Checkup for dentist',
    });

    fixture.detectChanges();
    expect(component.form.valid).toBeTrue();

    component.submit();

    expect(leaveServiceSpy.applyLeave).toHaveBeenCalledWith(
      jasmine.objectContaining({
        leaveTypeId: 1,
        durationType: 'half_day',
        halfDaySession: 'first_half',
        startDate: '2026-10-01',
        endDate: '2026-10-01',
        reason: 'Medical Checkup for dentist',
      }),
    );
  });
});
