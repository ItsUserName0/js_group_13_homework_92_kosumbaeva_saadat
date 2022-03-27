import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Message } from '../../models/message.model';
import { Observable, Subscription } from 'rxjs';
import { User } from '../../models/user.model';
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
  users!: string[];

  constructor(private store: Store<AppState>) {
    this.user = store.select(state => state.users.user);
  }

  ngOnInit() {
    this.userSub = this.user.subscribe(user => {
      this.userData = user;
    });
  }

  ngAfterViewInit(): void {
    this.ws = new WebSocket('ws://localhost:8000/chat');

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'LOGIN',
        token: this.userData?.token,
      }));
    };

    this.ws.onclose = () => {
      setTimeout(() => {
        this.ws = new WebSocket('ws://localhost:8000/chat');
      }, 1000);
    }

    this.ws.onmessage = event => {
      const decodedMessage = JSON.parse(event.data);

      if (decodedMessage.type === 'PREV_MESSAGES') {
        this.messages = decodedMessage.messages;
      }

      if (decodedMessage.type === 'NEW_MESSAGE') {
        this.messages.push(decodedMessage.message[0]);
      }
    }
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
    this.ws.close();
  }
}
