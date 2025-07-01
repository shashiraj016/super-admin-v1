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
<<<<<<< HEAD
  // previousValue: string = '';
  allDealers: dealers[] = [];
  filteredDealers: dealers[] = [];
  paginatedDealers: dealers[] = [];
  searchTerm: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  pages: number[] = [];
  // currentPage = 1;
  // itemsPerPage = 10;
=======
  isDeleteModalOpen = false;
  itemsPerPage = 10;
  originalDealerName: string = '';
  originalDealerC: string = ''; // 👈 Add this

  currentPage = 1;
  searchTerm: string = '';
  filteredDealers: any[] = []; // will hold the filtered user list
  paginatedDealers: any[] = []; // your current paginated users (already existing)
  totalPages: number = 0;
  pages: number[] = [];
>>>>>>> 8d04eae0 (updated code)
  constructor(private modalService: NgbModal) {
    this.useForm = new FormGroup({
      dealer_name: new FormControl(this.dealerObj.dealer_name, [
        Validators.required,
        Validators.minLength(2),
      ]),
      dealer_code: new FormControl(this.dealerObj.dealer_code, [
        Validators.required,
        Validators.minLength(5),
      ]),
      dealer_email: new FormControl(this.dealerObj.dealer_email, [
        Validators.required,
        Validators.minLength(5),
      ]),
    });
  }

  private readonly toastr = inject(ToastrService);

  openModal(dealer?: dealers) {
    this.isModalOpen = true;

    console.log('open modal called');
    this.useForm.reset();
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
    this.getAllDealer();
  }
<<<<<<< HEAD
  getAllDealer() {
    this.masterSrv.getAllDealer().subscribe(
      (res: DealerResponse) => {
        console.log('Dealer list fetched:', res); // Verify the response
        if (res && res.data && res.data.dealer && res.data.dealer.rows) {
          // Update the signal with the fetched data
          this.dealerList.set(res.data.dealer.rows);
          this.filterDealers(); // Apply filter logic after the data is set
          this.paginateDealers(); // Paginate after setting the dealer list
        }
=======

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
  getAllDealer() {
    this.masterSrv.getAllDealer().subscribe(
      (res: DealerResponse) => {
        console.log('Dealer list updated:', res.data.dealer.rows);

        this.dealerList.set(res.data.dealer.rows); // signal data

        this.totalDealer.set(res.data.dealer.count);

        // ✅ Immediately apply filter + pagination
        this.applyFilterAndPagination();
>>>>>>> 8d04eae0 (updated code)
      },
      (error) => {
        this.toastr.error('Error fetching dealers', 'Error');
        console.error('Error fetching dealers:', error);
      }
    );
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
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilterAndPagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilterAndPagination();
    }
  }

  goToPage(page: number) {
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.applyFilterAndPagination();
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
<<<<<<< HEAD
  onSearchChange(): void {
    this.currentPage = 1; // Reset to page 1 when search term changes
    this.filterDealers(); // Apply the filter logic based on the searchTerm
  }

  // Filter the dealers based on the search term
  filterDealers(): void {
    const term = this.searchTerm.toLowerCase().trim();

    // If no search term, use the full dealer list from the signal
    if (!term) {
      this.filteredDealers = this.dealerList(); // Access the dealer list from the signal
    } else {
      // Apply filter based on name, code, or email
      this.filteredDealers = this.dealerList().filter(
        (dealer) =>
          dealer.dealer_name?.toLowerCase().includes(term) ||
          dealer.dealer_email?.toLowerCase().includes(term) ||
          dealer.dealer_code?.toString().toLowerCase().includes(term)
      );
    }

    // After filtering, apply pagination
    this.paginateDealers();
  }

  // filterDealers(): void {
  //   const term = this.searchTerm.toLowerCase().trim();

  //   // If no search term, use the full dealer list
  //   if (!term) {
  //     this.filteredDealers = this.dealerList(); // Access the signal's value
  //   } else {
  //     // Apply filter based on name, code, or email
  //     this.filteredDealers = this.dealerList().filter(
  //       (dealer) =>
  //         dealer.dealer_name?.toLowerCase().includes(term) ||
  //         dealer.dealer_email?.toLowerCase().includes(term) ||
  //         dealer.dealer_code?.toString().toLowerCase().includes(term)
  //     );
  //   }
  //   // After filtering, apply pagination
  //   this.paginateDealers();
  // }

  paginateDealers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedDealers = this.filteredDealers.slice(startIndex, endIndex);

    // Calculate total pages
    this.totalPages = Math.ceil(
      this.filteredDealers.length / this.itemsPerPage
    );
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Change items per page and recalculate pagination
  onItemsPerPageChange(event: any): void {
    this.itemsPerPage = +event.target.value; // Get the selected number of items per page
    this.currentPage = 1; // Reset to the first page
    this.paginateDealers(); // Recalculate pagination after items per page change
  }

  // Go to previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateDealers();
    }
  }

  // Go to next page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateDealers();
    }
  }

  // Go to specific page
  goToPage(page: number) {
    this.currentPage = page;
    this.paginateDealers();
  }

