import { TestBed } from '@angular/core/testing';

import { OpportunitiesResolverService } from './opportunities-resolver.service';

describe('OpportunitiesResolverService', () => {
  let service: OpportunitiesResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpportunitiesResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
