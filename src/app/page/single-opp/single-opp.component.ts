import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OppResponse, TaskResponse } from '../../model/interface/master';
import { MasterService } from '../../service/master.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RouteTrackingServiceService } from '../../service/route-tracking-service.service';

@Component({
  selector: 'app-single-opp',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './single-opp.component.html',
  styleUrl: './single-opp.component.css',
})
export class SingleOppComponent implements OnInit {
  oppList = signal<OppResponse | null>(null); // WritableSignal to hold single TaskResponse
  masterSrv = inject(MasterService);
  oppData: OppResponse | undefined;
  previousRoutes!: string | null;
  previousRoute: string | null = null;
  previousId: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private routeTrackingService: RouteTrackingServiceService
  ) {}

  ngOnInit(): void {
    this.routeTrackingService.previousId$.subscribe((id) => {
      this.previousId = id;
    });

    // Optionally, get initial previous ID from local storage
    this.previousId = this.routeTrackingService.getPreviousId();

    // this.previousRoute = localStorage.getItem('previousRoute');
    // Load the lead data from resolver or route parameter
    this.route.data.subscribe((data) => {
      this.oppData = data['oppData'];
      if (this.oppData) {
        this.singleoppData(this.oppData.opportunity_id);
      } else {
        console.warn('Lead data not available from resolver.');
      }
    });

    // Handle any route params for leadId
    this.route.paramMap.subscribe((params) => {
      const oppId = params.get('oppId');
      if (oppId) {
        // window.location.reload();
        this.singleoppData(oppId);
      } else if (!this.oppData) {
        console.error('Lead ID not found in the URL and no resolver data.');
      }
    });
  }

  // Fetch single lead data by ID
  singleoppData(oppId: string): void {
    console.log('Fetching lead data for leadId:', oppId);
    this.masterSrv.oppById(oppId).subscribe({
      next: (res: OppResponse) => {
        this.oppList.set(res); // Set the single LeadResponse object to the signal
        console.log('Lead data fetched:', res);
      },
      error: (err: any) => {
        console.error('Error fetching lead data:', err);
      },
    });
  }

  // userId() {
  //   const path = window.location.pathname.split('/')[3];
  //   localStorage.setItem('previousRoute', path);
  // }
}
