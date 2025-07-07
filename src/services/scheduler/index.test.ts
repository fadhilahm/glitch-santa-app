import SchedulerService from "./index";
import LettersService from "../letters";

jest.mock("node-cron", () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn(),
  })),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}));

const mockCron = require("node-cron");

describe("SchedulerService", () => {
  let schedulerService: SchedulerService;
  let lettersService: LettersService;

  beforeEach(() => {
    process.env.ETHEREAL_EMAIL = "test@ethereal.email";
    process.env.ETHEREAL_PASSWORD = "testpassword";

    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    lettersService = new LettersService();
    schedulerService = new SchedulerService(lettersService);
  });

  afterEach(() => {
    schedulerService.stop();
    jest.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with default configuration", () => {
      const status = schedulerService.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.totalEmailsProcessed).toBe(0);
    });

    it("should accept custom configuration", () => {
      const customConfig = { intervalMinutes: 30, enabled: false };
      const customScheduler = new SchedulerService(
        lettersService,
        customConfig
      );

      const stats = customScheduler.getStatistics();
      expect(stats.config.intervalMinutes).toBe(30);
      expect(stats.config.enabled).toBe(false);
    });
  });

  describe("start", () => {
    it("should start the scheduler with correct cron expression", () => {
      schedulerService.start();

      expect(mockCron.schedule).toHaveBeenCalledWith(
        "0 */1 * * * *",
        expect.any(Function)
      );
      expect(schedulerService.getStatus().isRunning).toBe(true);
    });

    it("should not start multiple times", () => {
      schedulerService.start();
      schedulerService.start();

      expect(mockCron.schedule).toHaveBeenCalledTimes(1);
    });

    it("should not start if disabled", () => {
      const disabledScheduler = new SchedulerService(lettersService, {
        enabled: false,
      });
      disabledScheduler.start();

      expect(mockCron.schedule).not.toHaveBeenCalled();
      expect(disabledScheduler.getStatus().isRunning).toBe(false);
    });

    it("should use custom interval in cron expression", () => {
      const customScheduler = new SchedulerService(lettersService, {
        intervalMinutes: 30,
      });
      customScheduler.start();

      expect(mockCron.schedule).toHaveBeenCalledWith(
        "0 */30 * * * *",
        expect.any(Function)
      );
    });
  });

  describe("stop", () => {
    it("should stop the scheduler", () => {
      const mockStop = jest.fn();
      mockCron.schedule.mockReturnValue({ stop: mockStop });

      schedulerService.start();
      schedulerService.stop();

      expect(mockStop).toHaveBeenCalled();
      expect(schedulerService.getStatus().isRunning).toBe(false);
    });

    it("should handle stopping when not running", () => {
      expect(() => schedulerService.stop()).not.toThrow();
    });
  });

  describe("getStatus", () => {
    it("should return correct status when stopped", () => {
      const status = schedulerService.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.nextRun).toBeUndefined();
      expect(status.lastCheck).toBeUndefined();
      expect(status.totalEmailsProcessed).toBe(0);
    });

    it("should return correct status when running", () => {
      schedulerService.start();
      const status = schedulerService.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.nextRun).toBeDefined();
      expect(status.nextRun!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("updateConfig", () => {
    it("should update configuration and restart if running", () => {
      const mockStop = jest.fn();
      mockCron.schedule.mockReturnValue({ stop: mockStop });

      schedulerService.start();
      schedulerService.updateConfig({ intervalMinutes: 30 });

      expect(mockStop).toHaveBeenCalled();
      expect(mockCron.schedule).toHaveBeenCalledTimes(2);
      expect(mockCron.schedule).toHaveBeenLastCalledWith(
        "0 */30 * * * *",
        expect.any(Function)
      );
    });

    it("should not restart if not currently running", () => {
      schedulerService.updateConfig({ intervalMinutes: 30 });

      expect(mockCron.schedule).not.toHaveBeenCalled();
      expect(schedulerService.getStatistics().config.intervalMinutes).toBe(30);
    });

    it("should disable scheduler if enabled is set to false", () => {
      const mockStop = jest.fn();
      mockCron.schedule.mockReturnValue({ stop: mockStop });

      schedulerService.start();
      schedulerService.updateConfig({ enabled: false });

      expect(mockStop).toHaveBeenCalled();
      expect(schedulerService.getStatus().isRunning).toBe(false);
    });
  });

  describe("runManualCheck", () => {
    it("should process pending letters and send them", async () => {
      await lettersService.create({
        username: "Child",
        address: "123 Main Street, Anytown, USA 12345",
        message: "Dear Santa, I want a bike!",
      });

      const sendPendingLettersSpy = jest.spyOn(
        lettersService,
        "sendPendingLetters"
      );
      sendPendingLettersSpy.mockResolvedValue([]);

      const result = await schedulerService.runManualCheck();

      expect(result.success).toBe(true);
      expect(result.newLettersCount).toBe(1);
      expect(sendPendingLettersSpy).toHaveBeenCalled();
    });

    it("should handle empty pending letters", async () => {
      await lettersService.sendPendingLetters();

      const result = await schedulerService.runManualCheck();

      expect(result.success).toBe(true);
      expect(result.newLettersCount).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      await lettersService.create({
        username: "Child",
        address: "123 Main Street",
        message: "Dear Santa!",
      });

      jest
        .spyOn(lettersService, "sendPendingLetters")
        .mockRejectedValue(new Error("Email service unavailable"));

      const result = await schedulerService.runManualCheck();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email service unavailable");
    });

    it("should update statistics after processing", async () => {
      await lettersService.create({
        username: "Test1",
        address: "Address1",
        message: "Message1",
      });
      await lettersService.create({
        username: "Test2",
        address: "Address2",
        message: "Message2",
      });

      jest.spyOn(lettersService, "sendPendingLetters").mockResolvedValue([]);

      await schedulerService.runManualCheck();

      const stats = schedulerService.getStatistics();
      expect(stats.totalEmailsProcessed).toBe(2);
      expect(stats.lastCheck).toBeDefined();
    });
  });

  describe("letter processing", () => {
    it("should correctly identify pending letters count", () => {
      expect(lettersService.pendingLetters.length).toBe(0);
    });

    it("should process multiple pending letters", async () => {
      await lettersService.create({
        username: "Child1",
        address: "Address1",
        message: "Message1",
      });
      await lettersService.create({
        username: "Child2",
        address: "Address2",
        message: "Message2",
      });
      await lettersService.create({
        username: "Child3",
        address: "Address3",
        message: "Message3",
      });

      expect(lettersService.pendingLetters.length).toBe(3);

      const sendPendingLettersSpy = jest.spyOn(
        lettersService,
        "sendPendingLetters"
      );
      sendPendingLettersSpy.mockResolvedValue([]);

      const result = await schedulerService.runManualCheck();

      expect(result.success).toBe(true);
      expect(result.newLettersCount).toBe(3);
      expect(sendPendingLettersSpy).toHaveBeenCalled();
    });
  });

  describe("getStatistics", () => {
    it("should return complete statistics", () => {
      const stats = schedulerService.getStatistics();

      expect(stats).toHaveProperty("totalEmailsProcessed");
      expect(stats).toHaveProperty("isRunning");
      expect(stats).toHaveProperty("lastCheck");
      expect(stats).toHaveProperty("config");
      expect(stats.config).toHaveProperty("intervalMinutes");
      expect(stats.config).toHaveProperty("enabled");
    });
  });
});
