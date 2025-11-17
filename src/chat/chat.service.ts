// chat.service.ts - VERSIÓN SIMPLIFICADA PARA PROBAR
import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';

@Injectable()
export class ChatService {
    constructor(
        private productService: ProductService
    ) {}

    /** 🔍 CONSULTAR DISPONIBILIDAD DE PRODUCTO */
    async checkProductAvailability(productQuery: string, customerId: string) {
        console.log(`🔍 Buscando producto: ${productQuery}`);
        
        const product = await this.productService.findByQuery(productQuery);
        
        if (!product) {
            return {
                available: false,
                message: `No encontré el producto "${productQuery}"`
            };
        }

        const stockInfo = await this.productService.getStockInfo(product.id);
        const recommendations = await this.productService.getRecommendations(product.id, customerId);

        return {
            available: stockInfo.available,
            product: {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                imageUrl: product.imageUrl,
                description: product.description
            },
            stock: stockInfo,
            message: stockInfo.available 
                ? `✅ ${product.name} está disponible. Stock: ${stockInfo.quantity} unidades. Precio: $${product.price}`
                : `❌ ${product.name} está agotado. Stock actual: ${stockInfo.quantity} unidades.`,
            recommendations: recommendations.slice(0, 3)
        };
    }

    /** ⚖️ COMPARAR PRODUCTOS */
    async compareProducts(productQueries: string[]) {
        console.log(`⚖️ Comparando productos: ${productQueries.join(', ')}`);
        
        // Buscar productos
        const productPromises = productQueries.map(query => 
            this.productService.findByQuery(query)
        );
        const products = await Promise.all(productPromises);
        
        const validProducts = products.filter(p => p !== null);
        const validProductIds = validProducts.map(p => p.id);
        
        if (validProducts.length < 2) {
            return {
                success: false,
                message: 'Necesito al menos 2 productos válidos para comparar'
            };
        }

        const comparison = await this.productService.compareProducts(validProductIds);

        return {
            success: true,
            products: comparison,
            message: `He comparado ${validProducts.length} productos:`
        };
    }

    /** 🛡️ OBTENER INFORMACIÓN DE GARANTÍA */
    async getWarrantyInfo(productQuery: string) {
        console.log(`🛡️ Consultando garantía para: ${productQuery}`);
        
        const product = await this.productService.findByQuery(productQuery);
        
        if (!product) {
            return {
                found: false,
                message: `No encontré el producto "${productQuery}"`
            };
        }

        const warranty = await this.productService.getWarrantyInfo(product.id);

        return {
            found: true,
            product: product.name,
            warranty: warranty,
            message: `Garantía de ${product.name}: ${warranty.duration} - ${warranty.type}`
        };
    }

    // Métodos placeholder para las otras funcionalidades
    async getCustomerOrderHistory(customerId: string) {
        return {
            totalOrders: 0,
            totalSpent: 0,
            recentOrders: [],
            favoriteCategory: 'Sin compras',
            message: 'Funcionalidad en desarrollo'
        };
    }

    async getPaymentMethodsInfo() {
        return {
            methods: [
                {
                    type: 'credit_card',
                    name: 'Tarjeta de Crédito',
                    description: 'Visa, MasterCard, American Express'
                }
            ],
            message: 'Funcionalidad en desarrollo'
        };
    }
}

/*import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { OrderService } from '../order/order.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class ChatService {
    constructor(
        private productService: ProductService,
        private orderService: OrderService,
        private paymentService: PaymentService
    ) {}

    async checkProductAvailability(productQuery: string, customerId: string) {
        const product = await this.productService.findByQuery(productQuery);
    
        if (!product) {
        return {
            available: false,
            message: `No encontré el producto "${productQuery}"`
        };
        }

        const stockInfo = await this.productService.getStockInfo(product.id);
        const recommendations = await this.productService.getRecommendations(product.id, customerId);

        return {
            available: stockInfo.quantity > 0,
            product: {
                name: product.name,
                price: product.price,
                image: product.image,
                sku: product.sku
            },
            stock: stockInfo,
            message: stockInfo.quantity > 0 
                ? ` ${product.name} está disponible. Stock: ${stockInfo.quantity} unidades. Precio: $${product.price}`
                : ` ${product.name} está agotado. Te avisaremos cuando esté disponible.`,
            recommendations: recommendations.slice(0, 3)
        };
    }

    async compareProducts(productQueries: string[]) {
        const products = await Promise.all(
            productQueries.map(query => this.productService.findByQuery(query))
        );

        const validProducts = products.filter(p => p !== null);
    
        if (validProducts.length < 2) {
            return {
                success: false,
                message: 'Necesita al menos 2 productos válidos para comparar'
            };
        }

        const comparison = validProducts.map(product => ({
            name: product.name,
            price: product.price,
            rating: product.rating,
            features: product.features,
            warranty: product.warranty,
            stock: product.stock,
            image: product.image
        }));

        return {
            success: true,
            products: comparison,
            message: `He comparado ${validProducts.length} productos:`
        };
    }

    async getCustomerOrderHistory(customerId: string) {
        const orders = await this.orderService.findByCustomer(customerId);
    
        return {
            totalOrders: orders.length,
            totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
            recentOrders: orders.slice(0, 5).map(order => ({
                id: order.id,
                date: order.date,
                total: order.total,
                status: order.status,
                items: order.items.length
            })),
            favoriteCategory: this.calculateFavoriteCategory(orders)
        };
    }*/

    /*async getPaymentMethodsInfo() {
        const methods = await this.paymentService.getAvailableMethods();
        const installmentInfo = await this.paymentService.getInstallmentOptions();

        return {
            methods: methods.map(method => ({
                type: method.type,
                name: method.name,
                description: method.description,
                fees: method.fees,
                limits: method.limits
            })),
            installments: installmentInfo,
            securityInfo: {
                encrypted: true,
                fraudProtection: true,
                moneyBackGuarantee: true
            }
        };
    }

    async getWarrantyInfo(productQuery: string) {
        const product = await this.productService.findByQuery(productQuery);
    
        if (!product) {
        return {
            found: false,
            message: `No encontré el producto "${productQuery}"`
        };
        }

        const warranty = await this.productService.getWarrantyInfo(product.id);

        return {
            found: true,
            product: product.name,
            warranty: {
                duration: warranty.duration,
                type: warranty.type,
                coverage: warranty.coverage,
                conditions: warranty.conditions,
                contact: warranty.contactSupport
            },
            message: `Garantía de ${product.name}: ${warranty.duration} - ${warranty.type}`
        };
    }

    private calculateFavoriteCategory(orders: any[]): string {
        // Lógica para calcular categoría favorita
        const categoryCount = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
            });
        });
    
        return Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b
        );
    }
}*/