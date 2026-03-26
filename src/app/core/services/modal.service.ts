import { Injectable, signal } from '@angular/core';

export interface ModalOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private isOpenSignal = signal<boolean>(false);
    private optionsSignal = signal<ModalOptions | null>(null);

    isOpen = this.isOpenSignal.asReadonly();
    options = this.optionsSignal.asReadonly();

    private resolveHandler: (value: boolean) => void = () => { };

    confirm(options: ModalOptions): Promise<boolean> {
        this.optionsSignal.set({
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            type: 'info',
            ...options
        });
        this.isOpenSignal.set(true);

        return new Promise((resolve) => {
            this.resolveHandler = resolve;
        });
    }

    handleConfirm() {
        this.isOpenSignal.set(false);
        this.resolveHandler(true);
    }

    handleCancel() {
        this.isOpenSignal.set(false);
        this.resolveHandler(false);
    }
}
