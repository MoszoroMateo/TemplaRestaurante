import { TestBed } from '@angular/core/testing';

import { PlatoService } from '../services/plato.service';

describe('PlatoService', () => {
  let service: PlatoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlatoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
