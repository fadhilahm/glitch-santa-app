import * as cron from "node-cron";
import { v4 as uuidv4 } from "uuid";

import LettersService from "../letters";
import { Letter } from "../letters/types";
import {
  EmailCheckResult,
  IncomingEmail,
  SchedulerStatus,
  SchedulerConfig,
} from "./types";

class SchedulerService {
  private lettersService: LettersService;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastCheck: Date | undefined = undefined;
  private totalLettersProcessed: number = 0;
  private _config: SchedulerConfig;

  constructor(
    lettersService: LettersService,
    config?: Partial<SchedulerConfig>
  ) {
    this.lettersService = lettersService;
    this._config = {
      // intervalMinutes: 1, // for testing
        intervalMinutes: 15,
      enabled: true,
      ...config,
    };
  }

  public start(): void {
    if (this.isRunning) {
      console.log("📅 Scheduler is already running");
      return;
    }

    if (!this._config.enabled) {
      console.log("📅 Scheduler is disabled");
      return;
    }

    const cronExpression = `0 */${this._config.intervalMinutes} * * * *`;

    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log(
        `🔍 Checking for pending letters... (${new Date().toISOString()})`
      );
      await this.checkAndProcessEmails();
    });

    this.isRunning = true;
    console.log(
      `✅ Letter processing scheduler started - checking every ${this._config.intervalMinutes} minutes`
    );
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log("🛑 Letter processing scheduler stopped");
  }

  public getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning
        ? new Date(Date.now() + this._config.intervalMinutes * 60 * 1000)
        : undefined,
      lastCheck: this.lastCheck,
      totalEmailsProcessed: this.totalLettersProcessed,
    };
  }

  public async runManualCheck(): Promise<EmailCheckResult> {
    console.log("🔍 Running manual letter processing...");
    return await this.checkAndProcessEmails();
  }

  public updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this._config = { ...this._config, ...newConfig };

    if (wasRunning && this._config.enabled) {
      this.start();
    }

    console.log(`⚙️ Scheduler config updated:`, this._config);
  }

  private async checkAndProcessEmails(): Promise<EmailCheckResult> {
    try {
      this.lastCheck = new Date();

      const letters = this.lettersService.pendingLetters;

      if (letters.length === 0) {
        console.log("📭 No pending letters found");
        return { success: true, newLettersCount: 0 };
      }

      console.log(`📧 Found ${letters.length} pending letter(s) to send`);

      // Just send the existing pending letters - no need to create batch
      await this.lettersService.sendPendingLetters();

      this.totalLettersProcessed += letters.length;

      console.log(`✅ Successfully sent ${letters.length} letter(s)`);

      return { success: true, newLettersCount: letters.length };
    } catch (error) {
      console.error("❌ Error processing letters:", error);
      return {
        success: false,
        newLettersCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public getStatistics() {
    return {
      totalEmailsProcessed: this.totalLettersProcessed,
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      config: this._config,
    };
  }

  public get config() {
    return this._config;
  }
}

export default SchedulerService;
