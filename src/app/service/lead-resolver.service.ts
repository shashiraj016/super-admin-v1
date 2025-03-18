import { Injectable } from '@angular/core';
import { MasterService } from './master.service';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { LeadResponse } from '../model/interface/master';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeadResolver implements Resolve<LeadResponse | null>  {
  constructor(private masterSrv: MasterService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<LeadResponse | null> {
    const leadId = route.paramMap.get('id');
    if (leadId) {
      return this.masterSrv.leadById(leadId); // Fetches dealer data by ID
    } else {
      return of(null); // Returns null if no ID is provided
    }
  }
}
