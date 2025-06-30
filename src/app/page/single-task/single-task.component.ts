import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {  TaskResponse } from '../../model/interface/master';
import { MasterService } from '../../service/master.service';
import { ActivatedRoute, RouterLink } from '@angular/router';



@Component({
  selector: 'app-single-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './single-task.component.html',
  styleUrl: './single-task.component.css',
})
export class SingleTaskComponent implements OnInit {
  taskList = signal<TaskResponse | null>(null); // WritableSignal to hold single TaskResponse
  masterSrv = inject(MasterService);
  taskData: TaskResponse | undefined;
  previousRoute!: string | null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Load the lead data from resolver or route parameter
      this.previousRoute = localStorage.getItem('previousRoute');
    this.route.data.subscribe((data) => {
      this.taskData = data['taskData'];
      if (this.taskData) {
        this.singleTaskData(this.taskData.task_id);
      } else {
        console.warn('Lead data not available from resolver.');
      }
    });

    // Handle any route params for leadId
    this.route.paramMap.subscribe((params) => {
      const taskId = params.get('taskId');
      if (taskId) {
        this.singleTaskData(taskId);
      } else if (!this.taskData) {
        console.error('Lead ID not found in the URL and no resolver data.');
      }
    });
  }

  // Fetch single lead data by ID
  singleTaskData(taskId: string): void {
    console.log('Fetching lead data for leadId:', taskId);
    this.masterSrv.taskById(taskId).subscribe({
      next: (res: TaskResponse) => {
        this.taskList.set(res); // Set the single LeadResponse object to the signal
        console.log('Lead data fetched:', res);
      },
      error: (err: any) => {
        console.error('Error fetching lead data:', err);
      },
    });
  }
}
