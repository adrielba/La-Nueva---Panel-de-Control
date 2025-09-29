import { TestBed } from '@angular/core/testing';

import { PropietariosService } from './propietarios.service';

describe('PropietariosService', () => {
  let service: PropietariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropietariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
