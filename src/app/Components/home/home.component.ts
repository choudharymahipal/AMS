import { Component } from '@angular/core';

type Role = 'admin' | 'employee';
type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'On leave';
type LeaveStatus = 'Pending' | 'Approved' | 'Declined';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
}

interface AttendanceRecord {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
}

interface LeaveRequest {
  id: number;
  employeeId: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
  note: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly employees: Employee[] = [
    { id: 'emp-1', name: 'Olivia Rhye', email: 'olivia@acme.com', role: 'Product designer', initials: 'OR', color: 'lavender' },
    { id: 'emp-2', name: 'Phoenix Baker', email: 'phoenix@acme.com', role: 'Engineering', initials: 'PB', color: 'peach' },
    { id: 'emp-3', name: 'Lana Steiner', email: 'lana@acme.com', role: 'Marketing', initials: 'LS', color: 'mint' },
    { id: 'emp-4', name: 'Demi Wilkinson', email: 'demi@acme.com', role: 'People & culture', initials: 'DW', color: 'blue' },
    { id: 'emp-5', name: 'Candice Wu', email: 'candice@acme.com', role: 'Engineering', initials: 'CW', color: 'rose' }
  ];

  readonly navItems = [
    { id: 'overview', label: 'Overview', icon: '◫' },
    { id: 'attendance', label: 'Attendance', icon: '◷' },
    { id: 'leave', label: 'Leave', icon: '▧' },
    { id: 'team', label: 'My team', icon: '♧' }
  ];

  activeView = 'overview';
  selectedRange: 'week' | 'month' = 'week';
  currentUser: Employee | null = null;
  loginRole: Role = 'admin';
  loginEmail = 'admin@acme.com';
  loginPassword = 'password';
  loginError = '';
  searchTerm = '';
  showLeaveForm = false;
  leaveError = '';
  leaveDraft = { type: 'Annual leave', from: '', to: '', note: '' };
  attendance: AttendanceRecord[] = [];
  leaveRequests: LeaveRequest[] = [];
  readonly today = this.toDateKey(new Date());

  constructor() {
    this.attendance = this.load('ams-attendance', this.createAttendance());
    this.leaveRequests = this.load('ams-leave-requests', this.createLeaveRequests());
  }

  get isAdmin(): boolean {
    return this.currentUser?.id === 'admin';
  }

  get visibleNavItems(): typeof this.navItems {
    return this.isAdmin ? this.navItems : this.navItems.filter(item => item.id !== 'team');
  }