=======
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
>>>>>>> 8d04eae0 (updated code)
  onSave() {
    if (this.useForm.invalid) {
      this.useForm.markAllAsTouched(); // ✅ This ensures validation errors are shown
      this.toastr.warning(
        'Please fill all required fields correctly',
        'Validation'
      );
      return;
    }

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
  //       this.getAllDealer(); // Reload dealers list after creation
  //     },
  //     (error) => {
  //       this.toastr.error('Error creating dealer', 'Error');
  //     }
  //   );
  // }
  createNewDealer() {
    this.masterSrv.createDealer(this.dealerObj).subscribe(
      (res: dealers) => {
        this.toastr.success('Dealer created successfully!', 'Success');
        this.getAllDealer(); // Reload the dealers list after creation
      },
      (error) => {
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
            this.toastr.success(res.message, 'Success');

            // ✅ Close modal
            this.isModalOpen = false;

            // ✅ Reset original tracking fields
            this.originalDealerName = '';
            this.originalDealerC = '';

            // ✅ Refresh list
            setTimeout(() => {
              this.getAllDealer();
            }, 500);
          } else {
            this.toastr.error('Update failed, no data received', 'Error');
          }
        },
        (error) => {
          console.error('❌ API Error:', error);
          this.toastr.error('Failed to update customer', 'Error');
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
  onEdit(dealerId: string): void {
    console.log('Edit button clicked. Dealer ID:', dealerId);
    this.isEditMode = true;

    this.masterSrv.getDealerById(dealerId).subscribe(
      (res: SingleDealerResponse) => {
        console.log('API Response:', res);

        if (res?.data?.dealer) {
          const dealer = res.data.dealer;
          console.log('Dealer Found:', dealer);

          this.dealerObj = {
            ...dealer,
            dealer_code: Number(dealer.dealer_code),
          };

          this.originalDealerName = dealer.dealer_name;
          this.originalDealerC = dealer.dealer_code; // 👈 Save original dealer_c

          this.useForm.patchValue({
<<<<<<< HEAD
            dealer_name: res.data.dealer.dealer_name,
            dealer_code: Number(res.data.dealer.dealer_code), // ✅ Convert to number
            dealer_email: res.data.dealer.dealer_email,
=======
            dealer_name: dealer.dealer_name,
            dealer_code: Number(dealer.dealer_code),
            dealer_c: dealer.dealer_code, // 👈 Add this
>>>>>>> 8d04eae0 (updated code)
          });

          this.isModalOpen = true;
        } else {
          this.toastr.error('Dealer data not found', 'Error');
        }
      },
      (error) => {
        this.toastr.error('Error fetching dealer details', 'Error');
        console.error('Error fetching dealer:', error);
      }
    );
  }
  isFormChanged(): boolean {
    return (
      this.useForm.get('dealer_name')?.value !== this.originalDealerName ||
      this.useForm.get('dealer_c')?.value !== this.originalDealerC
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
