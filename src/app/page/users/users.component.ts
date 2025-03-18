import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DealerResponse,
  MultiuserResponse,
  UserResponse,
} from '../../model/interface/master';
import { MasterService } from '../../service/master.service';
import { UserList } from '../../model/class/multiuser';
import { dealers } from '../../model/class/dealers';
import { ToastrService } from 'ngx-toastr';
import { AleartSrvService } from '../../service/aleart-srv.service';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Accounts } from '../../model/class/customer';
import { Users } from '../../model/class/users';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    TooltipModule,
    FloatLabelModule,
    ReactiveFormsModule,
    NgbModalModule,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  // Signals for reactive state management
  totalUser = signal<number>(0);
  userList = signal<UserList[]>([]);
  dealerList = signal<dealers[]>([]);
  totalDealer = signal<number>(0);

  // Service injections
  masterSrv = inject(MasterService);
  private readonly toastr = inject(ToastrService);

  // Form and user management properties
  useForm: FormGroup = new FormGroup({});
  userObj: UserList = new UserList();
  previousEmail: string = '';
  isEditMode: boolean = false;

  constructor(private aleartsrv: AleartSrvService) {
    this.initializeForm();
  }

  ngOnInit() {
    this.displayAllUser();
    this.getAllDealer();
  }

  // Initialize form with comprehensive validators
  initializeForm() {
    this.useForm = new FormGroup({
      user_id: new FormControl(''),
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ]),
      role: new FormControl('', [Validators.required]),
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100),
      ]),
      phone: new FormControl(Number, [
        Validators.required,
        Validators.pattern(/^\d{10}$/),
        Validators.maxLength(10),
      ]),
      account_id: new FormControl(Number, [
        Validators.required,
        Validators.pattern(/^\d{12}$/),
        Validators.minLength(6),
        Validators.maxLength(50),
      ]),
      dealer_code: new FormControl(null, [Validators.required]),
      dealer_id: new FormControl(null),
    });
  }

  // number validation

  restrictToNumbers(event: KeyboardEvent): void {
    const keyCode = event.key;
    if (!/^\d$/.test(keyCode)) {
      event.preventDefault(); // Prevents the keypress if it's not a number
    }
  }

  // Fetch all dealers
  getAllDealer() {
    this.masterSrv.getAllDealer().subscribe({
      next: (res: DealerResponse) => {
        if (res && res.dealer && res.dealer.rows) {
          this.dealerList.set(res.dealer.rows);
          this.totalDealer.set(res.dealer.count);
        } else {
          this.toastr.warning('No dealers found', 'Information');
        }
      },
      error: (err) => {
        console.error('Dealer fetch error:', err);
        this.toastr.error(err.message || 'Failed to fetch dealers', 'Error');
      },
    });
  }

  // loadRole(){
  //   this.masterSrv.role
  // }

  // Open modal for adding/editing user
  openModal(user?: UserList) {
    // Reset form
    this.useForm.reset();
    this.isEditMode = !!user;

    if (user) {
      // Populate form for editing
      this.useForm.patchValue({
        user_id: user.user_id,
        name: user.name || '',
        account_id: user.account_id || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        dealer_code: user.dealer_code || null,
        dealer_id: user.dealer_id || null,
      });

      // Store previous email for comparison
      this.previousEmail = user.email || '';
    }
  }

  // Handle dealer code change
  onDealerChange() {
    const dealerCodeControl = this.useForm.get('dealer_code');
    const dealerIdControl = this.useForm.get('dealer_id');

    if (dealerCodeControl && dealerIdControl) {
      const selectedDealer = this.dealerList().find(
        (dealer) => dealer.dealer_code === dealerCodeControl.value
      );

      if (selectedDealer) {
        dealerIdControl.setValue(selectedDealer.dealer_id);
      }
    }
  }

  // Fetch all users
  displayAllUser() {
    this.masterSrv.getMultipleUser().subscribe({
      next: (res: MultiuserResponse) => {
        if (res && res.users) {
          this.totalUser.set(res.totalUsers);
          this.userList.set(res.users);
        } else {
          this.toastr.warning('No users found', 'Information');
        }
      },
      error: (err) => {
        console.error('Users fetch error:', err);
        this.toastr.error(err.message || 'Failed to fetch users', 'Error');
      },
    });
  }

  // Save new user
  onSave() {
    if (this.useForm.invalid) {
      this.markFormGroupTouched(this.useForm);
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

    this.masterSrv.createNewUser(this.useForm.value).subscribe({
      next: () => {
        this.toastr.success('User created successfully!', 'Success');
        this.displayAllUser();
        this.closeModal();
      },
      error: (err) => {
        console.error('User creation error:', err);
        this.toastr.error(
          err.message || 'Failed to create user',
          'Creation Error'
        );
      },
    });
  }

  // Update existing user
  onUpdate() {
    if (this.useForm.invalid) {
      this.markFormGroupTouched(this.useForm);
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

    this.masterSrv.updateUser(this.useForm.value).subscribe({
      next: () => {
        this.toastr.success('User updated successfully!', 'Success');
        this.displayAllUser();
        this.closeModal();
      },
      error: (err) => {
        console.error('User update error:', err);
        this.toastr.error('Update the E-mail and AccountId', 'Update Error');
      },
    });
  }

  // Edit a specific user
  onEdit(id: string) {
    this.masterSrv.getSingleUser(id).subscribe({
      next: (res: UserList) => {
        this.userObj = res;
        this.openModal(res);
      },
      error: (err) => {
        console.error('User fetch error:', err);
        this.toastr.error('Failed to fetch user details', 'Error');
      },
    });
  }

  selectedUserForDeletion: UserList | null = null;

  selectUserForDeletion(user: UserList) {
    this.selectedUserForDeletion = user;
  }

  deleteUserId() {
    console.log(
      'this is the select user',
      this.selectUserForDeletion,
      this.selectedUserForDeletion
    );
    if (this.selectedUserForDeletion && this.selectedUserForDeletion.user_id) {
      this.masterSrv.deleteUser(this.selectedUserForDeletion.user_id).subscribe(
        (res: MultiuserResponse) => {
          this.toastr.success('User deleted successfully', 'Success');
          this.displayAllUser();
        },
        (error) => {
          // alert(error.message || 'Failed to delete users'); comment for server side error not come
          this.toastr.error('Server Error' , 'Error')
        }
      );
    } else {
      alert('No users selected for deletion');
    }
  }

  // Close modal
  closeModal() { 
    ($('.bd-example-modal-lg') as any).modal('hide');
  }

  // Utility method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Check if email has changed (for update validation)
  isEmailChange(): boolean {
    return this.useForm.get('email')?.value !== this.previousEmail;
  }
}
