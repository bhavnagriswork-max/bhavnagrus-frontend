import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css']
})
export class OrderSuccessComponent implements OnInit {
  orderNumber: string | null = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.orderNumber = this.route.snapshot.queryParamMap.get('id');
  }
}
