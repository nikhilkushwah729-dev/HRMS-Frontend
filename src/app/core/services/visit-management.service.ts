import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Visitor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  hostName: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'pending' | 'checked-in' | 'checked-out';
  purpose: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisitManagementService {
  private apiUrl = '/api/visits'; // Adjust to your backend

  constructor(private http: HttpClient) {}

  getActiveVisitors(): Observable<Visitor[]> {
    // Mock data - replace with real API
    return of([
        {
          id: '1',
          name: 'John Doe',
          company: 'ABC Corp',
          phone: '+1-234-567-8900',
          email: 'john@abccorp.com',
          hostName: 'Jane Smith',
          checkInTime: '2024-01-15T10:30:00',
          status: 'checked-in' as const,
          purpose: 'Business Meeting'
        }
    ]).pipe(delay(500));
  }

  addVisitor(visitor: Omit<Visitor, 'id' | 'status'>): Observable<Visitor> {
    return this.http.post<Visitor>(`${this.apiUrl}`, visitor);
  }

  checkInOut(visitorId: string, type: 'in' | 'out'): Observable<Visitor> {
    return this.http.put<Visitor>(`${this.apiUrl}/${visitorId}/${type}`, {});
  }

  getVisitorById(id: string): Observable<Visitor> {
    return this.http.get<Visitor>(`${this.apiUrl}/${id}`);
  }
}
