import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import Stripe from 'stripe';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// --- Przelewy24 Payment Integration ---

const P24_CONFIG = {
    merchantId: parseInt(process.env.P24_MERCHANT_ID || '0'),
    posId: parseInt(process.env.P24_POS_ID || '0'),
    crc: process.env.P24_CRC || '',
    apiKey: process.env.P24_API_KEY || '',
    baseUrl: process.env.P24_SANDBOX === 'true'
        ? 'https://sandbox.przelewy24.pl'
        : 'https://secure.przelewy24.pl'
};

// Diagnostic route
app.get('/api/test-p24', (req, res) => {
    res.json({ message: 'P24 Routes are active', config: { ...P24_CONFIG, crc: '***', apiKey: '***' } });
});

// Initiate P24 Transaction
app.post('/api/payments/p24/register', async (req, res) => {
    const { amount, description, email, clientName } = req.body;
    const sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountInGrosze = Math.round(parseFloat(amount) * 100);

    const signSource = `${sessionId}|${P24_CONFIG.merchantId}|${amountInGrosze}|PLN|${P24_CONFIG.crc}`;
    const sign = crypto.createHash('sha384').update(signSource).digest('hex');

    const payload = {
        merchantId: P24_CONFIG.merchantId,
        posId: P24_CONFIG.posId,
        sessionId,
        amount: amountInGrosze,
        currency: 'PLN',
        description,
        email,
        client: clientName,
        country: 'PL',
        language: 'pl',
        urlReturn: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session=${sessionId}`,
        urlStatus: `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/payments/p24/webhook`,
        sign
    };

    try {
        console.log('Registering P24 transaction:', sessionId);
        const mockToken = `p24_token_${sessionId}`;
        const paymentUrl = `${P24_CONFIG.baseUrl}/trnRequest/${mockToken}`;

        res.json({
            success: true,
            paymentUrl,
            token: mockToken,
            sessionId
        });
    } catch (error: any) {
        console.error('P24 Register Error:', error.message);
        res.status(500).json({ error: 'Błąd bramki płatności: ' + error.message });
    }
});

app.post('/api/payments/p24/webhook', (req, res) => {
    const { merchantId, posId, sessionId, amount, origin, sign } = req.body;
    const verifySource = `${merchantId}|${posId}|${sessionId}|${amount}|${origin}|${P24_CONFIG.crc}`;
    const calculatedSign = crypto.createHash('sha384').update(verifySource).digest('hex');

    if (sign === calculatedSign) {
        console.log('P24 Webhook Verified:', sessionId);
        res.status(200).send('OK');
    } else {
        res.status(400).send('Signature failure');
    }
});

// --- Stripe Payment Integration ---

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
if (!stripe) {
    console.warn('WARNING: STRIPE_SECRET_KEY is missing. Stripe payments will be disabled.');
}

app.post('/api/payments/stripe/create-checkout-session', async (req, res) => {
    const { amount, description, email, clientName, productId } = req.body;

    try {
        if (!stripe) {
            throw new Error('Stripe is not configured (missing secret key).');
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'blik', 'p24'],
            customer_email: email,
            line_items: [{
                price_data: {
                    currency: 'pln',
                    product_data: {
                        name: description,
                    },
                    unit_amount: Math.round(parseFloat(amount) * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`,
            metadata: {
                productId,
                clientName,
            },
        });

        res.json({ success: true, url: session.url });
    } catch (error: any) {
        console.error('Stripe Session Error:', error.message);
        res.status(500).json({ error: 'Błąd płatności Stripe: ' + error.message });
    }
});

// Stripe Webhook (Notifications)
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Stripe webhook error: Stripe or Webhook Secret not configured');
        return res.status(500).send('Webhook Secret not configured');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig!,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Stripe Payment Success for session:', session.id);
        // Add logic to send email with product here
    }

    res.json({ received: true });
});

