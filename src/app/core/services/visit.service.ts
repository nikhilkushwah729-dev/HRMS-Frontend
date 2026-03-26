import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Visitor {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  purpose: string;
  hostEmployeeId: number;
  hostName?: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getVisitors(status?: string): Observable<Visitor[]> {
    let url = `${this.apiUrl}/visitors`;
    if (status) url += `?status=${status}`;
    return this.http.get<any>(url).pipe(
      map(res => res.data || [])
    );
  }

  registerVisitor(data: Partial<Visitor>): Observable<Visitor> {
    return this.http.post<any>(`${this.apiUrl}/visitors`, data).pipe(
      map(res => res.data)
    );
  }

  updateVisitStatus(id: number, status: 'active' | 'completed' | 'rejected'): Observable<Visitor> {
    return this.http.put<any>(`${this.apiUrl}/visitors/${id}/status`, { status }).pipe(
      map(res => res.data)
    );
  }

  getVisitDetails(id: number): Observable<Visitor> {
    return this.http.get<any>(`${this.apiUrl}/visitors/${id}`).pipe(
      map(res => res.data)
    );
  }
}
