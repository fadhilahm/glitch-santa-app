import AuthorizationService from "./index";
import { User, UserProfile } from "./types";

global.fetch = jest.fn();

describe("AuthorizationService", () => {
  let authService: AuthorizationService;

  const mockUsers: User[] = [
    { id: "1", username: "charlie.brown", age: 8, address: "123 Peanuts St" },
    { id: "2", username: "lucy.van.pelt", age: 9, address: "456 Football Ave" },
    { id: "3", username: "teen.user", age: 15, address: "789 Teen St" },
  ];

  const mockUserProfiles: UserProfile[] = [
    { userID: "1", name: "Charlie Brown", birthdate: "2015-12-25" },
    { userID: "2", name: "Lucy Van Pelt", birthdate: "2014-06-15" },
    { userID: "3", name: "Teen User", birthdate: "2008-03-10" },
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
      const result = await authService.validateUser("1");

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        id: "1",
        username: "charlie.brown",
        age: 9,
        address: "123 Peanuts St",
      });
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
      const result = await authService.validateUser("3");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("17 years old");
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
      const result = await authService.validateUser("999");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("User not found");
      expect(result.user).toBeUndefined();
    });

    it("should return invalid for user without profile", async () => {
      // Arrange
      const usersWithExtra = [
        ...mockUsers,
        { id: "4", username: "no.profile", age: 7, address: "No Profile St" },
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
      const result = await authService.validateUser("4");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("User profile not found");
      expect(result.user).toBeUndefined();
    });

    it("should handle API fetch errors", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act & Assert
      await expect(authService.validateUser("1")).rejects.toThrow(
        "Failed to fetch user data"
      );
    });

    it("should handle API response not ok", async () => {
      // Arrange
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Act & Assert
      await expect(authService.validateUser("1")).rejects.toThrow(
        "Failed to fetch user data"
      );
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
      const result = await authService.isUserUnder10("1");

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
      const result = await authService.isUserUnder10("3");

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
      const result = await authService.getUserInfo("1");

      // Assert
      expect(result).toEqual({
        id: "1",
        username: "charlie.brown",
        age: 9,
        address: "123 Peanuts St",
      });
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
      const result = await authService.getUserInfo("999");

      // Assert
      expect(result).toBeNull();
    });
  });
});