// Database setup
const dbPath = join(__dirname, 'digitalsite.db');
const db = new sqlite3.Database(dbPath);

// Migrate: add booking_url column if not exists
db.run("ALTER TABLE services ADD COLUMN booking_url TEXT", () => { /* ignore if already exists */ });

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Email Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// API Routes

// Store Products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', upload.fields([{ name: 'image' }, { name: 'file' }]), (req: any, res) => {
    const { title, description, price, oldPrice, type, category, details } = req.body;
    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    const filePath = req.files && req.files['file'] ? `/uploads/${req.files['file'][0].filename}` : null;

    db.run(
        "INSERT INTO products (title, description, price, oldPrice, type, category, image_url, file_path, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, description, parseFloat(price), oldPrice ? parseFloat(oldPrice) : null, type, category, imageUrl, filePath, details],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/products/:id', upload.fields([{ name: 'image' }, { name: 'file' }]), (req: any, res) => {
    const { title, description, price, oldPrice, type, category, details } = req.body;
    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : undefined;
    const filePath = req.files && req.files['file'] ? `/uploads/${req.files['file'][0].filename}` : undefined;

    const fields: string[] = ['title=?', 'description=?', 'price=?', 'oldPrice=?', 'type=?', 'category=?', 'details=?'];
    const values: any[] = [title, description, parseFloat(price), oldPrice ? parseFloat(oldPrice) : null, type, category, details];

    if (imageUrl) { fields.push('image_url=?'); values.push(imageUrl); }
    if (filePath) { fields.push('file_path=?'); values.push(filePath); }
    values.push(req.params.id);

    db.run(`UPDATE products SET ${fields.join(', ')} WHERE id=?`, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Contact Form
app.post('/api/contact', async (req, res) => {
    console.log('Received contact request:', req.body);
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        console.error('Validation failed: Missing fields');
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store in DB
    db.run(
        "INSERT INTO submissions (name, email, subject, message) VALUES (?, ?, ?, ?)",
        [name, email, subject, message],
        async function (err) {
            if (err) {
                console.error('DB Insert Error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            console.log('Submission stored in DB with ID:', this.lastID);

            // Send Email
            try {
                console.log('Attempting to send email to:', process.env.ADMIN_EMAIL);
                await transporter.sendMail({
                    from: `"NextStep Kariera" <${process.env.EMAIL_USER}>`,
                    to: process.env.ADMIN_EMAIL,
                    subject: `Nowa wiadomość: ${subject || 'Brak tematu'}`,
                    html: `
            <h3>Nowa wiadomość od: ${name}</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Wiadomość:</strong></p>
            <p>${message}</p>
          `,
                });
                console.log('Email sent successfully');
                res.json({ success: true, id: this.lastID });
            } catch (mailErr: any) {
                console.error('Mail Transmission Error:', mailErr.message);
                res.status(500).json({ error: 'Failed to send email: ' + mailErr.message });
            }
        }
    );
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password && password === process.env.ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Nieprawidłowe hasło' });
    }
});

// Admin Submissions
app.get('/api/admin/submissions', (req, res) => {
    db.all("SELECT * FROM submissions ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Services Management
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services ORDER BY id ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/services', (req, res) => {
    const { title, duration, price, description, details, booking_url } = req.body;
    db.run(
        "INSERT INTO services (title, duration, price, description, details, booking_url) VALUES (?, ?, ?, ?, ?, ?)",
        [title, duration, price, description, details, booking_url || null],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/services/:id', (req, res) => {
    const { title, duration, price, description, details, booking_url } = req.body;
    db.run(
        "UPDATE services SET title=?, duration=?, price=?, description=?, details=?, booking_url=? WHERE id=?",
        [title, duration, price, description, details, booking_url || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/services/:id', (req, res) => {
    db.run("DELETE FROM services WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Serving the React frontend
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Catch-all route for React frontend (must be after API routes)
    app.use((req, res, next) => {
        // Skip API routes and static files
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
