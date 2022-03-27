import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { UsersService } from '../services/users.service';
import {
  loginUserFailure,
  loginUserRequest,
  loginUserSuccess,
  logoutUser,
  logoutUserRequest,
  registerUserFailure,
  registerUserRequest,
  registerUserSuccess
} from './users.actions';
import { map, mergeMap, NEVER, tap, withLatestFrom } from 'rxjs';
import { Router } from '@angular/router';
import { HelpersService } from '../services/helpers.service';
import { Store } from '@ngrx/store';
import { AppState } from './types';

@Injectable()
export class UsersEffects {

  constructor(private actions: Actions,
              private router: Router,
              private usersService: UsersService,
              private helpers: HelpersService,
              private store: Store<AppState>) {
  }

  registerUser = createEffect(() => this.actions.pipe(
    ofType(registerUserRequest),
    mergeMap(({userData}) => this.usersService.register(userData).pipe(
      map(user => registerUserSuccess({user})),
      tap(() => {
        void this.router.navigate(['/chat']);
        this.helpers.openSnackBar('Registered successful!');
      }),
      this.helpers.catchServerError(registerUserFailure),
    )),
  ));

  loginUser = createEffect(() => this.actions.pipe(
    ofType(loginUserRequest),
    mergeMap(({userData}) => this.usersService.login(userData).pipe(
      map(user => loginUserSuccess({user})),
      tap(() => {
        void this.router.navigate(['/chat']);
        this.helpers.openSnackBar('Login successful!');
      }),
      this.helpers.catchServerError(loginUserFailure),
    )),
  ));

  logoutUser = createEffect(() => this.actions.pipe(
    ofType(logoutUserRequest),
    withLatestFrom(this.store.select(state => state.users.user)),
    mergeMap(([_, user]) => {
      if (user) {
        return this.usersService.logout(user.token).pipe(
          map(() => logoutUser()),
          tap(() => {
            void this.router.navigate(['/']);
            this.helpers.openSnackBar('Logout successful!')
          }),
        );
      }

      return NEVER;
    }),
  ));
}
