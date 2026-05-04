import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesaModalComponent } from './mesa-modal.component';

describe('MesaModalComponent', () => {
  let component: MesaModalComponent;
  let fixture: ComponentFixture<MesaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesaModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
