import { Injectable, signal } from '@angular/core';

export interface PrimaryAction {
    label: string;
    icon?: string;
    onClick: () => void;
    tone?: string;
    isVisible: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    sidebarOpen = signal(false);
    showSideBar = signal(true);
    showSidebarMenu = signal(true);
    primaryAction = signal<PrimaryAction | null>(null);

    setPrimaryAction(action: PrimaryAction | null) {
        this.primaryAction.set(action);
    }

    toggleSidebar() {
        this.sidebarOpen.update((open: boolean) => !open);
    }

    cycleDesktopSidebar() {
        const shouldExpand = !this.showSideBar();
        this.showSideBar.set(shouldExpand);
        this.showSidebarMenu.set(true);
    }

    expandDesktopSidebar() {
        this.showSideBar.set(true);
        this.showSidebarMenu.set(true);
    }

    openSidebar() {
        this.sidebarOpen.set(true);
    }

    closeSidebar() {
        this.sidebarOpen.set(false);
    }
}
