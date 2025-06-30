import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ProfileResponse } from '../../model/interface/master';
import { MasterService } from '../../service/master.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule], // Add CommonModule here
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  masterSrv = inject(MasterService);
  profileList = signal<ProfileResponse[]>([]);

  ngOnInit(): void {
    this.getProfileData();
  }

  getProfileData() {
    this.masterSrv.getProfileData().subscribe({
      next: (res: ProfileResponse) => {
        console.log('Fetched Profile Data:', res);
        this.profileList.set([res]); // Wrap single object in array if needed
      },
      error: (err) => {
        console.error('Error fetching profile data:', err);
        alert('Failed to fetch profile data.');
      },
    });
  }
}
