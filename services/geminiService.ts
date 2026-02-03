import { GoogleGenAI } from "@google/genai";
import { AppState, ContactProperty } from "../types";

// Helper para obtener API Key de forma segura (Env o LocalStorage)
const getApiKey = (): string | null => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('GEMINI_API_KEY');
  }
  return null;
};

// Helper para construir el system prompt basado en el estado actual de la app
export const constructSystemPrompt = (state: AppState): string => {
  const { courses, prices, paymentLinks, professionsCatalog, professionRules, pipeline, faqs, config, countries, contactProperties } = state;

  // Helper para formatear reglas de profesión para la IA
  const formatProfessionRules = () => {
    return courses.map(course => {
      const rules = professionRules.filter(r => r.sku === course.sku && r.isAllowed);
      if (rules.length === 0) return `Curso ${course.name} (${course.sku}): No hay profesiones explícitamente permitidas (Por defecto: Permitir Todas o Consultar Admin).`;
      
      const allowedDetails = rules.map(r => {
        const profName = professionsCatalog.find(p => p.id === r.professionId)?.name || 'Desconocido';
        const certReq = r.requiresCertification ? '[Requiere Cert]' : '';
        const notes = r.notes ? `(Nota: ${r.notes})` : '';
        return `- ${profName} ${certReq} ${notes}`;
      }).join('\n');

      return `Curso: ${course.name} (${course.sku})\nPROFESIONES PERMITIDAS:\n${allowedDetails}`;
    }).join('\n\n');
  };

  return `
    Eres ${config.name}, un agente de ventas autónomo.
    Tono: ${config.tone}.
    Idioma: ESPAÑOL.
    
    CRÍTICO: NO tienes memoria propia a largo plazo. Debes usar estrictamente el CONTEXTO DE DATOS proporcionado abajo para responder.
    
    --- CONTEXTO DE DATOS ---
    
    1. INVENTARIO (Cursos):
    ${JSON.stringify(courses)}
    
    2. MATRIZ DE PRECIOS (Solo cotiza estos precios):
    * Verifica "isActive". 
    * Si existe "promoPrice" Y hoy está entre "promoStartDate" y "promoEndDate", usa ese precio y menciona el descuento.
    * De lo contrario usa "price".
    ${JSON.stringify(prices)}

    3. LINKS DE PAGO (Solo entrégalos al cerrar la venta):
    ${JSON.stringify(paymentLinks.filter(l => l.isActive))}
    
    4. PROFESIONES PERMITIDAS (Reglas de Acceso):
    * Haz cumplir ESTRICTAMENTE estas reglas. Si la profesión del usuario NO está en la lista permitida para un curso, NO PUEDES proceder con la venta.
    * Si una profesión requiere certificación, pregunta si la tienen antes de proceder.
    ${formatProfessionRules()}
    
    5. PIPELINE DE VENTAS (Sigue este flujo estrictamente):
    ${JSON.stringify(pipeline.map(p => `${p.order}. ${p.name}: "${p.scriptTemplate}" (Requiere Input: ${p.requiredInput || 'Ninguno'})`))}
    
    6. BASE DE CONOCIMIENTO FAQ:
    ${JSON.stringify(faqs)}
    
    7. PAÍSES SOPORTADOS (Catálogo Maestro de Mercados):
    * SOLO vende a estos países. Si el usuario es de otro lugar, discúlpate y di que no operamos allí todavía.
    * Usa el emoji "flag" cuando menciones el nombre del país.
    ${JSON.stringify(countries.filter(c => c.isActive))}
    
    8. DEFINICIONES DE CAMPOS DE DATOS (Reglas de Validación):
    * Cuando una Etapa del Pipeline requiera un input, DEBES validar la respuesta del usuario contra estas reglas ANTES de pasar a la siguiente etapa.
    * Si el input no coincide con la descripción o tipo, pide al usuario que lo corrija.
    ${JSON.stringify(contactProperties)}

    --- INSTRUCCIONES ---
    0. REGLA DE ORO: Solo haz UNA pregunta a la vez. Nunca abrumes al usuario con múltiples interrogantes en un solo mensaje. Espera su respuesta antes de avanzar.
    1. Determina en qué etapa del pipeline se encuentra probablemente el usuario.
    2. Si la etapa actual requiere un input específico (ver lista Pipeline), VALIDA el mensaje del usuario contra las "DEFINICIONES DE CAMPOS DE DATOS".
       - Ejemplo: Si la etapa requiere 'email', verifica si el mensaje contiene un email válido. Si no, pídelo de nuevo.
    3. Si el usuario pide Detalles del Curso, usa Descripción, Beneficios, Instructor y Duración.
    4. Si el usuario hace una pregunta específica presente en las FAQ, respóndela, luego intenta inmediatamente volver al flujo del pipeline.
    5. Si pide precio, PREGUNTA su país primero si no se conoce. Valida contra la lista de PAÍSES SOPORTADOS. Luego busca en la Matriz de Precios.
    6. CHEQUEO MÓDULO 4: Pregunta la profesión del usuario. Compara estrictamente contra "PROFESIONES PERMITIDAS" para el curso específico.
       - Si no permitido: Declina cortésmente y explica que no coincide con el perfil.
       - Si permitido pero requiere cert: Pide la certificación.
    7. Solo entrega un link de pago si el usuario ha aceptado el precio y está en la etapa de 'Cierre'. Coincide el link con el país del usuario.
    8. Mantén las respuestas concisas y en español.
  `;
};

export const sendMessageToGemini = async (
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  state: AppState
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Falta la API Key de Gemini");
    return "Error: No se ha configurado la API Key de Google Gemini. Por favor ve a Configuración (M7) e ingrésala.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const systemInstruction = constructSystemPrompt(state);

  const model = state.config.model || 'gemini-3-flash-preview';

  try {
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Temperatura baja para consistencia factual
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Error API Gemini:", error);
    return "Tengo problemas conectando con el cerebro. Por favor verifica la API Key en Ajustes o intenta de nuevo.";
  }
};

// Nueva función para extracción granular de datos
export const extractData = async (
  userMessage: string, 
  property: ContactProperty
): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `
      TAREA: Extraer datos específicos del texto del usuario basándose en la definición de la propiedad.
      
      ETIQUETA PROPIEDAD: "${property.label}"
      TIPO: ${property.type}
      DESCRIPCIÓN/REGLAS: ${property.description}
      
      TEXTO USUARIO: "${userMessage}"
      
      INSTRUCCIONES:
      1. Analiza el TEXTO USUARIO.
      2. Extrae el valor que mejor coincida con la definición de la PROPIEDAD.
      3. Devuelve SOLO el valor extraído como un string limpio. Sin comillas extra, sin explicaciones.
      4. Si el texto implica una opción específica (para tipos Select), mapealo a la opción más válida.
      5. Si la información NO está presente o es ambigua, devuelve exactamente "NULL".
      
      EJEMPLOS:
      - Texto: "Soy Juan", Propiedad: Nombre -> Output: Juan
      - Texto: "Hola quiero info", Propiedad: Email -> Output: NULL
      - Texto: "Soy ingeniero de software con 5 años de exp", Propiedad: Profesión -> Output: Ingeniero de Software
      - Texto: "Me interesa mucho aprender", Propiedad: Nivel Interés -> Output: Alto
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 0, // Máxima precisión
            }
        });
        const text = response.text?.trim();
        return (text === "NULL" || !text) ? null : text;
    } catch (e) {
        console.error("Error de extracción:", e);
        return null; 
    }
};