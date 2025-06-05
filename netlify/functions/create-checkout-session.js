const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'BatchConvert Pro - Unlimited Lifetime Access',
                            description: 'Unlimited file conversions, forever.',
                            // You can add images here too:
                            // images: ['your_product_image_url_here.png']
                        },
                        unit_amount: 1299, // Price in cents ($12.99)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Important: These URLs will be prefixed with your Netlify site's domain.
            // Make sure you create success.html and cancel.html pages later.
            success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/cancel.html`,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id }),
        };
    } catch (error) {
        console.error("Error creating Stripe session:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};