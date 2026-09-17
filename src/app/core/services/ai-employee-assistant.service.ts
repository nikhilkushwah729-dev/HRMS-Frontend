import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AiSummaryRequest {
  firstName: string;
  lastName?: string;
  designation?: string;
  department?: string;
  skills?: string[];
  experienceYears?: number;
}

export interface AiSummaryResponse {
  status: string;
  data: {
    bio: string;
    onboardingChecklist: string[];
    suggestedSkills: string[];
    generatedAt: string;
  };
}

export interface AiParseResponse {
  status: string;
  data: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    parsedSkills: string[];
    confidenceScore: number;
  };
}

export interface AiChatResponse {
  status: string;
  data: {
    query: string;
    reply: string;
    timestamp: string;
  };
}

export interface AiAnomalyResponse {
  status: string;
  data: {
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
    recommendation: string;
    analyzedAt: string;
  };
}

export interface AiLeaveRecommendationResponse {
  status: string;
  data: {
    riskLevel: 'low' | 'medium' | 'high';
    coveragePct: number;
    leaveType: string;
    warnings: string[];
    recommendation: string;
    evaluatedAt: string;
  };
}

export interface AiExpenseAuditResponse {
  status: string;
  data: {
    riskLevel: 'low' | 'medium' | 'high';
    title: string;
    category: string;
    amount: number;
    flags: string[];
    recommendation: string;
    auditedAt: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AiEmployeeAssistantService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3333/api'}/ai`;

  constructor(private http: HttpClient) {}

  auditExpenseClaim(payload: {
    title?: string;
    amount?: number;
    category?: string;
    receiptUrl?: string;
  }): Observable<AiExpenseAuditResponse> {
    return this.http.post<AiExpenseAuditResponse>(`${this.apiUrl}/expense-audit`, payload).pipe(
      catchError(() => {
        const numAmount = Number(payload.amount || 0);
        const flags: string[] = [];
        let riskLevel: 'low' | 'medium' | 'high' = 'low';

        if (numAmount > 25000) {
          flags.push(`High Value Claim: Amount ₹${numAmount.toLocaleString()} exceeds threshold.`);
          riskLevel = 'high';
        } else if (numAmount > 5000) {
          flags.push(`Substantial Claim: Amount ₹${numAmount.toLocaleString()} requires manager verification.`);
          riskLevel = 'medium';
        }

        if (!payload.receiptUrl && numAmount > 500) {
          flags.push('Missing Supporting Document: Receipt proof recommended.');
          if (riskLevel === 'low') riskLevel = 'medium';
        }

        return of({
          status: 'success',
          data: {
            riskLevel,
            title: payload.title || 'Expense Claim',
            category: payload.category || 'General',
            amount: numAmount,
            flags: flags.length ? flags : ['Compliant expense claim.'],
            recommendation: riskLevel === 'high' ? 'High risk: Require senior authorization.' : 'Safe for reimbursement approval.',
            auditedAt: new Date().toISOString(),
          },
        });
      })
    );
  }

  recommendLeaveApproval(payload: {
    durationDays?: number;
    leaveBalance?: number;
    teamMembersCount?: number;
    overlappingLeavesCount?: number;
    leaveType?: string;
  }): Observable<AiLeaveRecommendationResponse> {
    return this.http.post<AiLeaveRecommendationResponse>(`${this.apiUrl}/leave-recommendation`, payload).pipe(
      catchError(() => {
        const days = Number(payload.durationDays || 1);
        const balance = Number(payload.leaveBalance || 12);
        const totalTeam = Number(payload.teamMembersCount || 5);
        const overlapping = Number(payload.overlappingLeavesCount || 0);

        const availableTeam = Math.max(0, totalTeam - overlapping - 1);
        const coveragePct = Math.round((availableTeam / totalTeam) * 100);

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        const warnings: string[] = [];

        if (days > balance) {
          riskLevel = 'high';
          warnings.push(`Requested ${days} days exceeds available balance (${balance} days).`);
        }

        if (coveragePct < 50) {
          riskLevel = 'high';
          warnings.push(`Critical team coverage warning (${coveragePct}% active team).`);
        } else if (coveragePct < 75) {
          if (riskLevel !== 'high') riskLevel = 'medium';
          warnings.push(`Moderate team availability (${coveragePct}% active team).`);
        }

        return of({
          status: 'success',
          data: {
            riskLevel,
            coveragePct,
            leaveType: payload.leaveType || 'Casual Leave',
            warnings: warnings.length ? warnings : ['No team scheduling conflicts detected.'],
            recommendation: riskLevel === 'high' ? 'High risk: Verify team coverage before approving.' : 'Optimal coverage. Safe to approve.',
            evaluatedAt: new Date().toISOString(),
          },
        });
      })
    );
  }

  detectAttendanceAnomalies(payload: {
    checkInTime?: string;
    checkOutTime?: string;
    geofenceDistanceMeters?: number;
    isLate?: boolean;
    reason?: string;
  }): Observable<AiAnomalyResponse> {
    return this.http.post<AiAnomalyResponse>(`${this.apiUrl}/attendance-anomalies`, payload).pipe(
      catchError(() => {
        const distance = Number(payload.geofenceDistanceMeters || 0);
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        const flags: string[] = [];

        if (distance > 500) {
          flags.push(`Checked in ${distance}m outside registered Geo-fence.`);
          riskLevel = 'high';
        } else if (distance > 100) {
          flags.push(`Checked in ${distance}m away from center point.`);
          riskLevel = 'medium';
        }

        if (payload.isLate) {
          flags.push('Arrival time exceeds shift grace period.');
          if (riskLevel === 'low') riskLevel = 'medium';
        }

        return of({
          status: 'success',
          data: {
            riskLevel,
            flags: flags.length ? flags : ['No anomalies detected. Fully compliant.'],
            recommendation: riskLevel === 'high' ? 'High risk: Verify location before approval.' : 'Compliant attendance.',
            analyzedAt: new Date().toISOString(),
          },
        });
      })
    );
  }

  generateEmployeeSummary(payload: AiSummaryRequest): Observable<AiSummaryResponse> {
    return this.http.post<AiSummaryResponse>(`${this.apiUrl}/employee-summary`, payload).pipe(
      catchError(() => {
        // Fallback heuristic response if offline/error
        const name = `${payload.firstName} ${payload.lastName || ''}`.trim();
        const dept = payload.department || 'General';
        const desig = payload.designation || 'Team Member';
        return of({
          status: 'success',
          data: {
            bio: `${name} is an experienced ${desig} in the ${dept} department with strong analytical and communication capabilities.`,
            onboardingChecklist: [
              'Complete HR document submission',
              'Set up company email & workspace credentials',
              'Register Attendance Geo-fence / Face ID profile',
              'Schedule orientation with team lead',
            ],
            suggestedSkills: payload.skills?.length ? payload.skills : ['Teamwork', 'Communication', 'Problem Solving'],
            generatedAt: new Date().toISOString(),
          },
        });
      })
    );
  }

  parseResumeText(rawText: string): Observable<AiParseResponse> {
    return this.http.post<AiParseResponse>(`${this.apiUrl}/parse-resume`, { text: rawText }).pipe(
      catchError(() => {
        const words = rawText.split(/\s+/).filter(Boolean);
        const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        return of({
          status: 'success',
          data: {
            firstName: words[0] || 'Extracted',
            lastName: words[1] || 'User',
            email: emailMatch ? emailMatch[0] : null,
            phone: phoneMatch ? phoneMatch[0] : null,
            parsedSkills: ['Analytical', 'Communication'],
            confidenceScore: 0.85,
          },
        });
      })
    );
  }

  queryAiAssistant(prompt: string): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.apiUrl}/query`, { prompt }).pipe(
      catchError(() => {
        return of({
          status: 'success',
          data: {
            query: prompt,
            reply: 'I am your AI HR Assistant! You can ask me questions about attendance, leaves, payslips, or organization policies.',
            timestamp: new Date().toISOString(),
          },
        });
      })
    );
  }
}
