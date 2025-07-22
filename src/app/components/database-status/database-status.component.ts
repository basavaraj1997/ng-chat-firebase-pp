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

      const testRef = ref(this.db, '.info/connected');
      const snapshot = await get(testRef);
      
      if (snapshot.exists()) {
        this.status = 'success';
        this.message = 'Database connected successfully! ✅';
      } else {
        this.status = 'warning';
        this.message = 'Database connection established but no data found';
      }
    } catch (error: any) {
      console.error('Database connection test failed:', error);
      this.status = 'error';
      this.message = `Database connection failed: ${error.message}`;
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
