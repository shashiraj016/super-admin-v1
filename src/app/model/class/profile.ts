<<<<<<< HEAD
// import { Injectable } from '@angular/core';
=======
 // import { Injectable } from '@angular/core';
>>>>>>> 6911ff6734c133560aa4009cbbce1e08bc2fae1f

// @Injectable({
//   providedIn: 'root', // This makes it available throughout your application
// })

// export interface DealerProfile {
//   dealer_id: string;
//   dealer_name: string;
//   dealer_email: string;
//   password: string;
//   otp_validated: boolean;
//   otp: number;
//   otp_expiration: string;
//   role: string;
//   dealer_code: number;
//   location: string;
//   mobile: string;
//   phone: string;
//   deleted: boolean;
//   created_at: string;
//   updated_at: string;
//   corporate_id: string;

//   constructor() {
//   dealer_id='';

//   }

// }

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // This makes it available throughout your application
})
export class Profile {
<<<<<<< HEAD
  name: string;
  email:string;

  constructor() {
    this.name = '';
    this.email='';
=======
  corporate_id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  otp_validated: boolean;
  otp: number;
  otp_expiration: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;

  constructor() {
   this.corporate_id = '';
   this.name = '';
   this.email = '';
   this.role = '';
   this.password = '';
   this.otp_validated = false;
   this.otp = 0;
   this.otp_expiration = '';
   this.deleted = false;
   this.created_at = '';
   this.updated_at = '';
>>>>>>> 6911ff6734c133560aa4009cbbce1e08bc2fae1f
  }
}
