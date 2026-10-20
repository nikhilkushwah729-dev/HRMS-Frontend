import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { switchMap, of, take } from 'rxjs';

/**
 * Subscription Guard — blocks navigation to any protected route when:
 *  - Trial has expired (trialDaysRemaining === 0 AND isTrialActive is false or status is expired/grace)
 *  - OR subscriptionStatus is 'expired'
 *
 * Redirects to /billing so the user can upgrade.
 * /billing, /auth/** are always allowed.
 */
export const subscriptionGuard: CanActivateFn = (route) => {
  const subService = inject(SubscriptionService);
  const router = inject(Router);

  // Always allow billing page itself
  const url = route.routeConfig?.path ?? '';
  if (url === 'billing') return true;

  // If status already loaded in signal — fast path
  const current = subService.status();
  if (current) {
    return checkAccess(current, router);
  }

  // Status not yet loaded — fetch it first
  return subService.getStatus().pipe(
    take(1),
    switchMap((status) => of(checkAccess(status, router)))
  );
};

function checkAccess(status: ReturnType<SubscriptionService['status']>, router: Router): boolean {
  if (!status || !status.organization) return true; // If no status info, allow (fail open)

  // If user has an active paid subscription (not trial), allow access
  const hasPaidActivePlan = status.currentSubscription?.status === 'active' &&
                            status.plan &&
                            !status.plan.isTrialPlan &&
                            !status.organization.isTrialActive;
  if (hasPaidActivePlan) {
    return true;
  }

  const orgStatus = status.organization.subscriptionStatus;
  const daysLeft = status.trialDaysRemaining;
  const isReadOnly = Boolean(status.organization.readOnlyMode);

  // Block if:
  // 1. Trial has 0 or fewer days remaining
  // 2. Organization subscription is expired, grace, cancelled, or read-only mode
  const trialExpired = daysLeft !== null && daysLeft !== undefined && daysLeft <= 0;
  const subExpired = ['expired', 'grace', 'cancelled', 'unpaid'].includes(orgStatus || '') || isReadOnly;
  const isBlocked = trialExpired || subExpired;

  if (isBlocked) {
    router.navigate(['/billing'], { queryParams: { reason: 'trial_expired' } });
    return false;
  }

  return true;
}
