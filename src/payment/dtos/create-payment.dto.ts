import { IsInt, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
    @IsInt()
    orderId: number;

    @IsInt()
    userId: number; // quien paga

    @IsNumber()
    amount: number; // monto que paga (cliente)

    @IsString()
    method: string; // e.g. "credit_card", "stripe", "paypal", "transfer"

    @IsOptional()
    @IsString()
  transactionId?: string; // id del proveedor (opcional)
}
