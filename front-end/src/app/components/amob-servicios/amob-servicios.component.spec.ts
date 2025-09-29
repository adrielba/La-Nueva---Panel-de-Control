import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmobServiciosComponent } from './amob-servicios.component';

describe('AmobServiciosComponent', () => {
  let component: AmobServiciosComponent;
  let fixture: ComponentFixture<AmobServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmobServiciosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmobServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
