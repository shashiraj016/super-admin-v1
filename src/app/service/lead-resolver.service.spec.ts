import { TestBed } from '@angular/core/testing';

import { LeadResolverService } from './lead-resolver.service';

describe('LeadResolverService', () => {
  let service: LeadResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeadResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
