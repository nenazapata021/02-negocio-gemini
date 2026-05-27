// Importar dependencias
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cargar configuracion (de api key)
dotenv.config({ path: "./.env" });

// Cargar express
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
    console.warn("Falta GEMINI_API_KEY en el archivo .env");
}

// Servir frontend
app.use("/front", express.static("public"));

// Middleware para procesar json
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Instancia de Gemini y pasar el api key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview", 
    systemInstruction: "Eres un asistente de soporte del supermercado El PicoEsquina. Responde de forma breve, clara y solo sobre la tienda."
});

// Ruta / endpoint / url
app.post("/api/chatbot", async(req, res) => {
    const context = `
       Eres un asistente de soporte para el supermercado "El PicoEsquina".
       Informacion del negocio:
         - Ubicacion: Calle de la Pantomina, numero 77, Madrid.
         - Horario: Lunes a Sabado de 8:00 a 21:00, Domingos de 9:00 a 18:00
         - Productos: Pan, Leche, Huevos, Frutas, Verduras, Carnes y bebidas
         - Marcas: Pascual, Kaiku, Central lechera asturiana, Fanta, Coca cola, pepsi.
         - Metodos de pago: Efectivo, tarjeta y bizum.
        Solo puedes responder sobre la tienda. Cualquier otra pregumnta esta prohibida.
    `;

    // Recibir pregunta del usuario
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: "Escribe una consulta para poder ayudarte." });
    }

    const prompt = `${context}\n\nPregunta del usuario: ${message}`;

    // Peticion al modelo de inteligencia artificial
    try {
        const respuesta = await model.generateContent(prompt);
        // Devolver respuesta
        const reply = respuesta.response.text().trim();

        if (!reply) {
            return res.status(500).json({ message: "No pude generar una respuesta en este momento. Intenta nuevamente." });
        }

        return res.status(200).json({ reply });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({
            message: "No pude responder tu consulta en este momento. Intenta nuevamente en unos segundos."
        });
    }
    
});
// Servir el backend
const server = app.listen(PORT, () => {
    console.log(`🚀Servidor en puerto ${PORT}`);
});

server.on("error", (error) => {
    if (error) {
        console.error(`El puerto ${PORT} ya está en uso. Cierra la instancia anterior o cambia la variable PORT.`);
        process.exit(1);
    }

    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
});