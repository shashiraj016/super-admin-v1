import { TestBed } from '@angular/core/testing';

import { DealarResolverService } from './dealar-resolver.service';

describe('DealarResolverService', () => {
  let service: DealarResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DealarResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
