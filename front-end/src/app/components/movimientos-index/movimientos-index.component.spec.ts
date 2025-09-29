import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientosIndexComponent } from './movimientos-index.component';

describe('MovimientosIndexComponent', () => {
  let component: MovimientosIndexComponent;
  let fixture: ComponentFixture<MovimientosIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MovimientosIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovimientosIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
