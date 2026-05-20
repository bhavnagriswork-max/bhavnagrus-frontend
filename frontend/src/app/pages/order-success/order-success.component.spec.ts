import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { OrderSuccessComponent } from './order-success.component';

describe('OrderSuccessComponent', () => {
  let component: OrderSuccessComponent;
  let fixture: ComponentFixture<OrderSuccessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      declarations: [OrderSuccessComponent]
    });
    fixture = TestBed.createComponent(OrderSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
