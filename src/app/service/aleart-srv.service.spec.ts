import { TestBed } from '@angular/core/testing';

import { AleartSrvService } from './aleart-srv.service';

describe('AleartSrvService', () => {
  let service: AleartSrvService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AleartSrvService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
