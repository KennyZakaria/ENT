import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ifram-calender',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ifram-calender.component.html',
  styleUrls: ['./ifram-calender.component.css']
})
export class IframCalenderComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    // Ensure iframe loads properly
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.onload = () => {
        iframe.style.opacity = '1';
      };
    }
  }
}
