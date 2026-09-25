import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AttendanceDataTableComponent } from './attendance-table.component';
import { AttendanceRecord, AttendanceService } from '../../../core/services/attendance.service';

describe('AttendanceDataTableComponent (UI Rebuild Spec)', () => {
  let component: AttendanceDataTableComponent;
  let fixture: ComponentFixture<AttendanceDataTableComponent>;
  let attendanceServiceSpy: jasmine.SpyObj<AttendanceService>;

  const mockRecords: AttendanceRecord[] = [
    {
      id: 101,
      employee_id: 1,
      date: '2026-09-25',
      check_in: '2026-09-25T09:00:00Z',
      check_out: '2026-09-25T17:30:00Z',
      selfie_url: null,
      status: 'present',
      is_late: false,
      is_half_day: false,
      total_break_min: 30,
      net_work_hours: 8.5,
      work_hours: 8.5,
      source: 'web',
      notes: undefined,
      created_at: '2026-09-25T09:00:00.000Z',
    },
    {
      id: 102,
      employee_id: 2,
      date: '2026-09-25',
      check_in: '2026-09-25T13:00:00Z',
      check_out: '2026-09-25T17:30:00Z',
      selfie_url: null,
      status: 'half_day',
      is_late: false,
      is_half_day: true,
      total_break_min: 0,
      net_work_hours: 4.5,
      work_hours: 4.5,
      source: 'web',
      notes: undefined,
      created_at: '2026-09-25T13:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    attendanceServiceSpy = jasmine.createSpyObj('AttendanceService', ['getAttendanceHistory', 'getAllAttendance']);
    attendanceServiceSpy.getAttendanceHistory.and.returnValue(of(mockRecords));
    attendanceServiceSpy.getAllAttendance.and.returnValue(of(mockRecords));

    await TestBed.configureTestingModule({
      imports: [AttendanceDataTableComponent],
      providers: [
        { provide: AttendanceService, useValue: attendanceServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create AttendanceDataTableComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render skeleton loading rows when loading signal is true', () => {
    component.loading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonRows = compiled.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('should calculate totalPages correctly based on records length and pageSize', () => {
    component.records.set(mockRecords);
    component.pageSize = 1;
    fixture.detectChanges();

    expect(component.totalPages).toBe(2);
  });

  it('should update currentPage on pagination', () => {
    expect(component.currentPage).toBe(1);
    component.currentPage = 2;
    fixture.detectChanges();
    expect(component.currentPage).toBe(2);
  });

  it('should format status pill styles correctly for half_day and present', () => {
    expect(component.getStatusClass('half_day')).toContain('indigo');
    expect(component.getStatusClass('present')).toContain('emerald');
  });
});
