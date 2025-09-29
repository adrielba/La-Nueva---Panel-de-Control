import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmobladosComponent } from './amoblados.component';

describe('AmobladosComponent', () => {
  let component: AmobladosComponent;
  let fixture: ComponentFixture<AmobladosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmobladosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmobladosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
