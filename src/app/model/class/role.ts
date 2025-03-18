
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // This makes it available throughout your application
})

export class Role {
  role_id: string;
  role_name: string;
  description: string;

  constructor() {
    this.role_id = '';
    this.role_name = '';
    this.description = '';
  }
}
