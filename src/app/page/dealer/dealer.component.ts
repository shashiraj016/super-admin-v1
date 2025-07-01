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
  isEditMode: boolean = false;
  useForm: FormGroup;
  previousValue: string = '';
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

  isDealerNameChanged(): boolean {
    return this.useForm.value.dealer_name !== this.previousValue;
  }

  closeModal() {
    ($('#exampleModalCenter') as any).modal('hide');
    this.isModalVisible = false;
  }

  ngOnInit(): void {
    this.getAllDealer();
  }
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
      },
      (error) => {
        this.toastr.error('Error fetching dealers', 'Error');
        console.error('Error fetching dealers:', error);
      }
    );
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

  onSave() {
    if (this.useForm.invalid) {
      this.useForm.markAllAsTouched(); // Mark all fields as touched
      return; // Don't proceed if the form is invalid
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
  onUpdate() {
    if (this.useForm.valid) {
      this.dealerObj = { ...this.dealerObj, ...this.useForm.value };

      console.log('🚀 Updated Payload before API call:', this.dealerObj);

      this.masterSrv.updateDealer(this.dealerObj).subscribe(
        (res: any) => {
          console.log('✅ API Response:', res); // ✅ Check API response

          if (res.status === 200) {
            this.toastr.success(res.message, 'Success');

            // 🔄 Ensure we fetch updated data after updating
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
  onEdit(dealerId: string) {
    console.log('Edit button clicked. Dealer ID:', dealerId); // ✅ Debug log
    this.isEditMode = true; // Enable edit mode

    this.masterSrv.getDealerById(dealerId).subscribe(
      (res: SingleDealerResponse) => {
        console.log('API Response:', res); // ✅ Debug log

        if (res?.data.dealer) {
          console.log('Dealer Found:', res.data.dealer); // ✅ Ensure dealer data is present

          // STORE DEALER DATA IMP PART TO BE FOLLOWED WHEREVER DEALER CODE IS THERE .. TO SET IT BY DEAFULT AND NOT TO EDIT
          this.dealerObj = {
            ...res.data.dealer,
            dealer_code: Number(res.data.dealer.dealer_code), // ✅ Convert to number
          };

          this.useForm.patchValue({
            dealer_name: res.data.dealer.dealer_name,
            dealer_code: Number(res.data.dealer.dealer_code), // ✅ Convert to number
            dealer_email: res.data.dealer.dealer_email,
          });

          console.log('Dealer data set, opening modal...'); // ✅ Log before modal opens

          // ✅ Ensure modal opens manually
          setTimeout(() => {
            ($(`#exampleModalCenter`) as any).modal('show'); // ✅ Suppresses TypeScript error
          }, 0);
          // Small delay to ensure DOM updates
        } else {
          console.error('Dealer data is missing in response:', res);
          this.toastr.error('Dealer data not found', 'Error');
        }
      },
      (error: any) => {
        console.error('Error fetching dealer details:', error);
        this.toastr.error('Error fetching dealer details', 'Error');
      }
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
