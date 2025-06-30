import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // This makes it available throughout your application
})

//   // Export the response structure
export class Teams {
  team_id: string;
  team_name: string;

    team_lead_id: string;
        team_lead_email: string;
        total_teams: number;
      
  constructor() {
    this.team_id = '';
    this.team_name = '';
        this.team_lead_id = '';
       this. team_lead_email = '';
       this.total_teams=0;
    
  }
}
