import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaMesasComponent } from './mapa-mesas.component';

describe('MapaMesasComponent', () => {
  let component: MapaMesasComponent;
  let fixture: ComponentFixture<MapaMesasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaMesasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapaMesasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