  get userAttendance(): AttendanceRecord[] {
    const records = this.isAdmin
      ? this.attendance
      : this.attendance.filter(record => record.employeeId === this.currentUser?.id);
    const start = new Date();
    if (this.selectedRange === 'week') {
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    } else {
      start.setDate(1);
    }
    const startKey = this.toDateKey(start);
    return records
      .filter(record => record.date >= startKey && record.date <= this.today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  get visibleLeaveRequests(): LeaveRequest[] {
    return this.isAdmin
      ? this.leaveRequests
      : this.leaveRequests.filter(request => request.employeeId === this.currentUser?.id);
  }

  get filteredEmployees(): Employee[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.employees.filter(employee =>
      `${employee.name} ${employee.email} ${employee.role}`.toLowerCase().includes(query)
    );
  }

  get todayRecord(): AttendanceRecord | undefined {
    return this.attendance.find(record =>
      record.employeeId === this.currentUser?.id && record.date === this.today
    );
  }

  get presentCount(): number {
    return this.attendance.filter(record => record.date === this.today &&
      (record.status === 'Present' || record.status === 'Late')).length;
  }

  get pendingLeaveCount(): number {
    return this.leaveRequests.filter(request => request.status === 'Pending').length;
  }

  get attendanceRate(): number {
    return Math.round((this.presentCount / this.employees.length) * 100);
  }

  get rangeDaysPresent(): number {
    return this.userAttendance.filter(record => record.status === 'Present' || record.status === 'Late').length;
  }

  get rangeLabel(): string {
    return this.selectedRange === 'week' ? 'This week' : 'This month';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }

  get todayDisplay(): string {
    return this.formatDateLong(new Date());
  }

  get todayHours(): string {
    const record = this.todayRecord;
    if (!record?.checkIn) return '—';
    const minutes = (time: string): number => {
      const [clock, period] = time.split(' ');
      const [rawHours, rawMinutes] = clock.split(':').map(Number);
      return (rawHours % 12 + (period === 'PM' ? 12 : 0)) * 60 + rawMinutes;
    };
    const end = record.checkOut || this.timeNow();
    const worked = Math.max(0, minutes(end) - minutes(record.checkIn));
    return (worked / 60).toFixed(1);
  }

  get currentEmployee(): Employee | undefined {
    return this.employees.find(employee => employee.id === this.currentUser?.id);
  }

  chooseLoginRole(role: Role): void {
    this.loginRole = role;
    this.loginEmail = role === 'admin' ? 'admin@acme.com' : 'olivia@acme.com';
    this.loginPassword = 'password';
    this.loginError = '';
  }

  login(): void {
    const account = this.loginEmail.trim().toLowerCase();
    if (this.loginPassword !== 'password') {
      this.loginError = 'That password doesn’t match the demo account. Try “password”.';
      return;
    }
    if (this.loginRole === 'admin' && account === 'admin@acme.com') {
      this.currentUser = {
        id: 'admin', name: 'Alex Morgan', email: account, role: 'Administrator',
        initials: 'AM', color: 'lavender'
      };
    } else {
      const employee = this.employees.find(person => person.email.toLowerCase() === account);
      if (!employee || this.loginRole !== 'employee') {
        this.loginError = 'We couldn’t find an account for that email and role.';
        return;
      }
      this.currentUser = employee;
    }
    this.loginError = '';
    this.activeView = 'overview';
  }

  logout(): void {
    this.currentUser = null;
    this.activeView = 'overview';
    this.chooseLoginRole('admin');
  }

  setView(view: string): void {
    this.activeView = view;
  }

  setRange(range: 'week' | 'month'): void {
    this.selectedRange = range;
  }

  markAttendance(): void {
    if (!this.currentUser || this.isAdmin) return;
    const record = this.todayRecord;
    if (!record) {
      this.attendance.unshift({
        employeeId: this.currentUser.id, date: this.today,
        checkIn: this.timeNow(), checkOut: '', status: 'Present'
      });
    } else if (!record.checkOut) {
      record.checkOut = this.timeNow();
    }
    this.save('ams-attendance', this.attendance);
  }

  openLeaveForm(): void {
    this.leaveDraft = { type: 'Annual leave', from: '', to: '', note: '' };
    this.leaveError = '';
    this.showLeaveForm = true;
  }

  submitLeaveRequest(): void {
    if (!this.currentUser || !this.leaveDraft.from || !this.leaveDraft.to) {
      this.leaveError = 'Choose both a start and end date.';
      return;
    }
    const from = new Date(`${this.leaveDraft.from}T00:00:00`);
    const to = new Date(`${this.leaveDraft.to}T00:00:00`);
    if (from > to || from < new Date(`${this.today}T00:00:00`)) {
      this.leaveError = 'Choose a valid date range starting today or later.';
      return;
    }
    const days = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
    this.leaveRequests.unshift({
      id: Date.now(), employeeId: this.currentUser.id, type: this.leaveDraft.type,
      from: this.leaveDraft.from, to: this.leaveDraft.to, days,
      status: 'Pending', note: this.leaveDraft.note.trim()
    });
    this.save('ams-leave-requests', this.leaveRequests);
    this.showLeaveForm = false;
  }

  updateLeaveStatus(request: LeaveRequest, status: 'Approved' | 'Declined'): void {
    request.status = status;
    this.save('ams-leave-requests', this.leaveRequests);
  }

  employeeName(id: string): string {
    return this.employees.find(employee => employee.id === id)?.name ?? 'Team member';
  }

  employeeById(id: string): Employee | undefined {
    return this.employees.find(employee => employee.id === id);
  }

  attendanceFor(employeeId: string, date: string): AttendanceRecord | undefined {
    return this.attendance.find(record => record.employeeId === employeeId && record.date === date);
  }

  formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  formatDatePart(date: string, part: 'month' | 'day'): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      month: part === 'month' ? 'short' : undefined,
      day: part === 'day' ? 'numeric' : undefined
    });
  }

  formatDateLong(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  get weekDates(): { label: string; day: string; date: string; record?: AttendanceRecord; isToday: boolean }[] {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = this.toDateKey(date);
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        day: `${date.getDate()}`,
        date: key,
        record: this.attendance.find(item => item.employeeId === this.currentUser?.id && item.date === key),
        isToday: key === this.today
      };
    });
  }

  private createAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    for (let offset = 0; offset < 31; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dateKey = this.toDateKey(date);
      this.employees.forEach((employee, index) => {
        const isToday = offset === 0;
        const absentToday = isToday && index === 4;
        const onLeaveToday = isToday && index === 2;
        if (absentToday || onLeaveToday) return;
        records.push({
          employeeId: employee.id,
          date: dateKey,
          checkIn: isToday ? '' : index === 1 ? '09:18 AM' : '09:02 AM',
          checkOut: isToday ? '' : '05:42 PM',
          status: !isToday && index === 1 ? 'Late' : 'Present'
        });
      });
    }
    return records;
  }

  private createLeaveRequests(): LeaveRequest[] {
    const plusDays = (days: number): string => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return this.toDateKey(date);
    };
    return [
      { id: 1, employeeId: 'emp-3', type: 'Annual leave', from: plusDays(4), to: plusDays(6), days: 3, status: 'Pending', note: 'Family trip' },
      { id: 2, employeeId: 'emp-2', type: 'Sick leave', from: plusDays(-3), to: plusDays(-3), days: 1, status: 'Approved', note: 'Not feeling well' },
      { id: 3, employeeId: 'emp-1', type: 'Personal day', from: plusDays(12), to: plusDays(12), days: 1, status: 'Pending', note: 'Personal appointment' }
    ];
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private timeNow(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : fallback;
    } catch (error) {
      console.error(`Unable to load saved ${key} data. Starting with demo data instead.`, error);
      return fallback;
    }
  }

  private save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
