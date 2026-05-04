import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MpResultadoComponent } from './mp-resultado.component';

describe('MpResultadoComponent', () => {
  let component: MpResultadoComponent;
  let fixture: ComponentFixture<MpResultadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MpResultadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MpResultadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
