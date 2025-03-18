import { Component, inject, OnInit, signal } from '@angular/core';
import { Accounts } from '../../model/class/customer';
import { MasterService } from '../../service/master.service';
import {  AccountsResponse, DealerResponse } from '../../model/interface/master';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { dealers } from '../../model/class/dealers';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    CalendarModule,
    BreadcrumbModule,
    RouterModule,
    ReactiveFormsModule,
    NgbModalModule,
  ],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css',
})
export class CustomerComponent implements OnInit {
  // signals for reactive state management
  totalCustomer = signal<number>(0);
  customerList = signal<Accounts[]>([]);
  dealerList = signal<dealers[]>([]);

  // service injections
  masterSrv = inject(MasterService);
  private readonly toastr = inject(ToastrService);

  // Form and user management properties
  useForm: FormGroup = new FormGroup({});
  customerObj: Accounts = new Accounts();
  dealerObj: dealers = new dealers();
  isEditMode : boolean = false;

  // For the Edit button blocked
  previousValue: string = '';

  constructor(private modalService: NgbModalModule) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadDealers();
  }

  isModalVisible = false;

  // Form initialize
  initializeForm() {
    this.useForm = new FormGroup({
      account_id: new FormControl(''),
      account_type: new FormControl(this.customerObj.account_type, [
        Validators.required,
      ]),
      fname: new FormControl(this.customerObj.fname, [
        Validators.required,
        Validators.minLength(3),
      ]),
      lname: new FormControl(this.customerObj.lname, [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: new FormControl(this.customerObj.email, [
        Validators.required,
        Validators.email,
      ]),
      phone: new FormControl(this.customerObj.phone, [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^\d+$/), // Ensures only numeric input
      ]),
      mobile: new FormControl(this.customerObj.mobile, [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^\d+$/), // Ensures only numeric input
      ]),
      dealer_code: new FormControl(this.customerObj.dealer_code, [
        Validators.required,
        Validators.minLength(3),
      ]),
    });
  }

  openModal(customer?: Accounts) {
    this.useForm.reset();
    this.isEditMode = !!customer;
    if (customer) {
      this.useForm.patchValue({
        account_id: this.customerObj.account_id || '',
        account_type: this.customerObj.account_type || '',
        fname: this.customerObj.fname || '',
        lname: this.customerObj.lname || '',
        email: this.customerObj.email || '',
        phone: this.customerObj.phone || '',
        mobile: this.customerObj.mobile || '',
        dealer_code: this.customerObj.dealer_code || '', // Ensure only set once
        dealer_id: this.customerObj.dealer_id || '',
      });
    }
  }

  closeModal() {
    ($('.bd-example-modal-lg') as any).modal('hide');
  }

  // edit button hide if the email not changed..!
  isEmailChange(): boolean {
    return this.useForm.value.email !== this.previousValue;
  }


  loadCustomers() {
    this.masterSrv.getCustomer().subscribe((res: AccountsResponse) => {
      this.totalCustomer.set(res.totalAccounts);
      this.customerList.set(res.accounts);
    });
  }


  getDealerCode(dealerId: string): string {
    const dealer = this.dealerList().find(
      (dealer) => dealer.dealer_id === dealerId
    );
    console.log(this.dealerList);
    return dealer?.dealer_code?.toString() ?? 'N/A';
  }

  onDealerChange() {
    const selectedDealer = this.dealerList().find(
      (dealer) => dealer.dealer_id === this.customerObj.dealer_id
    );
    console.log('Selected Dealer:', selectedDealer);
    if (selectedDealer) {
      this.customerObj.dealer_code = selectedDealer.dealer_code;
      // Update the form control for dealer_code
      this.useForm.patchValue({
        dealer_code: selectedDealer.dealer_code,
      });
    }
  }

  loadDealers() {
    this.masterSrv.getAllDealer().subscribe(
      (res: DealerResponse) => {
        this.dealerList.set(res.dealer.rows);
        // this.totalDealer.set(res.dealer.count);
        console.log(res);
      },
      (error) => {
        this.toastr.error('Serverside Error', 'Error');
        // alert(error.message);
      }
    );
  }


  createAccounts() {
    this.customerObj.phone = Number(this.customerObj.phone);
    this.customerObj.mobile = Number(this.customerObj.mobile);
    this.masterSrv.createCustomer(this.useForm.value).subscribe(
      (res: AccountsResponse) => {
        this.toastr.success('Account created successfully!', 'Success');
        this.loadCustomers();
        this.closeModal(); 
      },
      (error) => {
        this.toastr.error(error.error, 'Error');
      }
    );
  }

  selectedCustomerForDeletion: Accounts | null = null;

  selectCustomerForDeletion(accounts: Accounts) {
    this.selectedCustomerForDeletion = accounts;
    console.log(
      'Selected vehicle for deletion:',
      this.selectedCustomerForDeletion
    );
  }

  deleteCustomerId() {
    if (
      this.selectedCustomerForDeletion &&
      this.selectedCustomerForDeletion.account_id
    ) {
      this.masterSrv
        .deleteCustomer(this.selectedCustomerForDeletion.account_id)
        .subscribe(
          (res: AccountsResponse) => {
            this.loadDealers();
            this.loadCustomers();
            this.closeModal();
          },
          (error) => {
            console.error('Delete vehicle error:', error);
            alert(error.message || 'Failed to delete vehicle');
          }
        );
    } else {
      alert('No vehicle selected for deletion');
    }
  }

  onUpdate() {
    if (this.useForm.invalid) {
      this.markFormGroupTouched(this.useForm);
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

    this.masterSrv.updateCustomer(this.useForm.value).subscribe({
      next: () => {
        this.toastr.success('Account Update successfully!', 'Success');
        this.loadCustomers();
        this.closeModal();
      },
      error: (err) => {
        console.error('User update error:', err);
        this.toastr.error('Server Error', 'Error');
        // alert('something happn ');
      },
    });
  }

  onEdit(id: string) {
    this.masterSrv.getSingleAccount(id).subscribe({
      next: (res: Accounts) => {
        this.customerObj = res;
        this.openModal(res);
      },
      error: (err) => {
        console.error('User fetch error:', err);
        this.toastr.error('Failed to fetch user details', 'Error');
      },
    });
  }

  onSave() {
    if (this.useForm.invalid) {
      console.log('form is invalid', this.useForm);
      this.useForm.markAllAsTouched();
      return;
    }

    this.createAccounts();
    ($('.bd-example-modal-lg') as any).modal('hide');
    console.log('form is valid');
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
