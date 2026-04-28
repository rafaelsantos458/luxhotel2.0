import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Stripe initialization (Lazy)
  let stripe: Stripe | null = null;
  const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.");
      return null;
    }
    if (!stripe) {
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planId, planName, price, stripeProductId } = req.body;
      const stripeClient = getStripe();

      if (!stripeClient) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product: stripeProductId || undefined,
              product_data: stripeProductId ? undefined : {
                name: `Assinatura Hotel Management - ${planName}`,
              },
              unit_amount: Math.round(parseFloat(price.replace(",", ".")) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        ui_mode: 'embedded_page' as any,
        return_url: `${req.headers.origin}/register?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      });

      res.json({ id: session.id, url: session.url, clientSecret: session.client_secret });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
