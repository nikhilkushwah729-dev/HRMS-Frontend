import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Project {
    id: number;
    name: string;
    description: string;
    deadline: string;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    progress: number;
    team_size: number;
    members?: ProjectMember[];
}

export interface ProjectMember {
    id: number;
    firstName?: string;
    first_name?: string;
}

export interface ProjectTask {
    id: number;
    project_id: number;
    title: string;
    description: string;
    status: string;
    due_date: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getProjects(): Observable<Project[]> {
        return this.http.get<any>(`${this.apiUrl}/projects`).pipe(
            map(res => res.data)
        );
    }

    createProject(project: Partial<Project>): Observable<Project> {
        return this.http.post<any>(`${this.apiUrl}/projects`, project).pipe(
            map(res => res.data)
        );
    }

    getProjectTasks(projectId: number): Observable<ProjectTask[]> {
        return this.http.get<any>(`${this.apiUrl}/projects/${projectId}/tasks`).pipe(
            map(res => res.data)
        );
    }

    createProjectTask(projectId: number, task: Partial<ProjectTask>): Observable<ProjectTask> {
        return this.http.post<any>(`${this.apiUrl}/projects/${projectId}/tasks`, task).pipe(
            map(res => res.data)
        );
    }
}
