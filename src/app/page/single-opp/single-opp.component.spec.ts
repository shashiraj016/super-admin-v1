import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleOppComponent } from './single-opp.component';

describe('SingleOppComponent', () => {
  let component: SingleOppComponent;
  let fixture: ComponentFixture<SingleOppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleOppComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleOppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
