import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', 
})
export class UserList {
  user_id: string;
  account_id: string;
  name: string;
  email: string;
  phone: number | undefined | null;
  role: string;
  password: string;
  otp_validated: string;
  otp: string;
  otp_expiration: string;
  corporate_id: string;
  dealer_code: number | undefined | null;
  dealer_id: string;

  constructor() {
    this.user_id = '';
    this.account_id = '';
    this.name = '';
    this.phone = undefined;
    this.email = '';
    this.role = '';
    this.password = '';
    this.otp_validated = '';
    this.otp = '';
    this.otp_expiration = '';
    this.dealer_code = undefined;
    this.corporate_id = '';
    this.dealer_id = '';
  }
}
