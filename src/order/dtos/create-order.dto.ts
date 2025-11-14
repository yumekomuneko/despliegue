import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
    @IsInt()
    userId: number;

    @IsInt()
    cartId: number;

    @IsOptional()
    @IsString()
    status?: string;
}
