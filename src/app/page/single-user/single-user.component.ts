import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MasterService } from '../../service/master.service';
import { UserResponse } from '../../model/interface/master';
import { Users } from '../../model/class/users';
import { RouterModule } from '@angular/router'; // ✅ Import RouterModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-single-user',
  standalone: true,
  imports: [RouterModule, CommonModule], // ✅ Add RouterModule here

  templateUrl: './single-user.component.html',
  styleUrl: './single-user.component.css',
})
export class SingleUserComponent implements OnInit {
  masterSrv = inject(MasterService);
  userData: Users | undefined; // ✅ Store single user data
  previousRoute!: string | null;
  userList = signal<Users | null>(null); // ✅ Store only ONE user

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.previousRoute = localStorage.getItem('previousRoute');
    debugger;
    // ✅ Load user data from resolver
    this.route.data.subscribe((data) => {
      console.log('Resolved userData:', data['userData']); // Debugging
      if (
        data['userData'] &&
        Array.isArray(data['userData'].data) &&
        data['userData'].data.length > 0
      ) {
        this.userData = data['userData'].data[0]; // ✅ Store first user
      } else {
        console.warn('User data not available.');
      }
    });

    this.route.paramMap.subscribe((params) => {
      const userId = params.get('user_id'); // Changed from 'userId' to 'user_id'
      if (userId) {
        this.fetchSingleUser(userId);
      }
    });
  }

  fetchSingleUser(userId: string): void {
    console.log('Calling fetchSingleUser with ID:', userId);

    this.masterSrv.userById(userId).subscribe({
      next: (res: any) => {
        // Use 'any' for debugging
        console.log('API Response:', res);
        debugger;
        if (
          res &&
          res.status === 200 &&
          res.data &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          console.log('User found:', res.data[0]);
          this.userList.set(res.data[0]);
          console.log('UserList signal after setting:', this.userList());
        } else {
          console.error('Invalid or empty response:', res);
        }
      },
      error: (err) => {
        console.error('API Error:', err);

        // Try to extract more information about the error
        if (err.error) console.error('Error details:', err.error);
        if (err.message) console.error('Error message:', err.message);
        if (err.status) console.error('Error status:', err.status);
      },
      complete: () => {
        console.log('API call completed');
      },
    });
  }
}
