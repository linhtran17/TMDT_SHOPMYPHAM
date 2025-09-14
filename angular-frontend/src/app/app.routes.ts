import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './features/layout/admin/admin-layout.component';
import { PublicLayoutComponent } from './features/layout/public/public-layout.component';

import { HomePageComponent } from './features/home/home-page.component';
import { ProductsPageComponent } from './features/products/products-page.component';
import { LoginComponent } from './features/auth/login.component';
import { SignupComponent } from './features/auth/signup.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'products', component: ProductsPageComponent },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'news', loadComponent: () => import('./features/news/news-list.component').then(m => m.NewsListComponent) },
      { path: 'news/:slug', loadComponent: () => import('./features/news/news-detail.component').then(m => m.NewsDetailComponent) },

      // mới:
      { path: 'about', loadComponent: () => import('./shared/components/about/about-page.component').then(m => m.AboutPageComponent) },
      { path: 'contact', loadComponent: () => import('./features/contact/contact-page.component').then(m => m.ContactPageComponent) },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/products/admin-products-list.page').then(m => m.AdminProductsListPageComponent) },
    { path: 'products/new', loadComponent: () => import('./features/admin/products/admin-product-form.page').then(m => m.AdminProductFormPageComponent) },
    { path: 'products/:id/edit', loadComponent: () => import('./features/admin/products/admin-product-form.page').then(m => m.AdminProductFormPageComponent) },

     { path: 'categories', loadComponent: () => import('./features/admin/category/admin-category-list.page').then(m => m.AdminCategoryListPageComponent) },
    
      { path: 'banners', loadComponent: () => import('./features/admin/banners/admin-banners-list.page').then(m => m.AdminBannersListPageComponent) },
      { path: 'news', loadComponent: () => import('./features/admin/news/admin-news-list.page').then(m => m.AdminNewsListPageComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/admin-users-list.page').then(m => m.AdminUsersListPageComponent) },
      { path: 'users/new', loadComponent: () => import('./features/admin/users/admin-user-form.page').then(m => m.AdminUserFormPageComponent) },
      { path: 'users/:id/edit', loadComponent: () => import('./features/admin/users/admin-user-form.page').then(m => m.AdminUserFormPageComponent) },

      //vai tro 
      { path: 'roles',
  canActivate: [adminGuard],
  loadComponent: () => import('./features/admin/roles/admin-roles.page').then(m => m.AdminRolesPageComponent) },

      {
        path: 'roles/new',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/roles/admin-role-form.page').then(m => m.AdminRoleFormPageComponent)
      },
      {
        path: 'roles/:id/edit',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/roles/admin-role-form.page').then(m => m.AdminRoleFormPageComponent)
      },

    ],
  },
  { path: '**', redirectTo: '' },
];
