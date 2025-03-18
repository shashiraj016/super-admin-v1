import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskResponse, UserResponse } from '../../model/interface/master';
import { MasterService } from '../../service/master.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Users } from '../../model/class/users';

@Component({
  selector: 'app-single-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './single-user.component.html',
  styleUrl: './single-user.component.css',
})
export class SingleUserComponent implements OnInit {
  userList = signal<UserResponse | null>(null); // WritableSignal to hold single TaskResponse
  masterSrv = inject(MasterService);
  userData: UserResponse | undefined;
  userLists = signal<Users[]>([]);
  previousRoute!: string | null; 

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.previousRoute = localStorage.getItem('previousRoute');
    // Load the lead data from resolver or route parameter
    this.route.data.subscribe((data) => {
      this.userData = data['userData'];
      if (this.userData) {
        this.singleUserData(this.userData.user_id);
      } else {
        console.warn('Lead data not available from resolver.');
      }
    });

    // Handle any route params for leadId
    this.route.paramMap.subscribe((params) => {
      const userId = params.get('userId');
      if (userId) {
        this.singleUserData(userId);
      } else if (!this.userData) {
        console.error('Lead ID not found in the URL and no resolver data.');
      }
    });
  }

  // Fetch single lead data by ID
  singleUserData(userId: string): void {
    console.log('Fetching lead data for leadId:', userId);
    this.masterSrv.userById(userId).subscribe({
      next: (res: UserResponse) => {
        this.userList.set(res);
        console.log('Lead data fetched:', res);
      },
      error: (err: any) => {
        console.error('Error fetching lead data:', err);
      },
    });
  }
}
