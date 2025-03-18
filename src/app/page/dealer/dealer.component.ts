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
import { DealerResponse } from '../../model/interface/master';
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
    });
  }

  private readonly toastr = inject(ToastrService);

  openModal(dealer?: dealers) {
    this.useForm.reset();
    this.isModalVisible = true;
    if (dealer) {
      this.previousValue = dealer.dealer_name;

      // Patch form values with dealer data if it's in edit mode
      this.useForm.patchValue({
        dealer_name: dealer.dealer_name,
        dealer_code: dealer.dealer_code,
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
        this.dealerList.set(res.dealer.rows);
        this.totalDealer.set(res.dealer.count);
      },
      (error) => {
        this.toastr.error('You Are ', 'Unauthorized Error');
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

  onSave() {
    if (this.useForm.invalid) {
      this.useForm.markAllAsTouched();
      return; // Don't proceed if the form is invalid
    }

    if (this.isEditMode) {
      this.onUpdate(); // Update existing dealer
    } else {
      this.createNewDealer(); // Create new dealer
    }

    this.closeModal();
  }

  createNewDealer() {
    this.masterSrv.createDealer(this.dealerObj).subscribe(
      (res: dealers) => {
        this.toastr.success('Dealer created successfully!', 'Success');
        this.getAllDealer(); // Reload dealers list after creation
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

  onUpdate() {
    this.masterSrv.updateDealer(this.dealerObj).subscribe(
      (res: dealers) => {
        this.toastr.success('Dealer updated successfully!', 'Success');
        this.getAllDealer(); // Reload dealers list after update
      },
      (error) => {
        this.toastr.error('Error updating dealer', 'Error');
      }
    );
  }

  onEdit(data: dealers) {
    // this.dealerObj = data;
    this.useForm.patchValue({
      dealer_id: data.dealer_id || '',
      dealer_name: data.dealer_name || '',
      dealer_code: data.dealer_code || Number,
    }),
      console.log(this.dealerObj, 'trueeee----');
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
