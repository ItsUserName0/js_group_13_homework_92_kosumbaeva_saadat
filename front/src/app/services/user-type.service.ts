import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { map, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Store } from '@ngrx/store';
import { AppState } from '../store/types';

@Injectable({
  providedIn: 'root'
})
export class UserTypeService implements CanActivate {
  user: Observable<null | User>;

  constructor(private store:Store<AppState>, private router: Router) {
    this.user = store.select(state => state.users.user);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.user.pipe(
      map(user => {
        if (user) {
          return true;
        }

        void this.router.navigate(['/login']);
        return false;
      })
    )
  }
}
