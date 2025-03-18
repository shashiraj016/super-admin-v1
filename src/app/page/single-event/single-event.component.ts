import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventResponse } from '../../model/interface/master';
import { MasterService } from '../../service/master.service';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-single-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './single-event.component.html',
  styleUrl: './single-event.component.css',
})
export class SingleEventComponent implements OnInit {
  eventList = signal<EventResponse | null>(null); // WritableSignal to hold single LeadResponse
  masterSrv = inject(MasterService);
  eventData: EventResponse | undefined;
  previousRoute!: string | null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
      this.previousRoute = localStorage.getItem('previousRoute');
    this.route.data.subscribe((data) => {
      this.eventData = data['leadData'];
      // console.log('I am from eventData', this.eventData?.event_id);
      if (this.eventData) {
        this.eventById(this.eventData.event_id);
      } else {
        console.warn('event data not available from resolver.');
      }
    });

    // Handle any route params for leadId
    this.route.paramMap.subscribe((params) => {
      const eventId = params.get('eventId');
      if (eventId) {
        this.eventById(eventId);
      } else if (!this.eventData) {
        console.error('event ID not found in the URL and no resolver data.');
      }
    });
  }

  // Fetch single lead data by ID
  eventById(eventId: string) {
    console.log('Fetching lead data for leadId:', eventId);
    this.masterSrv.eventById(eventId).subscribe({
      next: (res: EventResponse) => {
        this.eventList.set(res); // Set the single LeadResponse object to the signal
        console.log('Lead data fetched:', res);
      },
      error: (err: any) => {
        console.error('Error fetching lead data:', err);
      },
    });
  }
}
