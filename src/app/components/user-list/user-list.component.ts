import { Component, Input } from '@angular/core';
import { ChatUser } from '../../types/chat-types';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {
  @Input() currentUser!: ChatUser;
  @Input() users: ChatUser[] = [];

  getOtherUsers() {
    return this.users.filter(user => user.uid !== this.currentUser.uid);
  }
}
