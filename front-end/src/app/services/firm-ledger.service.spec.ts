import { TestBed } from '@angular/core/testing';

import { FirmLedgerService } from './firm-ledger.service';

describe('FirmLedgerService', () => {
  let service: FirmLedgerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirmLedgerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
