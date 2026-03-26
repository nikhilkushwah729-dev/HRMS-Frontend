import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TopLoaderService {
  private _loading = signal(false);
  
  get loadingSignal() {
    return this._loading;
  }

  get loading() {
    return this._loading();
  }

  show() {
    this._loading.set(true);
  }

  hide() {
    this._loading.set(false);
  }
}
