import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    localStorage.removeItem('ams-attendance');
    localStorage.removeItem('ams-leave-requests');
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [CommonModule, FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps employee attendance and leave requests scoped to the signed-in employee', () => {
    component.chooseLoginRole('employee');
    component.login();

    expect(component.currentUser?.id).toBe('emp-1');
    expect(component.userAttendance.every(record => record.employeeId === 'emp-1')).toBeTrue();
    expect(component.visibleLeaveRequests.every(request => request.employeeId === 'emp-1')).toBeTrue();
  });

  it('records check-in and check-out for the signed-in employee', () => {
    component.chooseLoginRole('employee');
    component.login();

    component.markAttendance();
    expect(component.todayRecord?.checkIn).toBeTruthy();
    expect(component.todayRecord?.checkOut).toBe('');

    component.markAttendance();
    expect(component.todayRecord?.checkOut).toBeTruthy();
  });
});
