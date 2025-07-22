import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Database, ref, push, onValue, query, orderByChild } from '@angular/fire/database';
import { Storage, ref as storageRef, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { ChatUser } from '../../types/chat-types';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @Input() currentUser!: ChatUser;
  @Input() selectedUser?: ChatUser;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  message = '';
  messages: any[] = [];
  showEmojiPicker = false;
  isUploading = false;
  uploadProgress: {[key: string]: number} = {};
  private shouldScrollToBottom = true;

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) { }
  }

  onScroll(event: any): void {
    const element = event.target;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    this.shouldScrollToBottom = atBottom;
  }

  constructor(
    private db: Database,
    private storage: Storage
  ) {}

  ngOnInit() {
    // Initial messages load will happen when a user is selected
  }

  ngOnChanges() {
    if (this.selectedUser && this.currentUser) {
      this.listenToMessages();
    } else {
      this.messages = [];
    }
  }

  private getChatId(uid1: string, uid2: string): string {
    // Create a consistent chat ID regardless of who initiated the chat
    return [uid1, uid2].sort().join('_');
  }

  private listenToMessages() {
    if (!this.currentUser || !this.selectedUser) return;

    const chatId = this.getChatId(this.currentUser.uid, this.selectedUser.uid);
    const messagesRef = ref(this.db, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    onValue(messagesQuery, (snapshot) => {
      const messages: any[] = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      this.messages = messages;
      
      // Scroll to bottom when new messages arrive
      if (messages.length > 0) {
        this.shouldScrollToBottom = true;
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  async sendMessage(additionalData = {}) {
    if (!this.message && !additionalData) return;
    if (!this.selectedUser) return;

    try {
      const chatId = this.getChatId(this.currentUser.uid, this.selectedUser.uid);
      const messageData = {
        text: this.message,
        sender: this.currentUser.uid,
        receiver: this.selectedUser.uid,
        senderName: this.currentUser.displayName || this.currentUser.name || 'User',
        senderPhoto: this.currentUser.photoURL,
        timestamp: Date.now(),
        ...additionalData
      };

      await push(ref(this.db, `chats/${chatId}/messages`), messageData);
      this.message = '';
      this.showEmojiPicker = false;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async handleFileUpload(file: File, type: 'image' | 'file') {
    if (!this.selectedUser) return;

    try {
      this.isUploading = true;
      const timestamp = Date.now();
      const chatId = this.getChatId(this.currentUser.uid, this.selectedUser.uid);
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `chats/${chatId}/${type}s/${fileName}`;
      const fileRef = storageRef(this.storage, filePath);
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': this.currentUser.uid,
          'chatId': chatId
        }
      };
      
      await uploadBytes(fileRef, file, metadata);
      const downloadURL = await getDownloadURL(fileRef);

      await this.sendMessage({
        [type]: {
          url: downloadURL,
          name: file.name,
          size: file.size
        }
      });
      
      this.isUploading = false;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      this.isUploading = false;
    }
  }

  onImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFileUpload(file, 'image');
    }
  }

  onFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFileUpload(file, 'file');
    }
  }

  onEmojiSelect(event: any) {
    const emoji = event.detail.unicode || event.detail.emoji;
    this.message += emoji;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }
}
