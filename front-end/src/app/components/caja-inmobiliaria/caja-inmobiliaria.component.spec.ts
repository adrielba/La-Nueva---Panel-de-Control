import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajaInmobiliariaComponent } from './caja-inmobiliaria.component';

describe('CajaInmobiliariaComponent', () => {
  let component: CajaInmobiliariaComponent;
  let fixture: ComponentFixture<CajaInmobiliariaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CajaInmobiliariaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajaInmobiliariaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
