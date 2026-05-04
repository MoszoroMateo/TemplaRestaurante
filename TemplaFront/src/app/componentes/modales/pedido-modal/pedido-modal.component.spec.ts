import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoModalComponent } from './pedido-modal.component';

describe('PedidoModalComponent', () => {
  let component: PedidoModalComponent;
  let fixture: ComponentFixture<PedidoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
