import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './features/layout/admin/admin-layout.component';
import { PublicLayoutComponent } from './features/layout/public/public-layout.component';

import { HomePageComponent } from './features/home/home-page.component';
import { LoginComponent } from './features/auth/login.component';
import { SignupComponent } from './features/auth/signup.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'oauth2/callback', loadComponent: () => import('./features/auth/oauth2-callback.component').then(m => m.Oauth2CallbackComponent) },

      { path: 'wishlist', loadComponent: () => import('./features/wishlist/my-wishlist.page').then(m => m.default), canActivate: [authGuard] },

      // Public: Mã giảm giá
      { path: 'coupons', loadComponent: () => import('./features/coupons/coupons.page').then(m => m.default) },

      // Flash sale
      { path: 'flash', loadComponent: () => import('./features/flash/flash-deals-all.page').then(m => m.FlashDealsAllPage) },
      { path: 'flash/:slug', loadComponent: () => import('./features/flash/flash-sale-detail.page').then(m => m.FlashSaleDetailPage) },

      // Products
      { path: 'products', loadComponent: () => import('./features/products/products-list.page').then(m => m.ProductsListPageComponent) },
      { path: 'products/:id', loadComponent: () => import('./shared/components/product-detail-page.component').then(m => m.ProductDetailPageComponent) },

      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'news', loadComponent: () => import('./features/news/news-list.component').then(m => m.NewsListComponent) },
      { path: 'news/:slug', loadComponent: () => import('./features/news/news-detail.component').then(m => m.NewsDetailComponent) },
      { path: 'about', loadComponent: () => import('./shared/components/about/about-page.component').then(m => m.AboutPageComponent) },
      { path: 'contact', loadComponent: () => import('./features/contact/contact-page.component').then(m => m.ContactPageComponent) },
      { path: 'orders', loadComponent: () => import('./features/orders/my-orders.page').then(m => m.MyOrdersPage), canActivate: [authGuard] },
      { path: 'account', loadComponent: () => import('./features/account/account.page').then(m => m.AccountPage) },

      // Cần đăng nhập
      { path: 'cart', loadComponent: () => import('./features/cart/cart.page').then(m => m.CartPage), canActivate: [authGuard] },
      { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.page').then(m => m.CheckoutPage), canActivate: [authGuard] },
      { path: 'orders/:id', loadComponent: () => import('./features/orders/order-detail.page').then(m => m.OrderDetailPage), canActivate: [authGuard] },
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

      { path: 'roles', canActivate: [adminGuard], loadComponent: () => import('./features/admin/roles/admin-roles.page').then(m => m.AdminRolesPageComponent) },
      { path: 'roles/new', canActivate: [adminGuard], loadComponent: () => import('./features/admin/roles/admin-role-form.page').then(m => m.AdminRoleFormPageComponent) },
      { path: 'roles/:id/edit', canActivate: [adminGuard], loadComponent: () => import('./features/admin/roles/admin-role-form.page').then(m => m.AdminRoleFormPageComponent) },

      // Suppliers
      { path: 'suppliers', loadComponent: () => import('./features/admin/suppliers/admin-suppliers-list.page').then(m => m.AdminSuppliersListPageComponent) },
      { path: 'suppliers/new', loadComponent: () => import('./features/admin/suppliers/admin-supplier-form.page').then(m => m.AdminSupplierFormPageComponent) },
      { path: 'suppliers/:id/edit', loadComponent: () => import('./features/admin/suppliers/admin-supplier-form.page').then(m => m.AdminSupplierFormPageComponent) },

      // Inventory
      { path: 'inventory', loadComponent: () => import('./features/admin/inventory/admin-inventory-list.page').then(m => m.AdminInventoryListPageComponent) },
      { path: 'inventory/receive', loadComponent: () => import('./features/admin/inventory/admin-inventory-new.page').then(m => m.AdminInventoryNewPageComponent) },
      { path: 'inventory/new', pathMatch: 'full', redirectTo: 'inventory/receive' },
      { path: 'orders', loadComponent: () => import('./features/admin/orders/admin-orders-list.page').then(m => m.AdminOrdersListPageComponent) },

      // Flash Sales
      { path: 'flash-sales', loadComponent: () => import('./features/admin/flash/admin-flash-sales-list.page').then(m => m.default) },
      { path: 'flash-sales/new', loadComponent: () => import('./features/admin/flash/admin-flash-sale-form.page').then(m => m.default) },
      { path: 'flash-sales/:id/edit', loadComponent: () => import('./features/admin/flash/admin-flash-sale-form.page').then(m => m.default) },

      // Admin: Coupons (nếu BE đã có)
      { path: 'coupons', loadComponent: () => import('./features/admin/coupons/admin-coupons-list.page').then(m => m.default) },
      { path: 'coupons/new', loadComponent: () => import('./features/admin/coupons/admin-coupon-form.page').then(m => m.default) },
      { path: 'coupons/:id/edit', loadComponent: () => import('./features/admin/coupons/admin-coupon-form.page').then(m => m.default) },
    ],
  },

  { path: '**', redirectTo: '' },
];
