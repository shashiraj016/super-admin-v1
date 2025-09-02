// import {
//   Component,
//   ChangeDetectionStrategy,
//   ChangeDetectorRef,
//   AfterViewInit,
//   OnDestroy,
// } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import {
//   Router,
//   RouterLink,
//   RouterModule,
//   NavigationEnd,
// } from '@angular/router';
// import { ContextService } from '../../service/context.service';
// import { CommonModule } from '@angular/common';
// import { SidebarService } from '../../service/sidebar.service';
// import MetisMenu from 'metismenujs';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [FormsModule, RouterLink, CommonModule, RouterModule],
//   templateUrl: './sidebar.component.html',
//   styleUrls: ['./sidebar.component.css'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class SidebarComponent implements AfterViewInit, OnDestroy {
//   selectedValue: string = '';
//   isMastersOpen = false;
//   isSidebarOpen: boolean = true;
//   isMasterMenuOpen = false;

//   private metis: any;
//   private routerSub!: Subscription;

//   constructor(
//     private router: Router,
//     private context: ContextService,
//     private sidebarService: SidebarService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.sidebarService.isOpen$.subscribe((open: boolean) => {
//       this.isSidebarOpen = open;
//       this.cdr.detectChanges();
//     });
//   }

//   ngAfterViewInit(): void {
//     this.initMetisMenu();

//     this.routerSub = this.router.events.subscribe((event) => {
//       if (event instanceof NavigationEnd) {
//         setTimeout(() => this.initMetisMenu(), 100); // Re-init menu on route change
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     if (this.routerSub) this.routerSub.unsubscribe();
//     if (this.metis) this.metis.dispose();
//   }
//   onProfileChange(path: string, title: string) {
//     this.context.setPageTitle(title); // ✅ globally update page title
//   }

//   private initMetisMenu(): void {
//     const el = document.getElementById('menu');
//     if (el) {
//       if (this.metis) {
//         this.metis.dispose(); // Dispose old instance
//       }
//       this.metis = new MetisMenu(el);
//     }
//   }

//   onRoleChange(role: string, pageTitle: string) {
//     this.context.onSideBarClick$.next({ role, pageTitle });
//   }

//   onTargetChange(role: string, pageTitle: string) {
//     this.context.onSideBarClick$.next({ role, pageTitle });
//   }

//   onTeamChange(role: string, pageTitle: string) {
//     this.context.onSideBarClick$.next({ role, pageTitle });
//   }

//   toggleMastersMenu(): void {
//     this.isMastersOpen = !this.isMastersOpen;
//   }

//   closeMastersMenu(): void {
//     this.isMastersOpen = false;
//   }

//   view(page: any) {
//     this.router.navigate(['../Admin/' + page]);
//   }

//   closeMastersMenuAndReopen() {
//     this.isMastersOpen = false;
//     setTimeout(() => {
//       this.isMastersOpen = true;
//     }, 300);
//   }

//   view2(page: string, status: string, title: string) {
//     this.router
//       .navigate(['../Admin/' + page, { type: status, title: title }])
//       .then(() => {
//         window.scroll({ top: 0, left: 0, behavior: 'smooth' });
//       });
//   }
// }

import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterModule,
  NavigationEnd,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../service/sidebar.service';
import { ContextService } from '../../service/context.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  activeMenu: string = '';
  isSidebarOpen: boolean = true;
  private sidebarSub!: Subscription;
  private routerSub!: Subscription;

  menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      route: '/Admin/dashboard',
      icon: 'fas fa-tachometer-alt', // Dashboard icon
    },

    // {
    //   key: 'role',
    //   label: 'Role Management',
    //   route: '/Admin/role',
    //   icon: 'fas fa-user-shield', // 👮 User with shield (for roles/permissions)
    // },

    // {
    //   key: 'vehicle',
    //   label: 'Vehicle Management',
    //   route: '/Admin/vehicle',
    //   icon: 'fas fa-car', // 🚗 Car icon
    // },
    // {
    //   key: 'dealer',
    //   label: 'Dealer Management',
    //   route: '/Admin/dealer',
    //   icon: 'fas fa-user-tie', // 👔 Looks professional and suits "Dealer"
    // },
  ];

  constructor(
    private router: Router,
    private context: ContextService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.sidebarSub = this.sidebarService.isOpen$.subscribe((open) => {
      this.isSidebarOpen = open;
    });

    // Set initial active state
    this.updateActiveFromUrl(this.router.url);

    // Listen to route changes ONLY
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveFromUrl(event.urlAfterRedirects);
      }
    });
  }

  ngOnDestroy(): void {
    this.sidebarSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  private updateActiveFromUrl(url: string): void {
    console.log('Updating active from URL:', url); // Debug log

    const found = this.menuItems.find((item) => url.includes(item.route));
    if (found && this.activeMenu !== found.key) {
      console.log('Setting active menu to:', found.key); // Debug log
      this.activeMenu = found.key;
      this.context.setPageTitle(found.label);
      this.context.onSideBarClick$.next({
        role: found.key,
        pageTitle: found.label,
      });
    }
  }

  // Remove onMenuClick - let router handle everything
  // The routerLink will trigger navigation, which will trigger updateActiveFromUrl

  isActive(key: string): boolean {
    return this.activeMenu === key;
  }
}
