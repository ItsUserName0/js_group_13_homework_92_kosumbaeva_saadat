import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Message } from '../../models/message.model';
import { Observable, Subscription } from 'rxjs';
import { User, UserData } from '../../models/user.model';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/types';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.sass']
})
export class ChatComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('f') form!: NgForm;

  user: Observable<null | User>;
  userSub!: Subscription;
  userData: null | User = null;
  ws!: WebSocket;
  messages!: Message[];
  users!: UserData[];
  isClosed = false;

  constructor(private store: Store<AppState>) {
    this.user = store.select(state => state.users.user);
  }

  ngOnInit() {
    this.userSub = this.user.subscribe(user => {
      this.userData = user;
    });
  }

  ngAfterViewInit(): void {
    const start = () => {
      this.ws = new WebSocket('ws://localhost:8000/chat');

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({
          type: 'LOGIN',
          user: {token: this.userData?.token, displayName: this.userData?.displayName},
        }));
      };

      this.ws.onclose = (e) => {
        if (e.code === 1005) {
          this.isClosed = true;
        }
        if (!this.isClosed) {
          setTimeout(() => {
            start();
          }, 3000);
        }
      }

      this.ws.onmessage = event => {
        const decodedMessage = JSON.parse(event.data);

        if (decodedMessage.type === 'PREV_USERS') {
          this.users = decodedMessage.users;
        }

        if (decodedMessage.type === 'NEW_USER') {
          this.users.push(decodedMessage.user);
        }

        if (decodedMessage.type === 'LOGOUT') {
          const user: UserData = decodedMessage.user;
          const index = this.users.map(user => user._id).indexOf(user._id);
          this.users.splice(index, 1);
        }

        if (decodedMessage.type === 'PREV_MESSAGES') {
          this.messages = decodedMessage.messages;
          this.messages.reverse();
        }

        if (decodedMessage.type === 'NEW_MESSAGE') {
          this.messages.push(decodedMessage.message[0]);

          if (this.messages.length > 30) {
            this.messages = this.messages.splice(-30);
          }
        }
      }
    };
    start();
  }

  onSubmit() {
    this.ws.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        message: {text: this.form.value.text, author: this.userData?._id},
      })
    );
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.isClosed = true;
    this.ws.close();
  }
}
