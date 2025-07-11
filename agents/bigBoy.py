from typing import Any
from uagents import Agent, Context, Model, Protocol
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4
import logging
import openai
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("La variable d'environnement OPENAI_API_KEY n'est pas définie. Ajoutez-la dans .env ou exportez-la avant de lancer le script.")

client = openai.OpenAI(api_key=OPENAI_API_KEY)


# Import du protocole de chat officiel Fetch.ai
try:
    from uagents_core.contrib.protocols.chat import (
        ChatMessage,
        ChatAcknowledgement,
        TextContent,
        chat_protocol_spec
    )
    CHAT_PROTOCOL_AVAILABLE = True
    print("✅ Protocole de chat officiel Fetch.ai chargé")
except ImportError:
    print("⚠️ Protocole de chat officiel non disponible, utilisation du protocole custom")
    CHAT_PROTOCOL_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modèles de base pour la communication
class TextPrompt(Model):
    text: str

class StructuredOutputPrompt(Model):
    prompt: str
    output_schema: dict[str, Any]

class StructuredOutputResponse(Model):
    output: dict[str, Any]

# Adresse de l'agent Claude AI sur Agentverse (temporairement désactivé pour tests)
AI_AGENT_ADDRESS = None  # Désactivé temporairement pour diagnostiquer

# Variables pour gérer les conversations en attente
pending_chats = {}

# Création de l'agent chat uniquement (pas de REST)
chat_agent = Agent(
    name="intellect_chat",
    port=8010,
    seed="bigboy-chat-agent-seed-phrase",
    mailbox=True,
)

# Protocole de chat uniquement
if CHAT_PROTOCOL_AVAILABLE:
    chat_protocol = Protocol(spec=chat_protocol_spec)
else:
    chat_protocol = Protocol("ASI_ONE_Chat")

# Handler principal pour le protocole de chat
@chat_protocol.on_message(model=ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"💬 Message reçu de {sender}")
    ctx.logger.info(f"🔍 Type de message: {type(msg)}")
    ctx.logger.info(f"🔍 Contenu brut: {msg}")
    
    text = ""
    try:
        if hasattr(msg, 'content') and msg.content:
            if isinstance(msg.content, list) and len(msg.content) > 0:
                if hasattr(msg.content[0], 'text'):
                    text = msg.content[0].text
                else:
                    text = str(msg.content[0])
            else:
                text = str(msg.content)
        ctx.logger.info(f"📝 Texte extrait: '{text}'")
    except Exception as e:
        ctx.logger.error(f"❌ Erreur extraction texte: {e}")
        text = "hello"  # Fallback
    
    # Toujours utiliser la réponse directe pour l'instant
    try:
        response_text = generate_direct_response(text)
        ctx.logger.info(f"🎯 Réponse générée: '{response_text[:100]}...'")
        
        if CHAT_PROTOCOL_AVAILABLE:
            chat_msg = ChatMessage(
                msg_id=str(uuid4()),
                timestamp=datetime.now(timezone.utc),
                content=[TextContent(type="text", text=response_text)]
            )
            await ctx.send(sender, chat_msg)
            ctx.logger.info(f"📤 Réponse envoyée avec succès à {sender}")
        else:
            await ctx.send(sender, response_text)
            ctx.logger.info(f"📤 Réponse custom envoyée à {sender}")
            
    except Exception as e:
        ctx.logger.error(f"❌ Erreur envoi réponse: {e}")
        # Réponse d'urgence ultra-simple
        try:
            simple_response = "🤖 IntentFi Agent connecté ! Erreur temporaire, mais je suis là."
            if CHAT_PROTOCOL_AVAILABLE:
                emergency_msg = ChatMessage(
                    msg_id=str(uuid4()),
                    timestamp=datetime.now(timezone.utc),
                    content=[TextContent(type="text", text=simple_response)]
                )
                await ctx.send(sender, emergency_msg)
            else:
                await ctx.send(sender, simple_response)
            ctx.logger.info("🚨 Réponse d'urgence envoyée")
        except Exception as e2:
            ctx.logger.error(f"💥 Échec complet envoi: {e2}")
            
    return  # Supprime le code Claude AI pour l'instant

def generate_direct_response(text: str) -> str:
    """Génère une réponse via ChatGPT (OpenAI v1.x)"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # ou "gpt-4"
            messages=[
                {"role": "system", "content": "You are a helpful assistant specialized in crypto and finance."},
                {"role": "user", "content": text}
            ],
            max_tokens=256,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Erreur lors de l'appel à ChatGPT: {e}"
    
# Handler pour la réponse structurée de Claude (maintenant sur chat_agent)
@chat_agent.on_message(StructuredOutputResponse)
async def handle_structured_response(ctx: Context, sender: str, msg: StructuredOutputResponse):
    ctx.logger.info(f"📥 Réponse Claude AI reçue de ...{sender[-8:]}: {msg.output}")
    
    response_text = msg.output.get("response", "Désolé, je n'ai pas compris la réponse de l'IA.")
    conversation_id = msg.output.get("conversation_id")
    
    # Trouver l'utilisateur original
    original_sender = None
    if conversation_id and conversation_id in pending_chats:
        original_sender = pending_chats[conversation_id]
        del pending_chats[conversation_id]
    
    if original_sender:
        if CHAT_PROTOCOL_AVAILABLE:
            chat_msg = ChatMessage(
                msg_id=str(uuid4()),
                timestamp=datetime.now(timezone.utc),
                content=[TextContent(type="text", text=response_text)]
            )
            await ctx.send(original_sender, chat_msg)
            ctx.logger.info(f"📤 Réponse envoyée à {original_sender}")
        else:
            await ctx.send(original_sender, response_text)
    else:
        ctx.logger.warning("⚠️ Impossible de trouver l'utilisateur original pour la réponse")

# Handler pour accusé de réception (obligatoire pour le protocole officiel)
if CHAT_PROTOCOL_AVAILABLE:
    @chat_protocol.on_message(model=ChatAcknowledgement)
    async def handle_chat_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
        ctx.logger.info(f"✅ Accusé de réception reçu de {sender} pour le message {msg.acknowledged_msg_id}")

# Inclusion du protocole de chat uniquement (sans publish_manifest)
chat_agent.include(chat_protocol)

@chat_agent.on_event("startup")
async def startup_event(ctx: Context):
    ctx.logger.info("🚀 Agent de chat IntentFi démarré!")
    ctx.logger.info(f"🎯 Adresse de l'agent: {ctx.agent.address}")
    ctx.logger.info(f"🌐 Port: 8010")  # Port fixe
    ctx.logger.info(f"🔗 Mailbox activée: True")
    
    if AI_AGENT_ADDRESS:
        ctx.logger.info(f"🧠 Communication avec Claude AI: {AI_AGENT_ADDRESS}")
    else:
        ctx.logger.info("🧠 Mode réponse directe activé (pas de Claude AI)")
        
    ctx.logger.info("💬 Prêt à recevoir des messages via le protocole de chat!")
    ctx.logger.info("✅ Testez en envoyant 'Hello' ou 'ETH' via Agentverse/ASI One")
    ctx.logger.info("=" * 80)
    ctx.logger.info("🔍 ADRESSE POUR AGENTVERSE:")
    ctx.logger.info(f"   {ctx.agent.address}")
    ctx.logger.info("=" * 80)

if __name__ == "__main__":
    chat_agent.run()
