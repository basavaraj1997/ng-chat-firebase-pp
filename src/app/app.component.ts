import { Component, OnInit } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Database, ref, set, onValue } from '@angular/fire/database';
import { ChatUser } from './types/chat-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  user: ChatUser | null = null;
  users: ChatUser[] = [];
  loading = true;
  error: string | null = null;
  selectedUser: ChatUser | undefined;

  // Type guard method
  isUser(user: ChatUser | null): user is ChatUser {
    return user !== null;
  }

  constructor(
    private auth: Auth,
    private db: Database
  ) {}

  ngOnInit() {
    this.auth.onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        this.updateUserData(user);
        this.listenToUsers();
      }
      this.loading = false;
    });
  }

  onUserSelected(user: ChatUser) {
    this.selectedUser = user;
  }

  async login() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      this.error = error.message;
      console.error('Login error:', error);
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
    } catch (error: any) {
      this.error = error.message;
      console.error('Logout error:', error);
    }
  }

  private updateUserData(user: ChatUser) {
    const userRef = ref(this.db, `users/${user.uid}`);
    set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
  }

  private listenToUsers() {
    const usersRef = ref(this.db, 'users');
    onValue(usersRef, (snapshot) => {
      const users: any[] = [];
      snapshot.forEach((childSnapshot) => {
        users.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      this.users = users;
    });
  }
}
