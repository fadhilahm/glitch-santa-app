export type Letter = {
  id: string; // uuid
  username: string;
  address: string;
  message: string;
};

export type Email = {
  from: string;
  to: string;
  subject: string;
  text: string;
};
