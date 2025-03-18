import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { SharedModule } from '../../shared/shared.module'

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [SharedModule], 
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent {

}
