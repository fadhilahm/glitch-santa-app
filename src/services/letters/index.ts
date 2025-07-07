import { Letter } from "./types";
import { v4 as uuidv4 } from "uuid";

type LetterData = Omit<Letter, "id">;

class LettersService {
  private _pendingLetters: Letter[];
  private sentLetters: Letter[];

  constructor() {
    this._pendingLetters = [];
    this.sentLetters = [];
  }

  public async create({ username, address, message }: LetterData) {
    const letter: Letter = {
      id: uuidv4(),
      username,
      address,
      message,
    };
    this._pendingLetters.push(letter);
    return letter;
  }

  public async createBatch(letters: Letter[]) {
    this._pendingLetters.push(...letters);
    return letters;
  }

  public async sendPendingLetters() {
    const letters = this._pendingLetters;
    this.sentLetters = [...this.sentLetters, ...letters];
    this._pendingLetters = [];
    return this.sentLetters;
  }

  public get pendingLetters() {
    return this._pendingLetters;
  }
}

export default LettersService;