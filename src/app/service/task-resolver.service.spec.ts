import { TestBed } from '@angular/core/testing';

import { TaskResolverService } from './task-resolver.service';

describe('TaskResolverService', () => {
  let service: TaskResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
