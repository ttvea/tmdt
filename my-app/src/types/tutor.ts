export interface Tutor {
  id: number;
  name: string;
  subject: string;
  rating: number;
  reviews: number;
  price: number;
  description: string;
  avatar: string;
  tags: string[];
  verified: boolean;
}