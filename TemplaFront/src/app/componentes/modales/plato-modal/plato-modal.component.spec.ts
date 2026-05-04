import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatoModalComponent } from './plato-modal.component';

describe('PlatoModalComponent', () => {
  let component: PlatoModalComponent;
  let fixture: ComponentFixture<PlatoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
