import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserLimitService {
  private router = inject(Router);
  private _openModal = signal(false);

  get openModal() {
    return this._openModal();
  }

  showLimitModal() {
    this._openModal.set(true);
  }

  closeModal = () => {
    this._openModal.set(false);
  }

  upgrade() {
    this.router.navigateByUrl('/billing');
    this.closeModal();
  }
}
