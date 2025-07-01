import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContextService } from '../../service/context.service';
import { SidebarService } from '../../service/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  selectedValue: string = '';
  isMastersOpen = false;
  isSidebarOpen: boolean = true;
  pageTitle: string = '';
  activeDropdown: string = '';

  // constructor(private router: Router, private context: ContextService) {}
  constructor(
    private router: Router,
    private context: ContextService,
    private sidebarService: SidebarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sidebarService.isOpen$.subscribe((open: boolean) => {
      this.isSidebarOpen = open;
      this.cdr.detectChanges();
      console.log('Sidebar state changed:', this.isSidebarOpen);
    });
  }

  onRoleChange(role: string, pageTitle: string) {
    this.context.onSideBarClick$.next({ role, pageTitle });
  }
  toggleDropdown(menu: string): void {
    this.activeDropdown = this.activeDropdown === menu ? '' : menu;
    this.cdr.detectChanges(); // <-- trigger view update manually due to OnPush
  }

  onTeamChange(role: string, pageTitle: string) {
    this.context.onSideBarClick$.next({ role, pageTitle });
  }
  onProfileChange(path: string, title: string) {
    this.context.setPageTitle(title); // ✅ globally update page title
  }

  view(page: any) {
    this.router.navigate(['../Admin/' + page]);
  }

  view2(page: string, status: string, title: string) {
    this.router
      .navigate(['../Admin/' + page, { type: status, title: title }])
      .then(() => {
        window.scroll({ top: 0, left: 0, behavior: 'smooth' });
      });
  }

  toggleMastersMenu(): void {
    this.isMastersOpen = !this.isMastersOpen;
  }

  closeMastersMenu(): void {
    this.isMastersOpen = false;
  }

  closeMastersMenuAndReopen() {
    this.isMastersOpen = false;

    // ⏳ Wait briefly and re-open
    setTimeout(() => {
      this.isMastersOpen = true;
    }, 300); // delay in milliseconds (adjust if needed)
  }
}
