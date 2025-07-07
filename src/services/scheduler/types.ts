export interface EmailCheckResult {
  success: boolean;
  newLettersCount: number;
  error?: string;
}

export interface IncomingEmail {
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export interface SchedulerStatus {
  isRunning: boolean;
  nextRun?: Date;
  lastCheck?: Date;
  totalEmailsProcessed: number;
}

export interface SchedulerConfig {
  intervalMinutes: number;
  enabled: boolean;
}
