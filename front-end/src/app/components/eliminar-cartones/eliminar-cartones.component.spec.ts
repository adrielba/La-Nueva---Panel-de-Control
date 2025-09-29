import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarCartonesComponent } from './eliminar-cartones.component';

describe('EliminarCartonesComponent', () => {
  let component: EliminarCartonesComponent;
  let fixture: ComponentFixture<EliminarCartonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EliminarCartonesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarCartonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
