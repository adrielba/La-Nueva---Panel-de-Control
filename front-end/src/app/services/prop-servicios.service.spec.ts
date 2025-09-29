import { TestBed } from '@angular/core/testing';

import { PropServiciosService } from './prop-servicios.service';

describe('PropServiciosService', () => {
  let service: PropServiciosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropServiciosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
