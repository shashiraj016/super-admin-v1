// import { AccountsList } from '../class/customer';
import { Accounts } from '../class/customer';
import { dealers } from '../class/dealers';
import { SingleDealer } from '../class/dealerSingle';
import { Events } from '../class/event';
import { Leads } from '../class/leads';
import { UserList } from '../class/multiuser';
import { Opportunities } from '../class/opportunities';
import { Profile } from '../class/profile';
import { Role } from '../class/role';
import { Tasks } from '../class/tasks';
import { Teams } from '../class/team';
import { Teamss } from '../class/teamss';
import { Users } from '../class/users';
import { Vehicle } from '../class/vehicle';
// import { Vehicle } from '../class/vehicle';

export interface DealerResponse {
  data: {
    dealer: {
      count: number;
      rows: dealers[];
    };
    ids: string[];
    leadsCounts: Lead[];
    opportunityCounts: opp[];
    taskCounts: task[];
    eventCounts: event[];
  };
}

export interface TeamsResponse {
  data: {
    totalUsers(totalUsers: any): unknown;
    count: number;
    rows: Teams[];

    ids: string[];
    leadsCounts: Lead[];
    opportunityCounts: opp[];
    taskCounts: task[];
    eventCounts: event[];
  };
}

export interface DashboardResponse {
  status: number;
  message: string;
  data: {
    leads: {
      current: number;
      previous: number;
    };
  };
}

// FOR TEAM MANG UPDATE (API)
export interface TeamssResponse {
  data: {
    TeamDetails: {
      count: number;
      rows: Teamss[];
    };
    ids: string[];
    leadsCounts: Lead[];
    opportunityCounts: opp[];
    taskCounts: task[];
    eventCounts: event[];
  };
}

export interface VehicleRes {
  // {
  //   "dealer": {
  //       "count": 4,
  //       "rows": [
  //           {
  //          {
  //   "count": 21,
  //   "rows": [
  //       {
}

export interface VehicleResponse {
  status: number; // ✅ Required to avoid the error
  message: string;
  data: {
    count: number;
    rows: Vehicle[];
    totalVehicles: number;
    totalPages: number;
    currentPage: number;
  };

  // vehicle: Vehicles[];
}

export interface Lead {
  dealer_id: string;
  count: number;
}

export interface opp {
  dealer_id: string;
  count: number;
}
export interface task {
  dealer_id: string;
  count: number;
}
export interface event {
  dealer_id: string;
  count: number;
}

// export interface SingleDealerResponse {
//   dealer: SingleDealer;
//   users: number;
//   leads: number;
//   opportunities: number;
//   tasks: number;
//   events: number;
// }
export interface SingleDealerResponse {
  status: number;
  message: string;
  data: {
    dealer: SingleDealer; // ✅ Correctly nested inside "data"
    users: number;
    leads: number;
    opportunities: number;
    tasks: number;
    events: number;
  };
}

export interface SingleLeadResponse {
  status: number;
  message: string;
  data: {
    dealer: SingleDealer; // ✅ Correctly nested inside "data"
    users: number;
    leads: number;
    opportunities: number;
    tasks: number;
    events: number;
  };
}

// NEW CODE ANAND 
// export interface CallLogs {
//   outgoing: number;
//   incoming: number;
//   connected: number;
//   declined: number;
//   duration: string;
// }

export interface PS {
  ps_id: string;
  ps_name: string;
  enquiries: number;
  testDrives: number;
  orders: number;
  cancellations: number;
  net_orders: number;
  retail: number;
  callLogs: CallLogs;
}

export interface SM {
  sm_id: string;
  sm_name: string;
  team_id: string;
  team_name: string;
  enquiries: number;
  testDrives: number;
  orders: number;
  cancellations: number;
  net_orders: number;
  retail: number;
  callLogs: CallLogs;
  ps_list: PS[];
}

// export interface Dealer {
//   dealer_id: string;
//   dealer_name: string;
//   dealer_email: string | null;
//   enquiries: number;
//   testDrives: number;
//   cancellations: number;
//   orders: number;
//   net_orders: number;
//   lostEnquiries: number;
//   retail: number;
//   overdueFollowups: number;
//   upComingFollowups:number;
//   callLogs: CallLogs;
//   sm_list: SM[];
// }

export interface ApiResponse {
  status: number;
  message: string;
  data: {
    dealers: Dealer[];
  };
}

export interface CallLogs {
  totalCalls: number;
  outgoing: number;
  incoming: number;
  connected: number;
  declined: number;
  durationSec: number; // API sends seconds, so keep it number
}

export interface User {
  userId: string;
  userName: string;
  userRole: string;
  upComingFollowups: number;
  overdueFollowups: number;
  upComingTestDrives: number;
  completedTestDrives: number;
  overdueTestDrives: number;
  lostEnquiries: number;
  enquiries: number;
  testDrives: number;
  orders: number;
  cancellations: number;
  netOrders: number;
  retail: number;
  callLogs: CallLogs;
}

