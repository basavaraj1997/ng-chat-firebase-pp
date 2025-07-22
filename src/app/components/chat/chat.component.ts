import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { Database, ref, push, onValue, query, orderByChild } from '@angular/fire/database';
import { Storage, ref as storageRef, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { ChatUser } from '../../types/chat-types';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnChanges {
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

  hideEmojiPicker(): void {
    this.showEmojiPicker = false;
  }

  addEmoji(event: { emoji: { native: string } }): void {
    const emoji = event.emoji.native;
    this.message += emoji;
  }

  private async handleUpload(file: File, type: 'image' | 'file'): Promise<void> {
    if (!file || !this.selectedUser) return;

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
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      this.isUploading = false;
    }
  }

  toggleEmojiPicker(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.selectedUser && this.currentUser) {
      this.listenToMessages();
    } else {
      this.messages = [];
    }
  }

  private getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  private listenToMessages(): void {
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
      
      if (messages.length > 0) {
        this.shouldScrollToBottom = true;
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  async sendMessage(additionalData: Record<string, any> = {}): Promise<void> {
    if (!this.message && !Object.keys(additionalData).length) return;
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

  onImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleUpload(file, 'image');
    }
  }

  onFileUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleUpload(file, 'file');
    }
  }

  onEmojiSelect(event: { detail: { unicode?: string; emoji?: string } }): void {
    const emoji = event.detail.unicode || event.detail.emoji;
    if (emoji) {
      this.message += emoji;
    }
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }
}
