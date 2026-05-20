import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ApiService } from '../services/api.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const api = inject(ApiService);
  const router = inject(Router);

  if (api.isLoggedIn() && api.getUser()?.role === 'admin') {
    return true;
  }

  // Session not established or not admin, redirect to login
  router.navigate(['/login']);
  return false;
};
