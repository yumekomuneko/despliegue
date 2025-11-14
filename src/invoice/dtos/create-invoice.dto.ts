import { IsNumber, IsString } from 'class-validator';

export class CreateInvoiceDto {
    @IsNumber()
    userId: number;

    @IsNumber()
    orderId: number;

    @IsNumber()
    paymentId: number;

    @IsNumber()
    totalAmount: number;

    @IsString()
    invoiceNumber: string;
}
