import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmobmovsComponent } from './amobmovs.component';

describe('AmobmovsComponent', () => {
  let component: AmobmovsComponent;
  let fixture: ComponentFixture<AmobmovsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmobmovsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmobmovsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
