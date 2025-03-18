import { Component, inject, OnInit, Signal, signal } from '@angular/core';
import {
  Lead,
  SingleDealerResponse,
  UserResponse,
} from '../../model/interface/master';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { MasterService } from '../../service/master.service';
import { Users } from '../../model/class/users';
import { Tasks } from '../../model/class/tasks';
import { Events } from '../../model/class/event';
import { Leads } from '../../model/class/leads';
import { Opportunities } from '../../model/class/opportunities';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { param } from 'jquery';
import { ContextService } from '../../service/context.service';

@Component({
  selector: 'app-single-dealer',
  standalone: true,
  imports: [FormsModule, CommonModule, SharedModule, RouterLink],
  templateUrl: './single-dealer.component.html',
  styleUrls: ['./single-dealer.component.css'],
})
export class SingleDealerComponent implements OnInit {
  userList = signal<Users[]>([]);
  OpportunityList = signal<Opportunities[]>([]);
  TaskList = signal<Tasks[]>([]);
  EventList = signal<Events[]>([]);
  leadList = signal<Leads[]>([]);
  dealerData: SingleDealerResponse | undefined;
  masterSrv = inject(MasterService);
  showUsersTable: boolean = true;
  showLeadsTable: boolean = false;
  showOpportunityTable: boolean = false;
  showTaskTable: boolean = false;
  showEventTable: boolean = false;
  dealerName: string | null = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location
  ) {}

  // selectedOption: string = 'users';

  private dropdownService = inject(ContextService);
  selectedOption = this.dropdownService.getSelectedOption();

  handleSelectionChange(event: Event) {
    const option = (event.target as HTMLSelectElement).value;
    // this.selectedOption = option;
    //  const option = (event.target as HTMLSelectElement).value;
    this.dropdownService.setSelectedOption(option);

    console.log('this is option', this.selectedOption());

    switch (option) {
      case 'leads':
        this.toggleLeadsTable();
        if (this.dealerData) {
          this.getAllLeads(this.dealerData.dealer.dealer_id);
        }
        break;
      case 'users':
        if (this.dealerData) {
          this.getUser(this.dealerData.dealer.dealer_id);
          this.toggleUsersTable();
        } else {
          console.warn('Dealer data is not available.');
        }
        break;
      case 'opportunities':
        console.log(this.dealerData);
        this.toggleOpportunityTable();
        if (this.dealerData) {
          this.getAllOpp(this.dealerData.dealer.dealer_id);
        }
        break;

      case 'events':
        this.toggleEventTable();
        if (this.dealerData) {
          this.getAllEvent(this.dealerData.dealer.dealer_id);
        }
        break;
      case 'tasks':
        this.toggleTasksTable();
        if (this.dealerData) {
          this.getAllTasks(this.dealerData.dealer.dealer_id);
        }
        break;
    }
  }

  toggleUsersTable() {
    this.showLeadsTable = false;
    this.showUsersTable = true;
    this.showOpportunityTable = false;
    this.showTaskTable = false;
    this.showEventTable = false;
  }

  toggleTasksTable() {
    this.showTaskTable = true;
    this.showUsersTable = false;
    this.showLeadsTable = false;
    this.showOpportunityTable = false;
    this.showEventTable = false;
  }

  toggleLeadsTable() {
    this.showLeadsTable = true;
    this.showUsersTable = false;
    this.showOpportunityTable = false;
    this.showTaskTable = false;
    this.showEventTable = false;
  }

  toggleOpportunityTable() {
    this.showOpportunityTable = true;
    this.showEventTable = false;
    this.showUsersTable = false;
    this.showLeadsTable = false;
    this.showTaskTable = false;
  }

  toggleEventTable() {
    this.showEventTable = true;
    this.showOpportunityTable = false;
    this.showUsersTable = false;
    this.showLeadsTable = false;
    this.showTaskTable = false;
  }

  ngOnInit() {
     this.handleQueryParams();
     this.handleRouteData();
     this.handleDealerId((dealerId)=>{
      this.getUser(dealerId);
      this.getAllEvent(dealerId);
      this.getAllLeads(dealerId);
      this.getAllOpp(dealerId);
      this.getAllTasks(dealerId)
     })
  }

  private handleQueryParams() {
    this.route.queryParams.subscribe((params) => {
      this.dealerName = params['dealerName'];
      console.log('Dealer Name : ', this.dealerName);
    });
  }

  private handleRouteData() {
    this.route.data.subscribe((data) => {
      this.dealerData = data['dealerData'];
      if (this.dealerData) {
        const dealerId = this.dealerData.dealer.dealer_id;
        this.getUser(dealerId);
      } else {
        console.log('Dealer Data not available from resolver');
      }
    });
  }

  private handleDealerId(callback: (dealerId: string) => void) {
    this.route.paramMap.subscribe((params) => {
      const dealerId = params.get('id');
      if (dealerId) {
        callback(dealerId);
      } else if (!this.dealerData) {
        console.error('Dealer ID not found in the URL and no resolver data.');
      }
    });
  }

  getUser(dealerId: string) {
    console.log('Fetching user data for dealerId:', dealerId);
    this.masterSrv.getAllUser(dealerId).subscribe({
      next: (res: Users[]) => {
        this.userList.set(res);
        console.log('User data fetched:', res);
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
      },
    });
  }

  getAllLeads(dealerId: string) {
    console.log('Fetching user data for dealerId:', dealerId);
    this.masterSrv.getAllLead(dealerId).subscribe({
      next: (res: Leads[]) => {
        this.leadList.set(res);
        console.log('User data fetched:', res);
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
      },
    });
  }

  getAllEvent(dealerId: string) {
    this.masterSrv.getEventsAll(dealerId).subscribe({
      next: (res: Events[]) => {
        // Now res is of type Leads[]
        this.EventList.set(res);
        console.log('Leads data fetched:', res);
      },
      error: (err) => {
        alert(err.message || 'An error occurred while fetching leads.');
      },
    });
  }

  getAllTasks(dealerId: string) {
    this.masterSrv.getAllTask(dealerId).subscribe({
      next: (res: Tasks[]) => {
        // Now res is of type Leads[]
        this.TaskList.set(res);
        console.log('Leads data fetched:', res);
      },
      error: (err) => {
        alert(err.message || 'An error occurred while fetching leads.');
      },
    });
  }

  getAllOpp(dealerId: string) {
    this.masterSrv.getAllOpportunities(dealerId).subscribe({
      next: (res: Opportunities[]) => {
        // Now res is of type Leads[]
        this.OpportunityList.set(res);
        console.log('Leads data fetched:', res);
      },
      error: (err) => {
        alert(err.message || 'An error occurred while fetching leads.');
      },
    });
  }

  // refresh

  router = inject(Router);

  // navigateWithReload(path: string) {
  //   this.router.navigateByUrl(path).then(() => {
  //     window.location.reload();
  //   });
  // }

  userId() {
    const path = window.location.pathname.split('/')[3];
    console.log(this.userList);
    localStorage.setItem('previousRoute', path);
  }
}
