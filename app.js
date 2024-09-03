import dotenv from "dotenv";
dotenv.config();

import express from "express";
import client from "./src/configs/wwebjs.js";
import Router from "./src/routes/routes.js";
import cors from "cors";
import MessageController from "./src/controllers/messageController.js";
import qrcode from "qrcode-terminal";
import { authUrl } from "./src/configs/calendarAuth.js";
import cron from "node-cron";
import InteractionUseCase from "./src/domain/useCases/interactionUseCase.js";

const app = express();

let qrCode;
// PORTA ONDE O SERVIÇO SERÁ INICIADO
const port = process.env.PORT || 8081;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/", Router);
app.get("/", (req, res) => {
  res.redirect(authUrl);
});
app.get("/qrcode", (req, res) => {
  try {
    if (qrCode) {
      res
        .status(200)
        .json({ message: "Conecte-se ao qrcode!", result: qrCode });
    } else {
      res.status(200).json({ message: "Conectado!", result: qrCode });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Gerar QR code
client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrCode = qr;
  qrcode.generate(qr, { small: true });
});

// Bot conectado
client.on("ready", async () => {
  console.log("Dispositivo pronto!");
  qrCode = undefined;
});

// Escuta mensagens recebidas
client.on("message", async (message) => {
  await MessageController.processMessage(message);
});

// Funções automáticas
cron.schedule("0 3 * * *", () => InteractionUseCase.cleanRepository());

// Inicie o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Inicializa o Bot
client.initialize();
