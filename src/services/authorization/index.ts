import { HTTP_CODES } from "@constants/httpCodes";
import { User, UserProfile, ValidationResult } from "./types";
import { ERROR_MESSAGES } from "@constants/errorMessages";

class AuthorizationService {
  private users: User[] = [];
  private userProfiles: UserProfile[] = [];

  private async fetchUserData(): Promise<void> {
    try {
      const [usersResponse, profilesResponse] = await Promise.all([
        fetch(
          "https://raw.githubusercontent.com/alj-devops/santa-data/master/users.json"
        ),
        fetch(
          "https://raw.githubusercontent.com/alj-devops/santa-data/master/userProfiles.json"
        ),
      ]);

      if (!usersResponse.ok || !profilesResponse.ok) {
        throw new Error(ERROR_MESSAGES.FETCH_USER_DATA_FAILED);
      }

      this.users = await usersResponse.json();
      this.userProfiles = await profilesResponse.json();
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw new Error(ERROR_MESSAGES.FETCH_USER_DATA_FAILED);
    }
  }

  async validateUser(userId: string): Promise<ValidationResult> {
    await this.fetchUserData();

    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return {
        isValid: false,
        error: {
          code: HTTP_CODES.ERROR.NOT_FOUND,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        },
      };
    }

    const profile = this.userProfiles.find(p => p.userID === userId);
    if (!profile) {
      return {
        isValid: false,
        error: {
          code: HTTP_CODES.ERROR.NOT_FOUND,
          message: ERROR_MESSAGES.USER_PROFILE_NOT_FOUND,
        },
      };
    }

    const birthDate = new Date(profile.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age >= 10) {
      return {
        isValid: false,
        error: {
          code: HTTP_CODES.ERROR.FORBIDDEN,
          message: ERROR_MESSAGES.USER_TOO_OLD(age),
        },
      };
    }

    return {
      isValid: true,
      user: {
        id: user.id,
        username: user.username,
        age: age,
        address: user.address,
      },
    };
  }

  async isUserUnder10(userId: string): Promise<boolean> {
    const result = await this.validateUser(userId);
    return result.isValid;
  }

  async getUserInfo(userId: string): Promise<User | null> {
    const result = await this.validateUser(userId);
    return result.isValid ? result.user || null : null;
  }
}

export default AuthorizationService;
