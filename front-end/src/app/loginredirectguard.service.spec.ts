import { TestBed } from '@angular/core/testing';

import { LoginredirectguardService } from './loginredirectguard.service';

describe('LoginredirectguardService', () => {
  let service: LoginredirectguardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoginredirectguardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
