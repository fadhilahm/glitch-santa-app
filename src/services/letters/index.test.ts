import LettersService from "./index";
import { Letter } from "./types.d";

type LetterData = Omit<Letter, "id">;

describe("LettersService", () => {
  let service: LettersService;

  beforeEach(() => {
    service = new LettersService();
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
});
