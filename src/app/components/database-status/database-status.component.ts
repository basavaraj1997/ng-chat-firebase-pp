import { Component, OnInit } from '@angular/core';
import { Database, ref, get } from '@angular/fire/database';

@Component({
  selector: 'app-database-status',
  templateUrl: './database-status.component.html',
  styleUrls: ['./database-status.component.css']
})
export class DatabaseStatusComponent implements OnInit {
  status: 'checking' | 'success' | 'warning' | 'error' = 'checking';
  message = 'Checking database connection...';

  constructor(private db: Database) {}

  ngOnInit() {
    this.testConnection();
  }

  private async testConnection() {
    try {
      if (!this.db) {
        this.status = 'error';
        this.message = 'Database not initialized';
        return;
      }

      // Test by trying to read the users node instead
      const testRef = ref(this.db, 'users');
      const snapshot = await get(testRef);
      
      // If we can read the reference, the connection is working
      this.status = 'success';
      this.message = 'Database connected successfully! ✅';
    } catch (error: any) {
      console.error('Database connection test failed:', error);
      this.status = 'error';
      if (error.code === 'PERMISSION_DENIED') {
        this.message = 'Database connection failed: Authentication required';
      } else if (error.code === 'NETWORK_ERROR') {
        this.message = 'Database connection failed: Network error';
      } else {
        this.message = 'Database connection failed: Please check your Firebase configuration';
      }
    }
  }

  getStatusColor(): string {
    switch (this.status) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }
}
