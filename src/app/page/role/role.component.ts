import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MasterService } from '../../service/master.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { Role } from '../../model/class/role';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css'],
})
export class RoleComponent implements OnInit {
  private http = inject(HttpClient);
  useForm: FormGroup = new FormGroup({});
  roleList = signal<Role[]>([]);
  count = signal<number>(0);

  // Signal to hold backend error messages for UI display (optional)
  backendError = signal<string | null>(null);

  // service
  private masterSrv = inject(MasterService);
  private readonly toastr = inject(ToastrService);

  constructor() {
    this.initializeForm();
  }

  staticDealerList = [
    { dealer_code: 'Admin' },
    { dealer_code: 'SM' },
    { dealer_code: 'PS' },
    { dealer_code: 'GM' },
    { dealer_code: 'DP' },
  ];

  ngOnInit(): void {
    this.loadRole();
  }

  private initializeForm(): void {
    this.useForm = new FormGroup({
      role_name: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
    });
  }

  closeModal() {
    ($('.bd-example-modal-lg') as any).modal('hide');
  }

  // openModals() {
  //   ($('.bd-example-modal-lg') as any).modal('show');
  // }
  openModals() {
    console.log('Opening modal...');

    // Clear the form
    this.useForm.reset({
      role_name: '',
      description: '',
    });

    // Show modal using jQuery (now that Bootstrap isn't auto-opening it)
    ($('.bd-example-modal-lg') as any).modal('show');
  }

  loadRole() {
    this.masterSrv.getAllRole().subscribe({
      next: (res: any) => {
        this.count.set(res.data.length); // count is length of array
        this.roleList.set(res.data); // data is the array itself
        this.backendError.set(null); // clear previous error on success
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        const msg = err?.error?.message || 'Failed to load roles';
        this.backendError.set(msg);
        this.toastr.error(msg, 'Error');
      },
    });
  }

  onSave() {
    if (this.useForm.invalid) {
      this.useForm.markAllAsTouched(); // optional: show validation errors
      return;
    }

    this.masterSrv.createRole(this.useForm.value).subscribe({
      next: () => {
        this.loadRole();
        this.toastr.success('Role created successfully!', 'Success');
        this.backendError.set(null); // clear error on success
        this.useForm.reset();
        this.closeModal(); // <-- CLOSE MODAL only after successful save
      },
      error: (err) => {
        console.error('Error creating role:', err);
        const msg = err?.error?.message || 'Failed to create role';
        this.backendError.set(msg);
        this.toastr.error(msg, 'Error');
      },
    });
  }
}
