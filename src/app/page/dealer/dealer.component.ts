import {
  Component,
  OnInit,
  inject,
  numberAttribute,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MasterService } from '../../service/master.service';
import {
  DealerResponse,
  SingleDealerResponse,
} from '../../model/interface/master';
import { dealers } from '../../model/class/dealers';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dealer',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModalModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dealer.component.html',
  styleUrls: ['./dealer.component.css'],
})
export class DealerComponent implements OnInit {
  private http = inject(HttpClient);
  dealerList = signal<dealers[]>([]);
  totalDealer = signal<number>(0);
  masterSrv = inject(MasterService);
  dealerObj: dealers = new dealers();
  selectedRowCount = 3;
  isLoading = false;
  isModalVisible = false;
  isModalOpen = false;
  isEditMode: boolean = false;
  useForm: FormGroup;
  previousValue: string = '';
  isDeleteModalOpen = false;
  itemsPerPage = 10;
  originalDealerName: string = '';
  originalDealerC: string = ''; // 👈 Add this
  visiblePages: number[] = [];
  maxVisiblePages: number = 3;
  totalItems = 0;
  currentPage = 1;
  originalFormValue: any;

  searchTerm: string = '';
  filteredDealers: any[] = []; // will hold the filtered user list
  paginatedDealers: any[] = []; // your current paginated users (already existing)
  totalPages: number = 0;
  pages: number[] = [];
  constructor(private modalService: NgbModal) {
    this.useForm = new FormGroup({
      dealer_name: new FormControl(null, [
        Validators.required,
        Validators.minLength(2),
      ]),
      dealer_code: new FormControl(null, [
        Validators.required,
        Validators.minLength(5),
      ]),
      dealer_email: new FormControl(null, [
        Validators.required,
        Validators.email, // ✅ ensures proper email
      ]),
    });
  }

  private readonly toastr = inject(ToastrService);

  openModal(dealer?: dealers) {
    this.isModalOpen = true;

    console.log('open modal called');
    // this.useForm.reset();
    this.useForm.reset({
      dealer_name: null,
      dealer_code: null,
      dealer_email: null,
    });

    this.isModalVisible = true;
    if (dealer) {
      this.previousValue = dealer.dealer_name;

      // Patch form values with dealer data if it's in edit mode
      this.useForm.patchValue({
        dealer_name: dealer.dealer_name,
        dealer_code: dealer.dealer_code,
        dealer_email: dealer.dealer_email,
      });

      // Update dealerObj with the dealer's data
      this.dealerObj = { ...dealer };
    } else {
      // Reset dealerObj if no dealer is provided (for a new entry)
      this.dealerObj = new dealers();
    }
  }

  // isDealerNameChanged(): boolean {
  //   return this.useForm.value.dealer_name !== this.previousValue;
  // }
  isDealerNameChanged(): boolean {
    return this.useForm.get('dealer_name')?.value !== this.originalDealerName;
  }

  closeModal() {
    ($('.bd-example-modal-lg') as any).modal('hide');
    this.isModalOpen = false; // optional, if you use isModalOpen conditionally in HTML
  }
  ngOnInit(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateVisiblePages();
    this.getAllDealer(); // fetch data for page 1
    this.getAllDealer();
  }

  // getAllDealer() {
  //   this.masterSrv.getAllDealer().subscribe(
  //     (res: DealerResponse) => {
  //       console.log('Dealer list updated:', res.data.dealer.rows); // Log response to verify
  //       this.dealerList.set(res.data.dealer.rows); // Set the dealer list
  //       this.totalDealer.set(res.data.dealer.count);
  //     },
  //     (error) => {
  //       this.toastr.error('Error fetching dealers', 'Error');
  //     }
  //   );
  // }
  // getAllDealer() {
  //   this.masterSrv.getAllDealer().subscribe(
  //     (res: DealerResponse) => {
  //       console.log('Dealer list updated:', res.data.dealer.rows);