export interface Dealer {
  dealerId: string;
  dealerName: string;
  dealerEmail?: string;
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  cxpLeads: number;
  icsLeads: number;
  totalFollowUps: number;
  openFollowUps: number;
  closedFollowUps: number;
  cxpFollowUps: number;
  totalTestDrives: number;
  uniqueTestDrives: number;
  completedTestDrives:number;
  closedTestDrives: number;
  cxpTestDrives: number;
  callLogs: CallLogs;

  users?: User[]; // optional, only if API returns it
}

// export interface SingleUserResponse {
//   status: number; // Ensure status exists

//   totalUsers: number;
//   totalPages: number;
//   currentPage: number;
//   data: Users;
// }
export interface SingleUserResponse {
  status: number;
  message: string;
  data: {
    count: number;
    rows: Users[];
  };
}

// export interface UserResponse  {

//       // count:number;
//       // rows:Users[];
//       data:Users[];
//     }

export interface UserResponse {
  status: number;
  message: string;

  data: Array<{
    dealer_id: string;
    user_id: string;
    user_account_id: string | null; // Can be null
    account_id: string; // This field is missing in your response
    name: string;
    email: string;
    phone: string;
    user_role: string;
    dealer_code: string | number; // Depending on how it's returned (string or number)
    dealer_name: string;
    password?: string;
    fname: string;
    lname: string;
  }>;
}

export interface LeadResponse extends Leads {}

export interface TaskResponse extends Tasks {}

export interface EventResponse extends Events {}

export interface OppResponse extends Opportunities {}

export interface MultiuserResponse {
  user_id: string;
  data: {
    count: number;
    message: string;
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    rows: UserList[];
  };
}
export interface MultiaccountsResponse {
  account_id: string;
  data: {
    count: number;
    message: string;
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    rows: Accounts[];
  };
}
export interface MultivehicleResponse {
  vehicle_id: string;
  data: {
    count: number;
    message: string;
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    rows: Vehicle[];
  };
}

export interface MultiTeamResponse {
  team_id: string;
  data: {
    count: number;
    message: string;
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    rows: Teams[];
  };
}
export interface Lead {
  dealer_id: string;
  dealer_name: string;
  value: number;
  dealer_code: number;
  location: string;
  mobile: string;
  phone: string;
  rank: number;
}
export interface DashboardData {
  status: number;
  message: string;
  data: {
    leads: { [key: string]: { value: number } };
    testDrives: { [key: string]: { value: number } };
    orders: { [key: string]: { value: number } };
    rankings: {
      leads: Array<{
        dealer_id: string;
        dealer_name: string;
        value: number;
        dealer_code: number;
        location: string;
        mobile: string;
        phone: string;
        rank: number;
      }>;
      testDrives: Array<{
        dealer_id: string;
        dealer_name: string;
        value: number;
        dealer_code: number;
        location: string;
        mobile: string;
        phone: string;
        rank: number;
      }>;
      orders: any[]; // Define a more specific type if possible
    };
  };
}

export interface AccountsResponse {
  data: {
    count: number; // Total number of accounts available
    totalPages: number; // Total number of pages (for pagination)
    currentPage: number; // The current page number
    rows: Accounts[]; // Array of accounts
  };
}

export interface SingleAccountResponse {
  status: number;
  message: string;
  data: Accounts; // ✅ directly contains the customer object
}

export interface SingleTeamResponse {
  status: number;
  message: string;
  data: {
    TeamDetails: Teams; // Single Team object instead of a list of teams
    leadsCounts: Lead[]; // Leads count data if needed
    opportunityCounts: opp[]; // Opportunity count data if needed
    taskCounts: task[]; // Task count data if needed
    eventCounts: Event[]; // Event count data if needed
  };
}

// export interface SingleVehicleResponse {
//   status: number;
//   message: string;
//   data: {
//     TeamDetails: Vehicle | null;
//     TeamMembers: {
//       count: number;
//       rows: any[];
//     };
//     leadsData: {
//       count: number;
//       rows: any[];
//     };
//     oppsData: {
//       count: number;
//       rows: any[];
//     };
//   };
// }

// export interface role {

//     "role_id": "09796b32-bddd-4b1d-bb27-08d6d0f010c8",
//     "role_name": "saad",
//     "description": "343423",
//     "created_at": "2024-12-19T12:53:59.116Z",
//     "updated_at": "2024-12-19T12:53:59.116Z"

// }

// this interface convernt into class
export interface SingleVehicleResponse {
  status: number;
  message: string;
  data: Vehicle; // 👈 instead of TeamDetails or rows
}

// export interface roleResponse {
//   data: {
//     count: number;
//     rows: Role[];
//   };
// }
// }
export interface roleResponse {
  status: number;
  message: string;
  data: Role[]; // data is an array of Role objects
}

// export interface ProfileResponse {
//   corporate_id: string;
//   name: string;
//   email: string;
//   role: string;
//   password: string;
// }
export interface ProfileResponse {
  status: number;
  message: string;
  data: Profile;
}
export interface ForgotPasswordRequest {
  email: string;
}
