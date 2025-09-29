import { TestBed } from '@angular/core/testing';

import { PropiedadesService } from './propiedades.service';

describe('PropiedadesService', () => {
  let service: PropiedadesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropiedadesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
