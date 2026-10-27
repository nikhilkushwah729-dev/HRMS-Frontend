import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlatformPlansManagerComponent } from './platform-plans-manager.component';
import { PlatformCatalogAddon, PlatformPlan, PlatformService } from '../../../core/services/platform.service';
import { ToastService } from '../../../core/services/toast.service';

describe('PlatformPlansManagerComponent (Phase 3C Unit Spec)', () => {
  let component: PlatformPlansManagerComponent;
  let fixture: ComponentFixture<PlatformPlansManagerComponent>;
  let platformServiceSpy: jasmine.SpyObj<PlatformService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockPlans: PlatformPlan[] = [
    {
      id: 1,
      name: 'Free Trial',
      slug: 'trial',
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'INR',
      userLimit: 20,
      storageLimitMb: 512,
      durationDays: 7,
      features: { trial: true },
      modules: ['ESS', 'Attendance', 'Leaves'],
      isActive: true,
      isPublic: true,
      isTrialPlan: true,
      sortOrder: 0,
      activeSubscriptionsCount: 3,
      featureLimits: [
        { featureKey: 'limit.users', isEnabled: true, limitValue: '20' },
      ],
    },
    {
      id: 2,
      name: 'Pro Tier',
      slug: 'pro-tier',
      price: 1499,
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      currency: 'INR',
      userLimit: 100,
      storageLimitMb: 5120,
      durationDays: 30,
      features: {},
      modules: ['ESS', 'Attendance', 'Leaves', 'Visits'],
      isActive: true,
      isPublic: true,
      isTrialPlan: false,
      sortOrder: 1,
      activeSubscriptionsCount: 8,
      featureLimits: [],
    },
    {
      id: 3,
      name: 'Archived Legacy Plan',
      slug: 'legacy',
      price: 499,
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: 'INR',
      userLimit: 10,
      storageLimitMb: 256,
      durationDays: 30,
      features: {},
      modules: ['ESS'],
      isActive: false,
      isPublic: false,
      isTrialPlan: false,
      sortOrder: 2,
      activeSubscriptionsCount: 0,
      featureLimits: [],
    },
  ];

  const mockAddons: PlatformCatalogAddon[] = [
    {
      id: 1,
      name: 'Attendance Core',
      slug: 'attendance',
      price: 300,
      isActive: true,
      activeOrganizationsCount: 5,
    },
    {
      id: 2,
      name: 'Leave & Time Off',
      slug: 'leaveandtimeoff',
      price: 300,
      isActive: true,
      activeOrganizationsCount: 4,
    },
  ];

  beforeEach(async () => {
    platformServiceSpy = jasmine.createSpyObj('PlatformService', [
      'getPlans',
      'getAddons',
      'createPlan',
      'updatePlan',
      'togglePlan',
      'updateAddon',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    platformServiceSpy.getPlans.and.returnValue(of(mockPlans));
    platformServiceSpy.getAddons.and.returnValue(of(mockAddons));

    await TestBed.configureTestingModule({
      imports: [PlatformPlansManagerComponent],
      providers: [
        { provide: PlatformService, useValue: platformServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformPlansManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. Initializes and loads catalog plans and add-ons from platformService', () => {
    expect(platformServiceSpy.getPlans).toHaveBeenCalled();
    expect(platformServiceSpy.getAddons).toHaveBeenCalled();
    expect(component.plans().length).toBe(3);
    expect(component.addons().length).toBe(2);
    expect(component.isLoading()).toBeFalse();
  });

  it('2. Filters plans by status (all, active, public, trial)', () => {
    component.filterStatus.set('active');
    expect(component.filteredPlans().length).toBe(2);

    component.filterStatus.set('trial');
    expect(component.filteredPlans().length).toBe(1);
    expect(component.filteredPlans()[0].slug).toBe('trial');

    component.filterStatus.set('public');
    expect(component.filteredPlans().length).toBe(2);
  });

  it('3. Filters plans by search query matching name, slug, or included modules', () => {
    component.searchQuery.set('pro-tier');
    expect(component.filteredPlans().length).toBe(1);
    expect(component.filteredPlans()[0].name).toBe('Pro Tier');

    component.searchQuery.set('Visits');
    expect(component.filteredPlans().length).toBe(1);
    expect(component.filteredPlans()[0].slug).toBe('pro-tier');
  });

  it('4. Enforces Attendance Core prerequisite when toggling dependent modules', () => {
    component.createPlanModules = new Set(['ESS']);
    expect(component.hasAttendanceDependencyError()).toBeFalse();

    // Adding FaceRecognition without Attendance should auto-enable Attendance Core
    component.toggleCreatePlanModule('FaceRecognition');
    expect(component.createPlanModules.has('FaceRecognition')).toBeTrue();
    expect(component.createPlanModules.has('Attendance')).toBeTrue();
    expect(toastServiceSpy.info).toHaveBeenCalledWith(jasmine.stringMatching(/Attendance Core was automatically enabled/));
  });

  it('5. Catches and displays server-side validation error when updating plan fails', () => {
    component.openEditPlanModal(mockPlans[1]);
    expect(component.showEditPlanModal()).toBeTrue();

    const serverError = { error: { message: 'Cannot remove modules from a plan with active paid subscriptions' } };
    platformServiceSpy.updatePlan.and.returnValue(throwError(() => serverError));

    component.submitEditPlan();
    expect(component.isSubmitting()).toBeFalse();
    expect(component.formError()).toBe('Cannot remove modules from a plan with active paid subscriptions');
  });

  it('6. Handles plan toggle activation and deactivation cleanly', () => {
    const targetPlan = mockPlans[0];
    component.confirmTogglePlan(targetPlan);
    expect(component.showToggleConfirmModal()).toBeTrue();
    expect(component.targetTogglePlan()?.id).toBe(targetPlan.id);

    platformServiceSpy.togglePlan.and.returnValue(of({ ...targetPlan, isActive: false }));
    component.executeTogglePlan();

    expect(platformServiceSpy.togglePlan).toHaveBeenCalledWith(targetPlan.id);
    expect(toastServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching(/was deactivated/));
    expect(component.showToggleConfirmModal()).toBeFalse();
  });
});
