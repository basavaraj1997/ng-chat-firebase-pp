import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Database, ref, push, onValue, query, orderByChild } from '@angular/fire/database';
import { Storage, ref as storageRef, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @Input() currentUser!: User;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;

  message = '';
  messages: any[] = [];
  showEmojiPicker = false;
  isUploading = false;
  uploadProgress: {[key: string]: number} = {};

  constructor(
    private db: Database,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.listenToMessages();
  }

  private listenToMessages() {
    const messagesRef = ref(this.db, 'messages');
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    onValue(messagesQuery, (snapshot) => {
      const messages: any[] = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      this.messages = messages;
    });
  }

  async sendMessage(additionalData = {}) {
    if (!this.message && !additionalData) return;

    try {
      const messageData = {
        text: this.message,
        sender: this.currentUser.uid,
        senderName: this.currentUser.displayName,
        senderPhoto: this.currentUser.photoURL,
        timestamp: Date.now(),
        ...additionalData
      };

      await push(ref(this.db, 'messages'), messageData);
      this.message = '';
      this.showEmojiPicker = false;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async handleFileUpload(file: File, type: 'image' | 'file') {
    try {
      this.isUploading = true;
      const fileRef = storageRef(this.storage, `${type}s/${Date.now()}_${file.name}`);
      
      await uploadBytes(fileRef, file);
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
