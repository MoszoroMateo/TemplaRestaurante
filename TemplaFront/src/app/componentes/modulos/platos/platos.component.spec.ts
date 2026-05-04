import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatosComponent } from './platos.component';

describe('PlatosComponent', () => {
  let component: PlatosComponent;
  let fixture: ComponentFixture<PlatosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
