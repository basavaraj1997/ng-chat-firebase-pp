import { User as FirebaseUser } from '@angular/fire/auth';

export interface ChatUser extends FirebaseUser {
    name?: string;
    lastSeen?: string;
    isOnline?: boolean;
}
