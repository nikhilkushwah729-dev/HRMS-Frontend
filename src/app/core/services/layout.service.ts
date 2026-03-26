import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    sidebarOpen = signal(false);

    toggleSidebar() {
        this.sidebarOpen.update(open => !open);
    }

    closeSidebar() {
        this.sidebarOpen.set(false);
    }
}
