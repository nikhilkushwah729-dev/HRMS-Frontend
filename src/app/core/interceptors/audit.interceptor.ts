import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, tap, finalize } from 'rxjs';
import { AuditLogService, AuditAction, AuditModule } from '../services/audit-log.service';

/**
 * Audit Interceptor
 * 
 * This interceptor automatically logs HTTP requests and responses for audit purposes.
 * It captures:
 * - API request details
 * - Response status
 * - Response time
 * - Error information (for failed requests)
 * 
 * Configuration:
 * - Use 'X-Audit-Log' header to skip logging for specific requests
 * - Use 'X-Audit-Module' header to specify the module (defaults to 'api')
 * - Use 'X-Audit-Action' header to specify the action (defaults to 'VIEW')
 * - Use 'X-Audit-Entity-Name' header to specify entity name
 * - Use 'X-Audit-Entity-Id' header to specify entity ID
 */

export const auditInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  const auditLogService = inject(AuditLogService);
  
  // Skip audit logging if header is set to 'false'
  const skipAudit = req.headers.get('X-Audit-Log') === 'false';
  if (skipAudit) {
    return next(req);
  }
  
  const startTime = Date.now();
  
  // Extract audit metadata from headers
  const auditModule = req.headers.get('X-Audit-Module') || 'api';
  const auditAction = req.headers.get('X-Audit-Action') || 'VIEW';
  const auditEntityName = req.headers.get('X-Audit-Entity-Name') || undefined;
  const auditEntityId = req.headers.get('X-Audit-Entity-Id') || undefined;
  
  // Clone request without audit headers
  const cleanReq = req.clone({
    headers: req.headers.delete('X-Audit-Log')
      .delete('X-Audit-Module')
      .delete('X-Audit-Action')
      .delete('X-Audit-Entity-Name')
      .delete('X-Audit-Entity-Id')
  });
  
  return next(cleanReq).pipe(
    tap({
      next: (event) => {
        // Log on successful response
        if (event.type === 0) {
          // This is HttpSentEvent, wait for response
          return;
        }
        
        const responseTime = Date.now() - startTime;
        
        // Only log for successful responses with body (not just HttpSentEvent)
        // Skip audit-log endpoints to prevent logging our own audit calls
        if (event.type === 4 && req.method !== 'GET' && !req.url.includes('/audit-logs')) {
          // For mutations (POST, PUT, PATCH, DELETE), log the action
          const action = getActionFromHttpMethod(req.method);
          logAuditEvent(
            auditLogService,
            action,
            auditModule,
            auditEntityName || extractEntityNameFromUrl(req.url),
            auditEntityId,
            { 
              method: req.method, 
              url: req.url,
              status: event.status,
              responseTime: `${responseTime}ms`
            },
            undefined
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        // Skip logging errors for audit-log endpoints to prevent infinite loops
        // when the backend doesn't have the audit-logs route
        if (req.url.includes('/audit-logs')) {
          return;
        }
        
        // Log on error response
        const responseTime = Date.now() - startTime;
        
        // Determine error action based on status
        let errorAction = 'VIEW';
        if (error.status === 401) {
          errorAction = 'LOGIN_FAILED';
        } else if (error.status === 403) {
          errorAction = 'LOCK';
        } else if (error.status >= 500) {
          errorAction = 'DELETE';
        }
        
        logAuditEvent(
          auditLogService,
          errorAction,
          auditModule,
          auditEntityName || extractEntityNameFromUrl(req.url),
          auditEntityId,
          { 
            method: req.method, 
            url: req.url,
            status: error.status,
            error: error.message,
            responseTime: `${responseTime}ms`
          },
          undefined
        );
      }
    }),
    finalize(() => {
      // This runs after both success and error
      const responseTime = Date.now() - startTime;
      
      // Log GET requests for important endpoints (but not all - to avoid spam)
      if (req.method === 'GET' && shouldLogGetRequest(req.url)) {
        logAuditEvent(
          auditLogService,
          'VIEW',
          auditModule,
          auditEntityName || extractEntityNameFromUrl(req.url),
          auditEntityId,
          { 
            method: req.method, 
            url: req.url,
            responseTime: `${responseTime}ms`
          },
          undefined
        );
      }
    })
  );
};

/**
 * Helper function to determine action from HTTP method
 */
function getActionFromHttpMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'VIEW';
  }
}

/**
 * Determine if we should log a GET request
 */
function shouldLogGetRequest(url: string): boolean {
  // Skip audit-log endpoints to prevent loops when backend doesn't have the route
  if (url.includes('/audit-logs')) {
    return false;
  }
  
  const importantEndpoints = [
    '/api/employees/',
    '/api/leaves/',
    '/api/payroll/',
    '/api/projects/',
    '/api/attendance/',
    '/api/expenses/',
    '/api/timesheets/',
    '/api/settings/',
    '/api/organization/'
  ];
  
  return importantEndpoints.some(endpoint => url.includes(endpoint));
}

/**
 * Extract entity name from URL
 */
function extractEntityNameFromUrl(url: string): string {
  const match = url.match(/\/api\/(\w+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Log audit event - Non-blocking (errors are silently ignored)
 * This ensures audit logging failures don't break the main application flow
 */
function logAuditEvent(
  auditLogService: AuditLogService,
  action: string,
  module: string,
  entityName: string | undefined,
  entityId: string | undefined,
  newValues: any,
  oldValues: any
): void {
  // Skip logging for LOGIN_FAILED and LOCK actions to avoid infinite loops
  // when the backend doesn't have the audit-logs route
  if (action === 'LOGIN_FAILED' || action === 'LOCK') {
    return;
  }
  
  // Skip if no user (public endpoints) - check localStorage
  const storedUser = localStorage.getItem('hrms_user_data');
  if (!storedUser || storedUser === 'null') {
    return;
  }
  
  // Determine module based on entity or use provided
  let auditModule = AuditModule.API;
  if (module.includes('employee')) auditModule = AuditModule.EMPLOYEES;
  else if (module.includes('leave')) auditModule = AuditModule.LEAVES;
  else if (module.includes('payroll')) auditModule = AuditModule.PAYROLL;
  else if (module.includes('project')) auditModule = AuditModule.PROJECTS;
  else if (module.includes('attendance')) auditModule = AuditModule.ATTENDANCE;
  else if (module.includes('expense')) auditModule = AuditModule.EXPENSES;
  else if (module.includes('timesheet')) auditModule = AuditModule.TIMESHEETS;
  else if (module.includes('organization')) auditModule = AuditModule.ORGANIZATION;
  else if (module.includes('settings')) auditModule = AuditModule.SETTINGS;
  else if (module.includes('auth')) auditModule = AuditModule.AUTH;
  
  auditLogService.logAction(
    action as AuditAction,
    auditModule,
    {
      entityName,
      entityId,
      oldValues,
      newValues
    }
  ).subscribe({
    // Silently ignore errors - audit logging should never break the app
    error: () => {}
  });
}

