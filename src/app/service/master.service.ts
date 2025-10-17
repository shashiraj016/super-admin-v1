import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import {
  AccountsResponse,
  DealerResponse,
  EventResponse,
  LeadResponse,
  MultiuserResponse,
  OppResponse,
  ProfileResponse,
  roleResponse,
  SingleDealerResponse,
  TaskResponse,
  UserResponse,
  TeamsResponse,
  VehicleResponse,
  MultivehicleResponse,
  MultiTeamResponse,
  SingleUserResponse,
  SingleAccountResponse,
  SingleTeamResponse,
  SingleVehicleResponse,
} from '../model/interface/master';
import { Vehicle } from '../model/class/vehicle';
import { dealers } from '../model/class/dealers';
import { UserList } from '../model/class/multiuser';
import { Accounts } from '../model/class/customer';
import { Leads } from '../model/class/leads';
import { Tasks } from '../model/class/tasks';
import { Events } from '../model/class/event';
import { Opportunities } from '../model/class/opportunities';
import { Role } from '../model/class/role';
import { Teams } from '../model/class/team';
import { Users } from '../model/class/users';
import { SingleUserComponent } from '../page/single-user/single-user.component';

@Injectable({
  providedIn: 'root',
})
export class MasterService {
  apiUrl: string = 'https://api.prod.smartassistapp.in/api/superadmin/';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('token');
    // console.log('Retrieved Token:', token); // Debugging
    return new HttpHeaders()
      .set('authorization', `Bearer ${token}`)
      .set('accept', 'application/json');
  }

  // DEALERS API
  getAllDealer(): Observable<DealerResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DealerResponse>(this.apiUrl + 'dealers/all', {
      headers,
    });
  }

  getDealerById(id: string): Observable<SingleDealerResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SingleDealerResponse>(`${this.apiUrl}dealers/${id}`, {
      headers,
    });
  }
  getCustomerById(id: string): Observable<SingleAccountResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SingleAccountResponse>(
      `${this.apiUrl}accounts/${id}`,
      {
        headers,
      }
    );
  }

  getTeamById(id: string): Observable<SingleTeamResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SingleTeamResponse>(`${this.apiUrl}teams/${id}`, {
      headers,
    });
  }

  getVehicleById(id: string): Observable<SingleVehicleResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SingleVehicleResponse>(
      `${this.apiUrl}vehicles/${id}`,
      {
        headers,
      }
    );
  }

  getUserById(id: string): Observable<SingleUserResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SingleUserResponse>(`${this.apiUrl}users/${id}`, {
      headers,
    });
  }
  // getDealerById(id: string): Observable<SingleDealerResponse> {
  //   const headers = this.getAuthHeaders();

  //   return this.http.get<SingleDealerResponse>(`${this.apiUrl}dealers/${id}`);
  //   headers;
  // }
  // getAllUser(id: string): Observable<UserResponse[]> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.get<UserResponse[]>(
  //     `${this.apiUrl}dealers/${id}/users/all`,
  //     { headers }
  //   );
  // }

  //USERS ALL API
  getAllUser(id: string): Observable<UserResponse> {
    // ✅ Expecting a single object, not an array
    const headers = this.getAuthHeaders();
    return this.http.get<UserResponse>( // ✅ Correct return type
      `${this.apiUrl}dealers/${id}/users/all`,
      { headers }
    );
  }

  // GET ALL LEADS
  getAllLead(id: string): Observable<LeadResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<LeadResponse[]>(
      `${this.apiUrl}dealers/${id}/leads/all`,
      { headers }
    );
  }

  // GET ALL TASKS
  getAllTask(id: string): Observable<TaskResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TaskResponse[]>(
      `${this.apiUrl}dealers/${id}/tasks/all`,
      { headers }
    );
  }

  // GET ALL EVENTS
  getEventsAll(id: string): Observable<EventResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EventResponse[]>(
      `${this.apiUrl}dealers/${id}/events/t-drives/all`,
      { headers }
    );
  }

  // GET ALL OPP
  getAllOpportunities(id: string): Observable<OppResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OppResponse[]>(
      `${this.apiUrl}dealers/${id}/opportunities/all`,
      {
        headers,
      }
    );
  }

  // UPDATE DEALER BY ID
  updateDealer(obj: dealers): Observable<dealers> {
    const headers = this.getAuthHeaders();
    return this.http.put<dealers>(
      `${this.apiUrl}dealers/${obj.dealer_id}/update`,
      obj,
      {
        headers,
      }
    );
  }

  // DEALERS API
  // getAllCustomer(): Observable<CustomerResponse> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.get<CustomerResponse>(this.apiUrl + 'dealers/all', {
  //     headers,
  //   });
  // }

  // CERATE DEALER
  createDealer(obj: dealers): Observable<dealers> {
    const headers = this.getAuthHeaders();
    return this.http.post<dealers>(this.apiUrl + 'dealers/create', obj, {
      headers,
    });
  }

  // DELETE DEALER
  deleteDealer(dealer_id: string): Observable<DealerResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<DealerResponse>(
      `${this.apiUrl}dealers/${dealer_id}/delete`,
      {},
      {
        headers,
      }
    );
  }

  // VEHICLES ALL GET
  getAllVehicle(): Observable<VehicleResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<VehicleResponse>(this.apiUrl + 'vehicles/all', {
      headers,
    });
  }

  // VEHCILES BY ID GET
  getSingleVehicle(id: string): Observable<Vehicle> {
    const headers = this.getAuthHeaders();
    return this.http.get<Vehicle>(`${this.apiUrl}/vehicles/${id}`, {
      headers,
    });
  }

  // NEW VHEICLES CERATE
  createNewVehicle(obj: Vehicle): Observable<Vehicle> {
    const headers = this.getAuthHeaders();
    return this.http.post<Vehicle>(this.apiUrl + 'vehicles/create', obj, {
      headers,
    });
  }

  // DELETE VECHILE BY ID
  deleteVehicle(vehicleId: string): Observable<VehicleResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<VehicleResponse>(
      `${this.apiUrl}vehicles/${vehicleId}/delete`,
      {},
      { headers }
    );
  }

  // UPDATE VECHILE BY ID
  updateVehicle(obj: Vehicle): Observable<MultivehicleResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<MultivehicleResponse>(
      `${this.apiUrl}vehicles/${obj.vehicle_id}/update`,
      obj,
      { headers }
    );
  }

  // update team

  // EVENT BY ID
  eventById(id: string): Observable<EventResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<EventResponse>(`${this.apiUrl}events/${id}`, {
      headers,
    });
  }

  // LEAD BY ID
  leadById(id: string): Observable<LeadResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<LeadResponse>(`${this.apiUrl}leads/${id}`, {
      headers,
    });
  }

  // USER BY ID
  userById(userId: string): Observable<UserResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserResponse>(
      `${this.apiUrl}dealers/${userId}/users/all`,
      {
        headers,
      }
    );
  }

  // OPP BY ID
  oppById(id: string): Observable<OppResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<OppResponse>(`${this.apiUrl}opportunities/${id}`, {
      headers,
    });
  }

  // TASK BY ID
  taskById(id: string): Observable<TaskResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<TaskResponse>(`${this.apiUrl}tasks/${id}`, {
      headers,
    });
  }

  // Multiuser Page Api's

  getMultipleUser(): Observable<MultiuserResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<MultiuserResponse>(this.apiUrl + 'users/all', {
      headers,
    });
  }
  getMultipleTeams(): Observable<TeamsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<TeamsResponse>(this.apiUrl + 'teams/all', {
      headers,
    });
  }

  // CREATING NEW USERS / TEAMS
  // createNewUser(obj: Teams): Observable<TeamsResponse> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.post<TeamsResponse>(this.apiUrl + 'users/create', obj, {
  //     headers,
  //   });
  // }
  createNewUser(obj: UserList): Observable<Users> {
    const headers = this.getAuthHeaders();
    return this.http.post<Users>(this.apiUrl + 'users/create', obj, {
      headers,
    });
  }

  // CREATING NEW TEAM
  createNewTeam(obj: Teams): Observable<TeamsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<TeamsResponse>(this.apiUrl + 'teams/new', obj, {
      headers,
    });
  }

  updateUser(obj: UserList): Observable<MultiuserResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<MultiuserResponse>(
      `${this.apiUrl}users/${obj.user_id}/update`,
      obj,
      { headers }
    );
  }

  updateTeam(obj: Teams): Observable<TeamsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<TeamsResponse>(
      `${this.apiUrl}teams/${obj.team_id}/update`,
      obj,
      { headers }
    );
  }

  getSingleUser(id: string): Observable<UserList> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserList>(`${this.apiUrl}/users/${id}`, {
      headers,
    });
  }
  // TEAM UPDATE BY ID IN DATATABLE
  //  updateSingleTeam(id:string): Observable<Teams> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.get<Teams>(
  //     `${this.apiUrl}team/${id.team_id}/update`,
  //      {
  //     headers,
  //   });
  // }

  // TEAMS BY ID UPDATE
  // updateSingleTeam(id: string): Observable<Teams> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.get<Teams>(
  //     `${this.apiUrl}teams/${id}/update`, // Use `id` directly as the team_id
  //     { headers }
  //   );
  // }

  // TEAMS ALL
  getAllTeams() {
    const headers = this.getAuthHeaders();
    return this.http.get<TeamsResponse>(this.apiUrl + 'teams/all', {
      headers,
    });
  }

  // USERS BY ID DELETE
  deleteUser(user_id: string): Observable<MultiuserResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<MultiuserResponse>(
      `${this.apiUrl}users/${user_id}/delete`,
      {},
      { headers }
    );
  }

  // DELETE TEAM BY ID
  deleteTeam(team_id: string): Observable<TeamsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<TeamsResponse>(
      `${this.apiUrl}teams/${team_id}/delete`,
      {},
      { headers }
    );
  }

  // Accounts API's
  // ACC ALL
  getAllCustomer(): Observable<AccountsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<AccountsResponse>(this.apiUrl + 'accounts/all', {
      headers,
    });
  }

  // ACC GET BY ID
  getSingleAccount(id: string): Observable<Accounts> {
    const headers = this.getAuthHeaders();
    return this.http.get<Accounts>(`${this.apiUrl}/accounts/${id}`, {
      headers,
    });
  }

  // ACC CREATE
  createCustomer(obj: Accounts): Observable<Accounts> {
    const headers = this.getAuthHeaders();
    return this.http.post<Accounts>(`${this.apiUrl}accounts/create`, obj, {
      headers,
    });
  }

  // ACC BY ID UPDATE
  updateCustomer(obj: Accounts): Observable<Accounts> {
    const headers = this.getAuthHeaders();
    return this.http.put<Accounts>(
      `${this.apiUrl}accounts/${obj.account_id}/update`,
      obj,
      { headers }
    );
  }
  //

  // ACC BY ID DELETE
  deleteCustomer(account_id: string): Observable<AccountsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<AccountsResponse>(
      `${this.apiUrl}accounts/${account_id}/delete`,
      {},
      { headers }
    );
  }

  // Profile Page

  getProfileData(): Observable<ProfileResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProfileResponse>(this.apiUrl + 'show-profile', {
      headers,
    });
  }

  // Role

  getAllRole() {
    const headers = this.getAuthHeaders();
    return this.http.get<roleResponse>(this.apiUrl + 'role/all', {
      headers,
    });
  }

  createRole(obj: Role): Observable<roleResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.post<roleResponse[]>(this.apiUrl + 'roles/new', obj, {
      headers,
    });
  }
  // getAllTeams()<TeamResponse> {
  //   const headers = this.getAuthHeaders();

  //   return this.http.get<TeamResponse>(this.apiUrl + 'teams/all`, {
  //     headers
  //   );  // Replace `/teams` with the correct endpoint
  // }
}
