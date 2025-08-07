// MongoDB initialization script
db = db.getSiblingDB('ecommerce_chatbot');

// Create collections
db.createCollection('products');
db.createCollection('orders');
db.createCollection('conversations');

// Insert sample products
db.products.insertMany([
    {
        productId: "P001",
        name: "Classic T-Shirt",
        category: "T-Shirts",
        price: 29.99,
        stock: 150,
        salesCount: 245,
        description: "Comfortable cotton t-shirt"
    },
    {
        productId: "P002",
        name: "Denim Jeans",
        category: "Jeans",
        price: 79.99,
        stock: 85,
        salesCount: 189,
        description: "Premium denim jeans"
    },
    {
        productId: "P003",
        name: "Summer Dress",
        category: "Dresses",
        price: 59.99,
        stock: 42,
        salesCount: 156,
        description: "Lightweight summer dress"
    },
    {
        productId: "P004",
        name: "Polo Shirt",
        category: "Shirts",
        price: 45.99,
        stock: 78,
        salesCount: 134,
        description: "Cotton polo shirt"
    },
    {
        productId: "P005",
        name: "Hoodie",
        category: "Hoodies",
        price: 69.99,
        stock: 92,
        salesCount: 298,
        description: "Warm cotton hoodie"
    }
]);

// Insert sample orders
db.orders.insertMany([
    {
        orderId: "12345",
        customerId: "C001",
        customerName: "John Doe",
        products: [
            {productId: "P001", quantity: 2, price: 29.99},
            {productId: "P003", quantity: 1, price: 59.99}
        ],
        totalAmount: 119.97,
        status: "delivered",
        orderDate: new Date("2024-01-15T10:30:00Z"),
        deliveryDate: new Date("2024-01-18T14:20:00Z")
    },
    {
        orderId: "12346",
        customerId: "C002",
        customerName: "Jane Smith",
        products: [
            {productId: "P002", quantity: 1, price: 79.99}
        ],
        totalAmount: 79.99,
        status: "shipped",
        orderDate: new Date("2024-01-20T09:15:00Z"),
        estimatedDelivery: new Date("2024-01-23T16:00:00Z")
    }
]);

print("Database initialized successfully!");
