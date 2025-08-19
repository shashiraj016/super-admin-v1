// shared.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private selectedDealerSource = new BehaviorSubject<any>(null);
  selectedDealer$ = this.selectedDealerSource.asObservable();

  setSelectedDealer(dealer: any) {
    this.selectedDealerSource.next(dealer);
  }
}
