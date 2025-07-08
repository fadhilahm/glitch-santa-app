import fetch from "node-fetch";

import { User, UserProfile, ValidationResult, ValidatedUser } from "./types";
import { HTTP_CODES } from "../../shared/constants/httpCodes";
import { ERROR_MESSAGES } from "../../shared/constants/errorMessages";

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

      this.users = (await usersResponse.json()) as User[];
      this.userProfiles = (await profilesResponse.json()) as UserProfile[];
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw new Error(ERROR_MESSAGES.FETCH_USER_DATA_FAILED);
    }
  }

  async validateUser(username: string): Promise<ValidationResult> {
    await this.fetchUserData();

    const user = this.users.find(u => u.username === username);
    if (!user) {
      return {
        isValid: false,
        error: {
          code: HTTP_CODES.ERROR.NOT_FOUND,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        },
      };
    }

    const profile = this.userProfiles.find(p => p.userUid === user?.uid);
    if (!profile) {
      return {
        isValid: false,
        error: {
          code: HTTP_CODES.ERROR.NOT_FOUND,
          message: ERROR_MESSAGES.USER_PROFILE_NOT_FOUND,
        },
      };
    }

    // Parse YYYY/MM/DD format safely
    const [year, month, day] = profile.birthdate.split("/").map(Number);
    const birthDate = new Date(year, month - 1, day); // month is 0-indexed
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
        uid: user.uid,
        username: user.username,
        age,
        address: profile.address,
      },
    };
  }

  async isUserUnder10(userId: string): Promise<boolean> {
    const result = await this.validateUser(userId);
    return result.isValid;
  }

  async getUserInfo(username: string): Promise<ValidatedUser | null> {
    const result = await this.validateUser(username);
    return result.isValid ? result.user || null : null;
  }
}

export default AuthorizationService;
