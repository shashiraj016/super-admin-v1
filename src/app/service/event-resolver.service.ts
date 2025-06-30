import { Injectable } from '@angular/core';
import { MasterService } from './master.service';
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { EventResponse } from '../model/interface/master';

@Injectable({
  providedIn: 'root',
})
export class EventResolver implements Resolve<EventResponse | null> {
  constructor(private masterSrv: MasterService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<EventResponse | null> {
    const eventId = route.paramMap.get('eventId');
    console.log(eventId);
    if (eventId) {
      return this.masterSrv.eventById(eventId); // Fetches dealer data by ID
    } else {
      return of(null); // Returns null if no ID is provided
    }
  }
}
