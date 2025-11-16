import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from './entities/order-detail.entity';
import { CreateOrderDetailDto } from './dtos/create-order-detail.dto';
import { UpdateOrderDetailDto } from './dtos/update-order-detail.dto';
import { Order } from '../order/entities/order.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectRepository(OrderDetail)
        private readonly detailRepo: Repository<OrderDetail>,

        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    async findAll(): Promise<OrderDetail[]> {
        return this.detailRepo.find({ relations: ['order', 'product'] });
    }

    async findOne(id: number, currentUserId?: number): Promise<OrderDetail> { 
    
    // Si se proporciona currentUserId, forzamos el filtro por propiedad de la ORDEN
    const whereCondition: any = { id };

    if (currentUserId) {
        whereCondition.order = { user: { id: currentUserId } }; 
    }
    
    const detail = await this.detailRepo.findOne({
        where: whereCondition, 
        relations: ['order', 'product'],
    });

    if (!detail) {
        throw new NotFoundException(`Order detail ${id} not found`); 
    }

    return detail;
}

    async create(dto: CreateOrderDetailDto): Promise<OrderDetail> {
        const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const product = await this.productRepo.findOne({
            where: { id: dto.productId },
        });
        if (!product) throw new NotFoundException('Product not found');

        // Aseguramos la conversión antes del cálculo
        const subtotal = Number(product.price) * dto.quantity; 

        const detail = this.detailRepo.create({
            order,
            product,
            quantity: dto.quantity,
            unitPrice: product.price,
            subtotal,
        });

        return this.detailRepo.save(detail);
    }

    async update(id: number, dto: UpdateOrderDetailDto): Promise<OrderDetail> {
        const detail = await this.findOne(id);
        let updatedDetail = detail;

        if (dto.quantity && dto.quantity !== detail.quantity) {
            
            // 1. Recalcular subtotal del detalle
            detail.quantity = dto.quantity;
            detail.subtotal = Number(detail.unitPrice) * dto.quantity; 

            updatedDetail = await this.detailRepo.save(detail);

            // 2. CRÍTICO: Recalcular y actualizar el total de la ORDEN
            // Cargamos la orden con todos sus detalles para recalcular el total
            const orderWithDetails = await this.orderRepo.findOne({
                where: { id: updatedDetail.order.id },
                relations: ['details'], // Necesitamos los detalles para sumar
            });

            if (orderWithDetails) {
                 const newTotal = orderWithDetails.details.reduce(
                    (acc, d) => acc + d.subtotal,
                    0,
                );
                orderWithDetails.total = newTotal;
                await this.orderRepo.save(orderWithDetails);
            }
        }
        
        return updatedDetail;
    }

    async remove(id: number): Promise<{ message: string }> {
        const detail = await this.findOne(id);
        
        // Antes de eliminar, necesitamos la orden para recalcular el total
        const orderId = detail.order.id;
        
        await this.detailRepo.remove(detail);
        
        // Recalcular el total de la orden después de la eliminación
        const orderWithRemainingDetails = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['details'],
        });

        if (orderWithRemainingDetails) {
            const newTotal = orderWithRemainingDetails.details.reduce(
                (acc, d) => acc + d.subtotal,
                0,
            );
            orderWithRemainingDetails.total = newTotal;
            await this.orderRepo.save(orderWithRemainingDetails);
        }

        return { message: `Order detail ${id} deleted successfully` };
    }
}