  //       this.dealerList.set(res.data.dealer.rows); // signal data

  //       this.totalDealer.set(res.data.dealer.count);

  //       // ✅ Immediately apply filter + pagination
  //       this.applyFilterAndPagination();
  //     },
  //     (error) => {
  //       this.toastr.error('Error fetching dealers', 'Error');
  //       console.error('Error fetching dealers:', error);
  //     }
  //   );
  // }
  getAllDealer() {
    this.masterSrv.getAllDealer().subscribe(
      (res: DealerResponse) => {
        console.log('Dealer list updated:', res.data.dealer.rows);

        this.dealerList.set(res.data.dealer.rows); // Signal data
        this.filteredDealers = res.data.dealer.rows; // ✅ Used for search/pagination
        this.totalDealer.set(res.data.dealer.count);

        this.initializeDealerPagination(); // ✅ Setup pagination
      },
      (error) => {
        this.toastr.error('Error fetching dealers', 'Error');
        console.error('Error fetching dealers:', error);
        this.dealerList.set([]);
        this.filteredDealers = [];
        this.totalDealer.set(0);
        this.initializeDealerPagination(); // fallback even if error
      }
    );
  }
  initializeDealerPagination() {
    const totalItems = this.filteredDealers.length;
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    if (this.currentPage > this.totalPages) this.currentPage = 1;

    this.updateVisiblePages();
    this.paginateDealers();
  }

  applyFilterAndPagination() {
    const allDealers = this.dealerList();

    const filtered = allDealers.filter(
      (dealer) =>
        dealer.dealer_name
          ?.toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        dealer.dealer_code
          ?.toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
    );

    this.filteredDealers = filtered;

    // 🔥 Fix: set totalPages and pages
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedDealers = filtered.slice(start, end);
  }

  // dealerList(): any[] {
  //   return this.filteredDealers || [];
  // }

  onSearchChange() {
    this.filterUsers();
    this.currentPage = 1; // reset to first page after search
    this.paginateDealers();
  }
  filterUsers() {
    if (!this.searchTerm) {
      this.filteredDealers = this.dealerList();
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredDealers = this.dealerList().filter((user) => {
        return user.dealer_name.toLowerCase().includes(term);
      });
    }
    this.currentPage = 1; // Reset to first page after search
    this.paginateDealers();
  }
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // paginateDealers() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   const endIndex = startIndex + this.itemsPerPage;
  //   this.paginatedDealers = this.filteredDealers.slice(startIndex, endIndex);
  //   this.totalPages = Math.ceil(
  //     this.filteredDealers.length / this.itemsPerPage
  //   );
  //   this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  // }
  // previousPage() {
  //   if (this.currentPage > 1) {
  //     this.currentPage--;
  //     this.applyFilterAndPagination();
  //   }
  // }

  // nextPage() {
  //   if (this.currentPage < this.totalPages) {
  //     this.currentPage++;
  //     this.applyFilterAndPagination();
  //   }
  // }

