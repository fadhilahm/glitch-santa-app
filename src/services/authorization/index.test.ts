import AuthorizationService from "./index";
import { User, UserProfile, ValidatedUser } from "./types";

global.fetch = jest.fn();

describe("AuthorizationService", () => {
  let authService: AuthorizationService;

  const mockUsers: User[] = [
    { uid: "1", username: "charlie.brown" },
    { uid: "2", username: "lucy.van.pelt" },
    { uid: "3", username: "teen.user" },
  ];

  const mockUserProfiles: UserProfile[] = [
    { userUid: "1", address: "123 Peanuts St", birthdate: "2015/12/25" },
    { userUid: "2", address: "456 Football Ave", birthdate: "2014/06/15" },
    { userUid: "3", address: "789 Teen St", birthdate: "2008/03/10" },
  ];

  beforeEach(() => {
    authService = new AuthorizationService();
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should return valid for user under 10 years old", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.validateUser("charlie.brown");

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        uid: "1",
        username: "charlie.brown",
        age: expect.any(Number),
        address: "123 Peanuts St",
      });
      expect(result.user?.age).toBeLessThan(10);
      expect(result.error).toBeUndefined();
    });

    it("should return invalid for user over 10 years old", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.validateUser("teen.user");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("years old");
      expect(result.user).toBeUndefined();
    });

    it("should return invalid for non-existent user", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.validateUser("non.existent");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("User not found");
      expect(result.user).toBeUndefined();
    });

    it("should return invalid for user without profile", async () => {
      // Arrange
      const usersWithExtra = [
        ...mockUsers,
        { uid: "4", username: "no.profile" },
      ];
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(usersWithExtra),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.validateUser("no.profile");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("User profile not found");
      expect(result.user).toBeUndefined();
    });

    it("should properly calculate age from YYYY/MM/DD format", async () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const customUsers = [{ uid: "test", username: "test.user" }];
      const customProfiles = [{ 
        userUid: "test", 
        address: "Test St", 
        birthdate: `${currentYear - 8}/01/01` // 8 years old
      }];
      
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(customUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(customProfiles),
        } as Response);

      // Act
      const result = await authService.validateUser("test.user");

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.user?.age).toBe(8);
    });

    it("should handle API fetch errors", async () => {
      // Arrange
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act & Assert
      await expect(authService.validateUser("charlie.brown")).rejects.toThrow(
        "Failed to fetch user data"
      );

      // Cleanup
      consoleSpy.mockRestore();
    });

    it("should handle API response not ok", async () => {
      // Arrange
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Act & Assert
      await expect(authService.validateUser("charlie.brown")).rejects.toThrow(
        "Failed to fetch user data"
      );

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe("isUserUnder10", () => {
    it("should return true for user under 10", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.isUserUnder10("charlie.brown");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for user 10 or older", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.isUserUnder10("teen.user");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getUserInfo", () => {
    it("should return user info for valid user", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.getUserInfo("charlie.brown");

      // Assert
      expect(result).toEqual({
        uid: "1",
        username: "charlie.brown",
        age: expect.any(Number),
        address: "123 Peanuts St",
      });
      expect(result?.age).toBeLessThan(10);
    });

    it("should return null for invalid user", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfiles),
        } as Response);

      // Act
      const result = await authService.getUserInfo("non.existent");

      // Assert
      expect(result).toBeNull();
    });
  });
});
