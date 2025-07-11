from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
from datetime import datetime

# Adresse de Claude
AI_AGENT_ADDRESS = "agent1qvk7q2av3e2y5gf5s90nfzkc8a48q3wdqeevwrtgqfdl0k78rspd6f2l4dx"

# Modèles pour la communication avec Claude
class TextPrompt(Model):
    text: str

class TextResponse(Model):
    text: str

agent = Agent(
    name="claude_client",
    port=8001,
    seed="claude-client-seed-phrase",
    endpoint=["http://127.0.0.1:8001/submit"],  # endpoint pour Docker avec port mapping
    mailbox=True,
)

fund_agent_if_low(agent.wallet.address())

@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Agent démarré avec l'adresse : {agent.address}")
    ctx.logger.info("👋 Envoi d'un Hello à Claude...")
    try:
        prompt = TextPrompt(text="Hello Claude, ceci est un test de connectivité depuis un agent local uAgents !")
        await ctx.send(AI_AGENT_ADDRESS, prompt)
        ctx.logger.info("✅ Message envoyé à Claude !")
    except Exception as e:
        ctx.logger.error(f"❌ Erreur lors de l'envoi : {e}")

@agent.on_message(TextResponse)
async def handle_claude_response(ctx: Context, sender: str, msg: TextResponse):
    ctx.logger.info(f"📥 Réponse reçue de Claude ({sender}): {msg.text}")

@agent.on_message(TextPrompt)
async def handle_text_prompt(ctx: Context, sender: str, msg: TextPrompt):
    ctx.logger.info(f"📨 Message reçu de {sender}: {msg.text}")
    response = TextResponse(text=f"Echo: {msg.text}")
    await ctx.send(sender, response)
    ctx.logger.info(f"📤 Réponse envoyée à {sender}")

if __name__ == "__main__":
    agent.run()