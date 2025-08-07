const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const Product = require('../models/Product');
const Order = require('../models/Order');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for data loading');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const loadProductsFromCSV = async () => {
    try {
        const products = [];
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(path.join(__dirname, '../../data/products.csv'))
                .pipe(csv())
                .on('data', (row) => {
                    products.push({
                        productId: row.product_id || row.id,
                        name: row.product_name || row.name,
                        category: row.category,
                        price: parseFloat(row.price) || 0,
                        stock: parseInt(row.stock) || 0,
                        salesCount: parseInt(row.sales_count) || 0,
                        description: row.description || ''
                    });
                })
                .on('end', async () => {
                    await Product.deleteMany({});
                    await Product.insertMany(products);
                    console.log(`✅ Loaded ${products.length} products from CSV`);
                    resolve();
                })
                .on('error', reject);
        });
    } catch (error) {
        console.error('Error loading products from CSV:', error);
    }
};

const loadOrdersFromCSV = async () => {
    try {
        const orders = [];
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(path.join(__dirname, '../../data/orders.csv'))
                .pipe(csv())
                .on('data', (row) => {
                    orders.push({
                        orderId: row.order_id,
                        customerId: row.customer_id,
                        customerName: row.customer_name,
                        products: JSON.parse(row.products || '[]'),
                        totalAmount: parseFloat(row.total_amount) || 0,
                        status: row.status,
                        orderDate: new Date(row.order_date),
                        deliveryDate: row.delivery_date ? new Date(row.delivery_date) : null,
                        estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : null
                    });
                })
                .on('end', async () => {
                    await Order.deleteMany({});
                    await Order.insertMany(orders);
                    console.log(`✅ Loaded ${orders.length} orders from CSV`);
                    resolve();
                })
                .on('error', reject);
        });
    } catch (error) {
        console.error('Error loading orders from CSV:', error);
    }
};

const loadData = async () => {
    await connectDB();
    await loadProductsFromCSV();
    await loadOrdersFromCSV();
    console.log('✅ Real dataset loading completed!');
    process.exit(0);
};

if (require.main === module) {
    loadData();
}

module.exports = { loadProductsFromCSV, loadOrdersFromCSV };