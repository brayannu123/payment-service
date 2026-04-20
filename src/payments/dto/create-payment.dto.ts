import { IsString, IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  cardId: string;

  @IsObject()
  @IsNotEmpty()
  service: {
    name: string;
    [key: string]: any;
  };
}
