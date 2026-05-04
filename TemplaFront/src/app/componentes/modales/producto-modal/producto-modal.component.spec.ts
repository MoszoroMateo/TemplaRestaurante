import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoModalComponent } from './producto-modal.component';

describe('ProductoModalComponent', () => {
  let component: ProductoModalComponent;
  let fixture: ComponentFixture<ProductoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
