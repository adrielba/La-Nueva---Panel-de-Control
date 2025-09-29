import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientosPropComponent } from './movimientos-prop.component';

describe('MovimientosPropComponent', () => {
  let component: MovimientosPropComponent;
  let fixture: ComponentFixture<MovimientosPropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MovimientosPropComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovimientosPropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
