import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarCartonesComponent } from './buscar-cartones.component';

describe('BuscarCartonesComponent', () => {
  let component: BuscarCartonesComponent;
  let fixture: ComponentFixture<BuscarCartonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuscarCartonesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscarCartonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
