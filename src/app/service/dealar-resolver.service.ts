import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  DealerResponse,
  SingleDealerResponse,
} from '../model/interface/master';
import { MasterService } from './master.service';

@Injectable({
  providedIn: 'root',
})
export class DealerResolver implements Resolve<SingleDealerResponse | null> {

  
  constructor(private masterSrv: MasterService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<SingleDealerResponse | null> {
    const dealerId = route.paramMap.get('id');
    if (dealerId) {
      return this.masterSrv.getDealerById(dealerId); // Fetches dealer data by ID
    } else {
      return of(null); // Returns null if no ID is provided
    }
  }
}
