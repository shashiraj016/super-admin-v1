import { TestBed } from '@angular/core/testing';

import { RouteTrackingServiceService } from './route-tracking-service.service';

describe('RouteTrackingServiceService', () => {
  let service: RouteTrackingServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteTrackingServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
