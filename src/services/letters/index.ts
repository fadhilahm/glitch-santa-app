import { v4 as uuidv4 } from "uuid";
import nodemailer, { Transporter } from "nodemailer";
import { Email, Letter } from "./types";

type LetterData = Omit<Letter, "id">;

class LettersService {
  private _pendingLetters: Letter[];
  private sentLetters: Letter[];
  private transporter: Transporter;

  constructor() {
    this._pendingLetters = [];
    this.sentLetters = [];
    const etherealEmail = process.env.ETHEREAL_EMAIL;
    const etherealPassword = process.env.ETHEREAL_PASSWORD;
    if (!etherealEmail || !etherealPassword) {
      throw new Error("ETHEREAL_EMAIL and ETHEREAL_PASSWORD must be set");
    }
    this.transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: etherealEmail,
        pass: etherealPassword,
      },
    });
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

  private async sendLetter(letter: Letter) {
    try {
      const email: Email = {
        from: process.env.ETHEREAL_EMAIL!,
        to: process.env.ETHEREAL_EMAIL!,
        subject: `Letter to 🎅 from ${letter.username}`,
        text: letter.message,
      };
      const info = await this.transporter.sendMail(email);
      console.log("Message sent: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending letter:", error);
      throw error;
    }
  }

  public async sendPendingLetters() {
    try {
      const letters = this._pendingLetters;

      await Promise.all(letters.map(letter => this.sendLetter(letter)));

      this.sentLetters = [...this.sentLetters, ...letters];
      this._pendingLetters = [];
      return this.sentLetters;
    } catch (error) {
      console.error("Error sending letters:", error);
      throw error;
    }
  }

  public get pendingLetters() {
    return this._pendingLetters;
  }
}

export default LettersService;
