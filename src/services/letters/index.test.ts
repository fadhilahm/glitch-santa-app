import LettersService from "./index";
import { Letter } from "./types.d";
import { EMAIL_ADDRESS } from "../../shared/constants/email";

type LetterData = Omit<Letter, "id">;

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

const mockNodemailer = require("nodemailer");
const mockSendMail = jest.fn();

describe("LettersService", () => {
  let service: LettersService;

  beforeEach(() => {
    process.env.ETHEREAL_EMAIL = "test@ethereal.email";
    process.env.ETHEREAL_PASSWORD = "testpassword";

    mockSendMail.mockClear();
    mockSendMail.mockResolvedValue({
      messageId: "test-message-id-default",
    });

    mockNodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    service = new LettersService();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with empty arrays", () => {
      expect(service.pendingLetters).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a letter and add it to pending letters", async () => {
      const letterData = {
        username: "John Doe",
        address: "123 Main St",
        message: "Dear Santa, I have been good this year!",
      };

      const result = await service.create(letterData);

      expect(result).toHaveProperty("id");
      expect(result.username).toBe(letterData.username);
      expect(result.address).toBe(letterData.address);
      expect(result.message).toBe(letterData.message);
      expect(service.pendingLetters).toHaveLength(1);
      expect(service.pendingLetters[0]).toEqual(result);
    });

    it("should generate unique IDs for each letter", async () => {
      const letterData1 = {
        username: "John Doe",
        address: "123 Main St",
        message: "Message 1",
      };

      const letterData2 = {
        username: "Jane Smith",
        address: "456 Oak Ave",
        message: "Message 2",
      };

      const letter1 = await service.create(letterData1);
      const letter2 = await service.create(letterData2);

      expect(letter1.id).not.toBe(letter2.id);
    });
  });

  describe("createBatch", () => {
    it("should add multiple letters to pending letters", async () => {
      const letters: Letter[] = [
        {
          id: "1",
          username: "John Doe",
          address: "123 Main St",
          message: "Message 1",
        },
        {
          id: "2",
          username: "Jane Smith",
          address: "456 Oak Ave",
          message: "Message 2",
        },
      ];

      const result = await service.createBatch(letters);

      expect(result).toEqual(letters);
      expect(service.pendingLetters).toHaveLength(2);
      expect(service.pendingLetters).toEqual(letters);
    });

    it("should add to existing pending letters", async () => {
      await service.create({
        username: "First User",
        address: "First Address",
        message: "First Message",
      });

      const batchLetters: Letter[] = [
        {
          id: "2",
          username: "Second User",
          address: "Second Address",
          message: "Second Message",
        },
      ];

      await service.createBatch(batchLetters);

      expect(service.pendingLetters).toHaveLength(2);
    });
  });

  describe("sendPendingLetters", () => {
    it("should move pending letters to sent and clear pending", async () => {
      const letterData = {
        username: "John Doe",
        address: "123 Main St",
        message: "Dear Santa!",
      };

      const createdLetter = await service.create(letterData);
      expect(service.pendingLetters).toHaveLength(1);

      const sentLetters = await service.sendPendingLetters();

      expect(service.pendingLetters).toHaveLength(0);
      expect(sentLetters).toHaveLength(1);
      expect(sentLetters[0]).toEqual(createdLetter);
    });

    it("should accumulate sent letters across multiple sends", async () => {
      await service.create({
        username: "User 1",
        address: "Address 1",
        message: "Message 1",
      });
      const firstSent = await service.sendPendingLetters();

      await service.create({
        username: "User 2",
        address: "Address 2",
        message: "Message 2",
      });
      const secondSent = await service.sendPendingLetters();

      expect(firstSent).toHaveLength(1);
      expect(secondSent).toHaveLength(2); // Accumulates previous sent letters
      expect(service.pendingLetters).toHaveLength(0);
    });

    it("should handle empty pending letters", async () => {
      const result = await service.sendPendingLetters();
      expect(result).toEqual([]);
    });
  });

  describe("pendingLetters getter", () => {
    it("should return the current pending letters array", async () => {
      expect(service.pendingLetters).toEqual([]);

      const letterData = {
        username: "Test User",
        address: "Test Address",
        message: "Test Message",
      };

      await service.create(letterData);
      expect(service.pendingLetters).toHaveLength(1);
    });

    it("should return a reference to the actual array", async () => {
      const letterData = {
        username: "Test User",
        address: "Test Address",
        message: "Test Message",
      };

      await service.create(letterData);
      const pendingRef = service.pendingLetters;

      expect(service.pendingLetters).toBe(pendingRef);
    });
  });

  describe("Email Configuration", () => {
    it("should throw error if ETHEREAL_EMAIL is not set", () => {
      delete process.env.ETHEREAL_EMAIL;

      expect(() => {
        new LettersService();
      }).toThrow("ETHEREAL_EMAIL and ETHEREAL_PASSWORD must be set");
    });

    it("should throw error if ETHEREAL_PASSWORD is not set", () => {
      delete process.env.ETHEREAL_PASSWORD;

      expect(() => {
        new LettersService();
      }).toThrow("ETHEREAL_EMAIL and ETHEREAL_PASSWORD must be set");
    });

    it("should create nodemailer transporter with correct configuration", () => {
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: "test@ethereal.email",
          pass: "testpassword",
        },
      });
    });
  });

  describe("Email Sending", () => {
    it("should send pending letters with correct email format", async () => {
      const letterData = {
        username: "Tommy Smith",
        address: "123 Main St, Anytown, USA",
        message: "Dear Santa, I would like a bike for Christmas!",
      };

      mockSendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      await service.create(letterData);
      const result = await service.sendPendingLetters();

      expect(mockSendMail).toHaveBeenCalledWith({
        from: EMAIL_ADDRESS.FROM,
        to: EMAIL_ADDRESS.TO,
        subject: "Letter to 🎅 from Tommy Smith",
        text: "Dear Santa, I would like a bike for Christmas!",
      });

      expect(result).toHaveLength(1);
      expect(service.pendingLetters).toHaveLength(0);
    });

    it("should send multiple pending letters", async () => {
      const letterData1 = {
        username: "Tommy",
        address: "123 Main St",
        message: "Dear Santa, I want a bike!",
      };

      const letterData2 = {
        username: "Sally",
        address: "456 Oak St",
        message: "Dear Santa, I want a doll!",
      };

      mockSendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      await service.create(letterData1);
      await service.create(letterData2);

      const result = await service.sendPendingLetters();

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenNthCalledWith(1, {
        from: EMAIL_ADDRESS.FROM,
        to: EMAIL_ADDRESS.TO,
        subject: "Letter to 🎅 from Tommy",
        text: "Dear Santa, I want a bike!",
      });
      expect(mockSendMail).toHaveBeenNthCalledWith(2, {
        from: EMAIL_ADDRESS.FROM,
        to: EMAIL_ADDRESS.TO,
        subject: "Letter to 🎅 from Sally",
        text: "Dear Santa, I want a doll!",
      });

      expect(result).toHaveLength(2);
      expect(service.pendingLetters).toHaveLength(0);
    });

    it("should handle email sending errors", async () => {
      const letterData = {
        username: "Tommy",
        address: "123 Main St",
        message: "Dear Santa, I want a bike!",
      };

      const emailError = new Error("Email sending failed");
      mockSendMail.mockRejectedValue(emailError);

      await service.create(letterData);

      await expect(service.sendPendingLetters()).rejects.toThrow(
        "Email sending failed"
      );

      expect(service.pendingLetters).toHaveLength(1);
    });

    it("should format email subject correctly with special characters in username", async () => {
      const letterData = {
        username: "José María",
        address: "456 Oak Street",
        message: "¡Hola Santa!",
      };

      mockSendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      await service.create(letterData);
      await service.sendPendingLetters();

      expect(mockSendMail).toHaveBeenCalledWith({
        from: EMAIL_ADDRESS.FROM,
        to: EMAIL_ADDRESS.TO,
        subject: "Letter to 🎅 from José María",
        text: "¡Hola Santa!",
      });
    });

    it("should handle empty message", async () => {
      const letterData = {
        username: "Tommy",
        address: "123 Main St",
        message: "",
      };

      mockSendMail.mockResolvedValue({
        messageId: "test-message-id",
      });

      await service.create(letterData);
      await service.sendPendingLetters();

      expect(mockSendMail).toHaveBeenCalledWith({
        from: EMAIL_ADDRESS.FROM,
        to: EMAIL_ADDRESS.TO,
        subject: "Letter to 🎅 from Tommy",
        text: "",
      });
    });

    it("should log successful email sending", async () => {
      const letterData = {
        username: "Tommy",
        address: "123 Main St",
        message: "Dear Santa!",
      };

      const messageId = "test-message-123";
      mockSendMail.mockResolvedValue({
        messageId,
      });

      await service.create(letterData);
      await service.sendPendingLetters();

      expect(console.log).toHaveBeenCalledWith("Message sent: %s", messageId);
    });

    it("should log email sending errors", async () => {
      const letterData = {
        username: "Tommy",
        address: "123 Main St",
        message: "Dear Santa!",
      };

      const emailError = new Error("SMTP connection failed");
      mockSendMail.mockRejectedValue(emailError);

      await service.create(letterData);

      await expect(service.sendPendingLetters()).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        "Error sending letter:",
        emailError
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error sending letters:",
        emailError
      );
    });
  });
});
