import { TestBed } from '@angular/core/testing';

import { AmobladosService } from './amoblados.service';

describe('AmobladosService', () => {
  let service: AmobladosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmobladosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
