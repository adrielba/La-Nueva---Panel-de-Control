import { TestBed } from '@angular/core/testing';

import { AmobServiciosService } from './amob-servicios.service';

describe('AmobServiciosService', () => {
  let service: AmobServiciosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmobServiciosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