  // goToPage(page: number) {
  //   if (page !== this.currentPage) {
  //     this.currentPage = page;
  //     this.applyFilterAndPagination();
  //   }
  // }
  updateVisiblePages() {
    const start =
      Math.floor((this.currentPage - 1) / this.maxVisiblePages) *
      this.maxVisiblePages;
    this.visiblePages = this.pages.slice(start, start + this.maxVisiblePages);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updateVisiblePages();
    this.paginateDealers(); // 🔥 Add this
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateVisiblePages();
      this.paginateDealers(); // 🔥 Add this
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateVisiblePages();
      this.paginateDealers(); // 🔥 Add this
    }
  }
  paginateDealers(): void {
    const allDealers = this.dealerList();

    const filtered = allDealers.filter(
      (dealer) =>
        dealer.dealer_name
          ?.toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        dealer.dealer_code
          ?.toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
    );

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedDealers = filtered.slice(start, end);
  }
  openDeleteModal(dealer: any) {
    console.log('🗑️ Delete button clicked', dealer); // ✅ debug log
    this.selectedDealerForDeletion = dealer;
    this.isDeleteModalOpen = true;
  }

  // onSave() {
  //   if (this.useForm.invalid) {
  //     console.log('form is invalid', this.useForm);
  //     this.useForm.markAllAsTouched();
  //     return;
  //   }

  //   this.createNewDealer();
  //   ($('#exampleModalCenter') as any).modal('hide');
  //   console.log('form is valid . proceeding with API call');
  // }

  // onSave() {
  //   if (this.useForm.invalid) {
  //     this.useForm.markAllAsTouched();
  //     return; // Don't proceed if the form is invalid
  //   }

  //   if (this.isEditMode) {
  //     this.onUpdate(); // Update existing dealer
  //   } else {
  //     this.createNewDealer(); // Create new dealer
  //   }

  //   this.closeModal();
  // }
  //  deleteDealerId() {
  //     console.log('Deleting User ID:', this.selectedUserForDeletion?.user_id);

  //     if (this.selectedUserForDeletion && this.selectedUserForDeletion.user_id) {
  //       this.masterSrv.deleteUser(this.selectedUserForDeletion.user_id).subscribe(
  //         (res: MultiuserResponse) => {
  //           this.toastr.success('User deleted successfully', 'Success');
  //           this.displayAllUser();

  //           // ✅ Close modal
  //           this.isDeleteModalOpen = false;
  //         },
  //         (error) => {
  //           this.toastr.error('Server Error', 'Error');
  //         }
  //       );
  //     } else {
  //       alert('No users selected for deletion');
  //     }
  //   }
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
  }
  // onSave() {
  //   if (this.useForm.invalid) {
  //     this.useForm.markAllAsTouched(); // ✅ This ensures validation errors are shown
  //     this.toastr.warning(
  //       'Please fill all required fields correctly',
  //       'Validation'
  //     );
  //     return;
  //   }

  //   // Proceed with creating or updating the dealer based on the mode
  //   if (this.isEditMode) {
  //     this.onUpdate(); // Update existing dealer
  //   } else {
  //     this.createNewDealer(); // Create new dealer
  //   }

  //   this.closeModal();
  // }

  // createNewDealer() {
  //   this.masterSrv.createDealer(this.dealerObj).subscribe(
  //     (res: dealers) => {
  //       this.toastr.success('Dealer created successfully!', 'Success');
  //       this.getAllDealer(); // Reload dealers list after creation
  //     },
  //     (error) => {
  //       this.toastr.error('Error creating dealer', 'Error');
  //     }
  //   );
  // }
  onSave() {
    if (this.useForm.invalid) {
      this.useForm.markAllAsTouched(); // ✅ Show validation errors
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

    // ✅ Log the form values before sending to backend
    console.log('Form Values on Save:', this.useForm.value);

    // Proceed with creating or updating the dealer based on the mode
    if (this.isEditMode) {
      this.onUpdate(); // Update existing dealer
    } else {
      this.createNewDealer(); // Create new dealer
    }

    this.closeModal();
  }

  // createNewDealer() {
  //   this.masterSrv.createDealer(this.dealerObj).subscribe(
  //     (res: dealers) => {
  //       this.toastr.success('Dealer created successfully!', 'Success');
  //       this.getAllDealer(); // Reload the dealers list after creation
  //     },
  //     (error) => {
  //       this.toastr.error('Error creating dealer', 'Error');
  //     }
  //   );
  // }
  createNewDealer() {
    if (this.useForm.invalid) {
      this.useForm.markAllAsTouched();
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

    // ✅ Extract values from form
    const payload = this.useForm.value;

    console.log('Final Payload sent to API:', payload);

    this.masterSrv.createDealer(payload).subscribe(
      (res: dealers) => {
        this.toastr.success('Dealer created successfully!', 'Success');
        this.getAllDealer();
      },
      (error) => {
        console.error('Error creating dealer:', error);
        this.toastr.error('Error creating dealer', 'Error');
      }
    );
  }

  // onItemsPerPageChange(event: any) {
  //   this.itemsPerPage = parseInt(event.target.value, 10);
  //   this.currentPage = 1;
  //   console.log('Dropdown changed to:', this.itemsPerPage);
  //   this.paginateDealers();
  // }
  onItemsPerPageChange(event: any) {
    this.itemsPerPage = parseInt(event.target.value, 10);
    this.currentPage = 1;
    console.log('Dropdown changed to:', this.itemsPerPage);
    this.applyFilterAndPagination(); // ✅ instead of paginateDealers()
  }

  // paginateUsers() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   const endIndex = startIndex + this.itemsPerPage;
  //   this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  //   this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  //   this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  // }
  // createNewDealer() {
  //   this.getAllDealer();
  //   this.masterSrv.createDealer(this.dealerObj).subscribe(
  //     (res: dealers) => {
  //       this.toastr.success('Dealer created successfully!', 'Success');
  //       this.getAllDealer();
  //       this.closeModal();
  //     },
  //     (error) => {
  //       this.toastr.error('You Are Unauthorized', 'Unauthorized Error');
  //     }
  //   );
  // }

  // onUpdate() {
  //   this.getAllDealer();
  //   this.masterSrv.updateDealer(this.dealerObj).subscribe(
  //     (res: dealers) => {
  //       this.toastr.success('Dealer Edit successfully!', 'Success');
  //       this.closeModal();
  //       this.getAllDealer();
  //     },
  //     (error) => {
  //       this.toastr.error('You Are Unauthorized', 'Unauthorized Error');
  //     }
  //   );
  // }

  // onUpdate() {
  //   this.masterSrv.updateDealer(this.dealerObj).subscribe(
  //     (res: dealers) => {
  //       this.toastr.success('Dealer updated successfully!', 'Success');
  //       this.getAllDealer(); // Reload dealers list after update
  //     },
  //     (error) => {
  //       this.toastr.error('Error updating dealer', 'Error');
  //     }
  //   );
  // }
  onUpdate(): void {
    if (this.useForm.valid) {
      this.dealerObj = { ...this.dealerObj, ...this.useForm.value };

      console.log('🚀 Updated Payload before API call:', this.dealerObj);

      this.masterSrv.updateDealer(this.dealerObj).subscribe(
        (res: any) => {
          console.log('✅ API Response:', res);

          if (res.status === 200) {
            this.toastr.success(
              res.message || 'Dealer updated successfully',
              'Success'
            );

            this.isModalOpen = false;
            this.originalDealerName = '';
            this.originalDealerC = '';

            setTimeout(() => {
              this.getAllDealer();
            }, 500);
          } else {
            this.toastr.error(res.message || 'Update failed', 'Error');
          }
        },
        (error) => {
          console.error('❌ API Error:', error);

          // If backend returns a specific error message
          const errorMessage =
            error?.error?.message || 'Failed to update dealer';
          this.toastr.error(errorMessage, 'Error');
        }
      );
    } else {
      this.toastr.error('Invalid form data. Please check inputs.', 'Error');
    }
  }

  // onEdit(data: dealers) {
  //   // this.dealerObj = data;
  //   this.useForm.patchValue({
  //     dealer_id: data.dealer_id || '',
  //     dealer_name: data.dealer_name || '',
  //     dealer_code: data.dealer_code || Number,
  //   }),
  //     console.log(this.dealerObj, 'trueeee----');
  // }
  // onEdit(dealerId: string): void {
  //   console.log('Edit button clicked. Dealer ID:', dealerId);
  //   this.isEditMode = true;

  //   this.masterSrv.getDealerById(dealerId).subscribe(
  //     (res: SingleDealerResponse) => {
  //       console.log('API Response:', res);

  //       if (res?.data?.dealer) {
  //         const dealer = res.data.dealer;
  //         console.log('Dealer Found:', dealer);

  //         this.dealerObj = {
  //           ...dealer,
  //           dealer_code: Number(dealer.dealer_code),
  //         };

  //         this.useForm.patchValue({
  //           dealer_name: dealer.dealer_name,
  //           dealer_code: Number(dealer.dealer_code),
  //         });

  //         this.isModalOpen = true; // ✅ Angular-way: show modal
  //       } else {
  //         this.toastr.error('Dealer data not found', 'Error');
  //       }
  //     },
  //     (error) => {
  //       this.toastr.error('Error fetching dealer details', 'Error');
  //       console.error('Error fetching dealer:', error);
  //     }
  //   );
  // }
  // THIS IS MY CODE
  // onEdit(dealerId: string): void {
  //   console.log('Edit button clicked. Dealer ID:', dealerId);
  //   this.isEditMode = true;

  //   this.masterSrv.getDealerById(dealerId).subscribe(
  //     (res: SingleDealerResponse) => {
  //       console.log('API Response:', res);

  //       const dealer = res?.data?.dealer;
  //       if (dealer) {
  //         console.log('Dealer Found:', dealer);

  //         // ✅ Assigning values correctly
  //         this.dealerObj = {
  //           ...dealer,
  //           dealer_code: Number(dealer.dealer_code),
  //         };

  //         this.useForm.patchValue({
  //           dealer_name: dealer.dealer_name,
  //           dealer_code: Number(dealer.dealer_code),
  //         });

  //         this.isModalOpen = true; // ✅ Ensure modal is opened
  //       } else {
  //         this.toastr.error('Dealer data not found', 'Error');
  //       }
  //     },
  //     (error) => {
  //       this.toastr.error('Error fetching dealer details', 'Error');
  //       console.error('Error fetching dealer:', error);
  //     }
  //   );
  // }

  // THIS IS GPT CODE FOR DISBALED EDIT NOT WROKING
  onEdit(dealerId: string): void {
    console.log('Edit button clicked. Dealer ID:', dealerId);
    this.isEditMode = true;

    this.masterSrv.getDealerById(dealerId).subscribe(
      (res: SingleDealerResponse) => {
        const dealer = res?.data?.dealer;
        if (dealer) {
          this.dealerObj = {
            ...dealer,
            dealer_code: Number(dealer.dealer_code),
          };

          // Patch values into form
          this.useForm.patchValue({
            dealer_name: dealer.dealer_name,
            dealer_code: Number(dealer.dealer_code),
          });

          // ✅ Save original form values for change detection
          this.originalFormValue = { ...this.useForm.value };

          this.isModalOpen = true;
        } else {
          this.toastr.error('Dealer data not found', 'Error');
        }
      },
      (error) => {
        this.toastr.error('Error fetching dealer details', 'Error');
      }
    );
  }

  isFormChanged(): boolean {
    return (
      this.useForm.get('dealer_name')?.value !== this.originalDealerName ||
      this.useForm.get('dealer_code')?.value !== this.originalDealerC
    );
  }

  selectedDealerForDeletion: dealers | null = null;

  selectDealerForDeletion(dealer: dealers) {
    this.selectedDealerForDeletion = dealer;
  }

  deleteDealerId() {
    if (
      this.selectedDealerForDeletion &&
      this.selectedDealerForDeletion.dealer_id
    ) {
      this.masterSrv
        .deleteDealer(this.selectedDealerForDeletion.dealer_id)
        .subscribe(
          (res: DealerResponse) => {
            this.getAllDealer();
            this.closeModal();
            this.toastr.success('Dealer Deleted', 'Successful');
          },
          (error) => {
            alert(error.message || 'Failed to delete vehicle');
          }
        );
    } else {
      alert('No vehicle selected for deletion');
    }
  }
}
