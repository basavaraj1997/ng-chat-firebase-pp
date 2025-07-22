import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatUser } from '../../types/chat-types';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {
  @Input() currentUser!: ChatUser;
  @Input() users: ChatUser[] = [];
  @Output() userSelected = new EventEmitter<ChatUser>();
  selectedUserId: string | null = null;

  getOtherUsers() {
    return this.users.filter(user => user.uid !== this.currentUser.uid);
  }

  selectUser(user: ChatUser) {
    this.selectedUserId = user.uid;
    this.userSelected.emit(user);
  }
}
