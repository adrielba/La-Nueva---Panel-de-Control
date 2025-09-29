import { TestBed } from '@angular/core/testing';

import { InquilinosService } from './inquilinos.service';

describe('InquilinosService', () => {
  let service: InquilinosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InquilinosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
