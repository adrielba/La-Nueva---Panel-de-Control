import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargarPostaComponent } from './cargar-posta.component';

describe('CargarPostaComponent', () => {
  let component: CargarPostaComponent;
  let fixture: ComponentFixture<CargarPostaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CargarPostaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargarPostaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
