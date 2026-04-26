import { Event } from "./event.dto";

export interface SendVerificationEmailEvent extends Event { 
  data: {
    email: string;
  }
}