import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogService, AuditAction, AuditModule } from './audit-log.service';

export interface Document {
    id: number;
    employeeId?: number;
    orgId: number;
    name: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    category: string;
    description?: string;
    uploadedBy: number;
    uploadedAt: string;
    employee?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private http = inject(HttpClient);
    private auditLogService = inject(AuditLogService);
    private readonly apiUrl = environment.apiUrl;

    private normalizeDocument(raw: any): Document {
        return {
            id: Number(raw.id),
            employeeId: raw.employeeId ?? raw.employee_id,
            orgId: Number(raw.orgId ?? raw.org_id ?? 0),
            name: raw.name,
            fileName: raw.fileName ?? raw.file_name,
            filePath: raw.filePath ?? raw.file_path,
            fileSize: Number(raw.fileSize ?? raw.file_size ?? 0),
            mimeType: raw.mimeType ?? raw.mime_type ?? 'application/octet-stream',
            category: raw.category ?? 'other',
            description: raw.description,
            uploadedBy: Number(raw.uploadedBy ?? raw.uploaded_by ?? 0),
            uploadedAt: raw.uploadedAt ?? raw.uploaded_at,
            employee: raw.employee ? {
                id: Number(raw.employee.id),
                firstName: raw.employee.firstName ?? raw.employee.first_name,
                lastName: raw.employee.lastName ?? raw.employee.last_name,
                email: raw.employee.email
            } : undefined
        };
    }

    /**
     * Get list of documents
     */
    getDocuments(): Observable<Document[]> {
        return this.http.get<any>(`${this.apiUrl}/documents`).pipe(
            map(res => {
                const records = Array.isArray(res) ? res : (res?.data || res?.documents || []);
                return records.map((item: any) => this.normalizeDocument(item));
            }),
            catchError(() => of([]))
        );
    }

    /**
     * Upload a document
     */
    uploadDocument(file: File, metadata: {
        name?: string;
        category?: string;
        description?: string;
        employeeId?: number;
    } = {}): Observable<{ progress: number; document?: Document }> {
        const formData = new FormData();
        formData.append('file', file);
        
        if (metadata.name) formData.append('name', metadata.name);
        if (metadata.category) formData.append('category', metadata.category);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.employeeId) formData.append('employeeId', metadata.employeeId.toString());

        const req = new HttpRequest('POST', `${this.apiUrl}/documents`, formData, {
            reportProgress: true
        });

        return new Observable(observer => {
            this.http.request(req).subscribe({
                next: (event) => {
                    if (event.type === HttpEventType.UploadProgress && event.total) {
                        const progress = Math.round(100 * event.loaded / event.total);
                        observer.next({ progress });
                    } else if (event.type === HttpEventType.Response) {
                        const body = event.body as any;
                        const document = this.normalizeDocument(body?.data || body);
                        
                        // Log audit
                        this.auditLogService.logAction(
                            AuditAction.CREATE,
                            AuditModule.API,
                            {
                                entityName: 'Document',
                                entityId: document.id.toString(),
                                newValues: {
                                    name: document.name,
                                    fileName: document.fileName,
                                    category: document.category,
                                    fileSize: document.fileSize
                                }
                            }
                        ).subscribe();
                        
                        observer.next({ progress: 100, document });
                        observer.complete();
                    }
                },
                error: (err) => observer.error(err)
            });
        });
    }

    /**
     * Delete a document
     */
    deleteDocument(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/documents/${id}`).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.DELETE,
                    AuditModule.API,
                    {
                        entityName: 'Document',
                        entityId: id.toString()
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Download a document
     */
    downloadDocument(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/documents/${id}/download`, {
            responseType: 'blob'
        }).pipe(
            tap(() => {
                this.auditLogService.logAction(
                    AuditAction.DOWNLOAD,
                    AuditModule.API,
                    {
                        entityName: 'Document',
                        entityId: id.toString()
                    }
                ).subscribe();
            })
        );
    }

    /**
     * Get documents by category
     */
    getDocumentsByCategory(category: string): Observable<Document[]> {
        return this.http.get<any>(`${this.apiUrl}/documents?category=${category}`).pipe(
            map(res => {
                const records = Array.isArray(res) ? res : (res?.data || res?.documents || []);
                return records.map((item: any) => this.normalizeDocument(item));
            }),
            catchError(() => of([]))
        );
    }

    /**
     * Get documents for a specific employee
     */
    getEmployeeDocuments(employeeId: number): Observable<Document[]> {
        return this.http.get<any>(`${this.apiUrl}/documents?employeeId=${employeeId}`).pipe(
            map(res => {
                const records = Array.isArray(res) ? res : (res?.data || res?.documents || []);
                return records.map((item: any) => this.normalizeDocument(item));
            }),
            catchError(() => of([]))
        );
    }
}

