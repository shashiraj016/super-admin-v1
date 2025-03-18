import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DataTablesModule } from 'angular-datatables';
import { Config } from 'datatables.net';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { VehicleResponse } from '../../model/interface/master';
import { Vehicles } from '../../model/class/vehicle';
import { MasterService } from '../../service/master.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastrService } from 'ngx-toastr';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AleartSrvService } from '../../service/aleart-srv.service';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    DataTablesModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    SweetAlert2Module,
    NgbModalModule,
  ],
  templateUrl: './vehicle.component.html',
  styleUrl: './vehicle.component.css',
})
export class VehicleComponent implements OnInit {
  // Signals for reactive state management
  count = signal<number>(0);
  vehicleList = signal<Vehicles[]>([]);

  // Dependency Injections
  private masterSrv = inject(MasterService);
  private readonly toastr = inject(ToastrService);
  private modalService = inject(NgbModal);

  // Component State Variables
  vehicleObj: Vehicles = new Vehicles();
  // dtOptions: Config = {};
  isModalVisible = false;
  isEditMode = false;
  previousValue: string = '';

  // Form Group
  useForm: FormGroup = new FormGroup({});

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  // Initialize Reactive Form
  private initializeForm(): void {
    this.useForm = new FormGroup({
      vehicle_name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
      VIN: new FormControl('', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20),
      ]),
      type: new FormControl('', [Validators.required]),
      YOM: new FormControl('', [Validators.required]),
    });
  }

  // Load All Vehicles
  private loadVehicles(): void {
    this.masterSrv.getAllVehicle().subscribe({
      next: (res: VehicleResponse) => {
        this.count.set(res.count);
        this.vehicleList.set(res.rows);
      },
      error: (err) => {
        this.toastr.error('Failed to load vehicles', 'Error');
        console.error('Vehicle load error:', err);
      },
    });
  }

  // Open Modal for Add/Edit
  openModal(vehicle?: Vehicles): void {
    // Reset form and mode
    this.useForm.reset();
    this.isEditMode = !!vehicle;

    if (vehicle) {
      // Populate form for edit
      this.vehicleObj = { ...vehicle };
      this.previousValue = vehicle.vehicle_name;

      this.useForm.patchValue({
        vehicle_name: vehicle.vehicle_name,
        VIN: vehicle.VIN,
        type: vehicle.type,
        YOM: this.formatDate(vehicle.YOM),
      });

      // Disable VIN for edit mode
      this.useForm.get('VIN')?.disable();
      this.useForm.get('YOM')?.disable();
    } else {
      // Reset for add mode
      this.vehicleObj = new Vehicles();
      this.useForm.get('VIN')?.enable();
      this.useForm.get('YOM')?.enable();
    }

    this.isModalVisible = true;
  }

  // Close Modal

  closeModal() {
    ($('.bd-example-modal-lg') as any).modal('hide');
  }

  openModals(){
    ($('.bd-example-modal-sm') as any).modal('show');
  }

  // Save New Vehicle
  onSave(): void {
    if (this.useForm.invalid) {
      this.markFormGroupTouched(this.useForm);
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

    // Prepare submission data
    const submitData = this.useForm.getRawValue();

    this.masterSrv.createNewVehicle(submitData).subscribe({
      next: () => {
        this.toastr.success('Vehicle Created Successfully!', 'Success');
        this.loadVehicles();
        this.closeModal();
      },
      error: (err) => {
        this.toastr.error(err.error.error, 'Error');
        console.error('Vehicle creation error:', err);
      },
    });
  }

  // Update Existing Vehicle
  onUpdate(): void {
    if (this.useForm.invalid) {
      this.markFormGroupTouched(this.useForm);
      this.toastr.warning('Please correct the form errors', 'Validation');
      return;
    }

    // Prepare update data
    const updateData = {
      ...this.useForm.getRawValue(),
      vehicle_id: this.vehicleObj.vehicle_id,
    };

    this.masterSrv.updateVehicle(updateData).subscribe({
      next: () => {
        this.toastr.success('Vehicle Updated Successfully!', 'Success');
        this.loadVehicles();
        this.closeModal();
      },
      error: (err) => {
        this.toastr.error(err.error.error, 'Error');
        console.error('Vehicle update error:', err);
      },
    });
  }

  // Delete Vehicle
  selectedVehicleForDeletion: Vehicles | null = null;

  selectVehicleForDeletion(vehicle: Vehicles) {
    this.selectedVehicleForDeletion = vehicle;
  }

  deleteVehicleId() {
    if (
      this.selectedVehicleForDeletion &&
      this.selectedVehicleForDeletion.vehicle_id
    ) {
      this.masterSrv
        .deleteVehicle(this.selectedVehicleForDeletion.vehicle_id)
        .subscribe(
          (res: VehicleResponse) => {
            this.loadVehicles();
            this.toastr.success('Vehicle Delete Successfully!', 'Success');
          },
          (error) => {
            alert(error.error.error || 'Failed to delete vehicle');
          }
        );
    } else {
      alert('No vehicle selected for deletion');
    }
  }

  // Edit Single Vehicle
  onEdit(id: string): void {
    this.masterSrv.getSingleVehicle(id).subscribe({
      next: (vehicle: Vehicles) => {
        this.openModal(vehicle);
      },
      error: (err) => {
        this.toastr.error(err.error.error, 'Error'); 
      },
    });
  }

  // Utility Methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Date Formatting Utility
  private formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Validation Helpers
  isFieldInvalid(controlName: string): boolean {
    const control = this.useForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isVehicleName(): boolean {
    return this.useForm.value.vehicle_name !== this.previousValue;
  }
}
