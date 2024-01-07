import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Status } from '../../models/status.model';
import { STATUS } from '../../constants/task-manager.constant';
import { TaskListService } from '../../services/task-list.service';
import { List } from '../../models';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-task-add',
  templateUrl: './task-add.component.html',
  styleUrls: ['./task-add.component.less']
})
export class TaskAddComponent implements OnInit {
  taskAddForm!: FormGroup;
  statusOptions: Status[] = STATUS;
  tasks$!: Observable<List | undefined>;
  isAddFlow: boolean = false;
  id!: number;

  constructor(private formBuilder: FormBuilder,
    private taskListService: TaskListService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe();
    this.tasks$ = this.activatedRoute.params.pipe(
      switchMap((param) => this.taskListService.getLists().pipe(
        map((lists) => {
          return lists.find((list) => {
            this.id = Number(param['id']);
            this.isAddFlow = param['id'] ? false : true;
            return list.id == param['id'];
          });
        })
      ))
    );

    this.tasks$.subscribe((task) => {
      this.taskAddForm = this.formBuilder.group({
        title: [task?.title, [Validators.required]],
        description: [task?.description, [Validators.required, Validators.minLength(8)]],
        status: [task?.status, Validators.required],
        dueDate: [task?.dueDate, [Validators.required, this.validateDueDate()]]
      })
    });
  }

  onSubmit(): void {
    this.taskAddForm.markAllAsTouched();
    if(this.taskAddForm.valid) {
      if (this.isAddFlow) {
        this.taskListService.addList(this.taskAddForm.value);
      } else {
        this.taskListService.putList(this.taskAddForm.value, this.id);
      }
      this.backToLandingPage();
    }
  }

  private validateDueDate() : ValidatorFn {
    return (astractControl: AbstractControl): ValidationErrors | null => {
      let dateEntered = new Date(astractControl.value);
      const currentDate = new Date();
      let futureDate = this.addDays(90);
      if (dateEntered <= currentDate || dateEntered >= futureDate) {
        return { error: true }
      }
      return null;
    }
  }

  private addDays(daysToAdd: number, date?: Date): Date {
    let currentDate = date ? date : new Date();
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    return currentDate;
  }

  onClose(): void {
    this.backToLandingPage();
  }

  private backToLandingPage(): void {
    this.router.navigate(['/lists']);
  }

}
