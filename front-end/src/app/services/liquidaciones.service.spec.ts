import { TestBed } from '@angular/core/testing';

import { LiquidacionesService } from './liquidaciones.service';

describe('LiquidacionesService', () => {
  let service: LiquidacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiquidacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
