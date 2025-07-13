
# ===================== IMPORTS =====================
import re
from typing import Any
from uagents import Agent, Context, Model, Protocol
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4
import logging
import openai
import requests
import os
from dotenv import load_dotenv

# ===================== CHARGEMENT ENV ET OPENAI =====================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("La variable d'environnement OPENAI_API_KEY n'est pas définie. Ajoutez-la dans .env ou exportez-la avant de lancer le script.")
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# ===================== UTILS API FOOT =====================
def fetch_team_statistics(competitor_id: str, season_id: str) -> dict:
    url = f"https://chillguys.vercel.app/competitors/{competitor_id}/seasons/{season_id}/statistics"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Erreur API: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def fetch_team_id_by_name(team_name: str) -> str | None:
    """
    Recherche l'id d'une équipe à partir de son nom, short_name ou abbreviation via l'API interne.
    Recherche robuste : stricte puis partielle, debug print noms trouvés.
    """
    import urllib.parse
    url = "https://chillguys.vercel.app/competitors"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            print(f"Erreur lors de la récupération des compétiteurs : {resp.status_code}")
            return None
        data = resp.json()
        competitors = data.get("data", [])
        # Debug print des noms trouvés
        print("fetch_team_id_by_name: Noms disponibles :")
        for c in competitors:
            print(f" - name='{c.get('name')}', short_name='{c.get('short_name')}', abbreviation='{c.get('abbreviation')}'")
        # Recherche stricte sur name, short_name, abbreviation (insensible à la casse)
        for c in competitors:
            if c.get("name", "").lower() == team_name.lower():
                return str(c["id"])
        for c in competitors:
            if c.get("short_name", "").lower() == team_name.lower():
                return str(c["id"])
        for c in competitors:
            if c.get("abbreviation", "").lower() == team_name.lower():
                return str(c["id"])
        # Recherche partielle : team_name inclus dans name ou short_name
        for c in competitors:
            if team_name.lower() in c.get("name", "").lower() or team_name.lower() in c.get("short_name", "").lower():
                return str(c["id"])
        return None
    except Exception as e:
        print(f"Erreur fetch_team_id_by_name: {e}")
        return None

def fetch_upcoming_matches(season_id: str) -> dict:
    url = f"https://chillguys.vercel.app/seasons/{season_id}/upcoming-matches"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Erreur API: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def fetch_season_id_by_team_id(team_id: str) -> str | None:
    url = f"https://chillguys.vercel.app/competitors?id={team_id}&include_season=true"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            if competitors and competitors[0].get("season"):
                return str(competitors[0]["season"]["special_id"])
        return None
    except Exception:
        return None

def fetch_season_id_by_team_and_year(team_id: str, year: str) -> str | None:
    url = f"https://chillguys.vercel.app/competitors?id={team_id}&include_season=true"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            if competitors and competitors[0].get("season"):
                season = competitors[0]["season"]
                if str(season.get("year")) == str(year):
                    return str(season["special_id"])
        url2 = f"https://chillguys.vercel.app/seasons?year={year}&include_competitors=true"
        resp2 = requests.get(url2, timeout=10)
        if resp2.status_code == 200:
            data2 = resp2.json()
            for season in data2.get("data", []):
                for comp in season.get("competitors", []):
                    if str(comp.get("id")) == str(team_id):
                        return str(season["special_id"])
        return None
    except Exception:
        return None

def fetch_team_id_by_name(team_name: str) -> str | None:
    import urllib.parse
    url = f"https://chillguys.vercel.app/competitors?name={urllib.parse.quote(team_name)}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            for c in competitors:
                if c.get("name", "").lower() == team_name.lower():
                    return str(c["id"])
            url2 = f"https://chillguys.vercel.app/competitors?short_name={urllib.parse.quote(team_name)}"
            resp2 = requests.get(url2, timeout=10)
            if resp2.status_code == 200:
                data2 = resp2.json()
                competitors2 = data2.get("data", [])
                for c in competitors2:
                    if c.get("short_name", "").lower() == team_name.lower():
                        return str(c["id"])
            url3 = f"https://chillguys.vercel.app/competitors?abbreviation={urllib.parse.quote(team_name)}"
            resp3 = requests.get(url3, timeout=10)
            if resp3.status_code == 200:
                data3 = resp3.json()
                competitors3 = data3.get("data", [])
                for c in competitors3:
                    if c.get("abbreviation", "").lower() == team_name.lower():
                        return str(c["id"])
            for c in competitors:
                if team_name.lower() in c.get("name", "").lower() or team_name.lower() in c.get("short_name", "").lower():
                    return str(c["id"])
        return None
    except Exception:
        return None

def fetch_upcoming_matches(season_id: str) -> dict:
    url = f"https://chillguys.vercel.app/seasons/{season_id}/upcoming-matches"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Erreur API: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def fetch_season_id_by_team_id(team_id: str) -> str | None:
    url = f"https://chillguys.vercel.app/competitors?id={team_id}&include_season=true"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            if competitors and competitors[0].get("season"):
                return str(competitors[0]["season"]["special_id"])
        return None
    except Exception:
        return None

def fetch_season_id_by_team_and_year(team_id: str, year: str) -> str | None:
    url = f"https://chillguys.vercel.app/competitors?id={team_id}&include_season=true"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            if competitors and competitors[0].get("season"):
                season = competitors[0]["season"]
                if str(season.get("year")) == str(year):
                    return str(season["special_id"])
        url2 = f"https://chillguys.vercel.app/seasons?year={year}&include_competitors=true"
        resp2 = requests.get(url2, timeout=10)
        if resp2.status_code == 200:
            data2 = resp2.json()
            for season in data2.get("data", []):
                for comp in season.get("competitors", []):
                    if str(comp.get("id")) == str(team_id):
                        return str(season["special_id"])
        return None
    except Exception:
        return None

# ===================== LOGIQUE CHATBOT =====================
def generate_direct_response(text: str) -> str:
    lower = text.lower()
    # Stats récentes/actuelles d'une équipe (ex: 'stats les plus récentes du PSG', 'stats actuelles OM')
    m_recent = re.search(r"stat[s]? (?:les plus récentes|actuelle[s]?|du moment|derni[eè]re[s]?) (?:du|de|d'|de l'|de la|des)?\s*([\w\d\s'-]+)", lower)
    if m_recent:
        team_part = m_recent.group(1).strip(" -'")
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        url = f"https://chillguys.vercel.app/competitors?id={competitor_id}&include_season=true"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                competitors = data.get("data", [])
                if competitors and competitors[0].get("season"):
                    season = competitors[0]["season"]
                    season_id = str(season["special_id"])
                    year = season.get("year")
                    data_stats = fetch_team_statistics(competitor_id, season_id)
                    if "error" in data_stats:
                        return f"Erreur lors de la récupération des stats: {data_stats['error']}"
                    stats = data_stats.get("competitor", {}).get("statistics", [])
                    if not stats:
                        return f"Aucune statistique trouvée pour {team_part} (saison {year})."
                    lines = [f"Statistiques les plus récentes pour l'équipe {team_part} (saison {year}):"]
                    for stat in stats:
                        lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
                    return "\n".join(lines)
        except Exception:
            return f"Impossible de récupérer la saison la plus récente pour l'équipe '{team_part}'."
        return f"Impossible de trouver la saison la plus récente pour l'équipe '{team_part}'."
    # Stats équipe + saison (ex: 'stats du PSG saison 3')
    m = re.search(r"stat[s]?\s*(?:du|de|d'|de l'|de la|de les|des)?\s*([\w\d\s'-]+?)\s*(?:équipe)?\s*saison\s*(\d+)", lower)
    if m:
        team_part, season_id = m.group(1).strip(), m.group(2)
        team_part = team_part.strip(" -'")
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        data = fetch_team_statistics(competitor_id, season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des stats: {data['error']}"
        stats = data.get("competitor", {}).get("statistics", [])
        if not stats:
            return "Aucune statistique trouvée pour cette équipe/saison."
        lines = [f"Statistiques principales pour l'équipe {team_part} (saison {season_id}):"]
        for stat in stats:
            lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
        return "\n".join(lines)
    # Stats équipe + année (ex: 'stats du PSG en 2025')
    m_year = re.search(r"stat[s]?\s*(?:du|de|d'|de l'|de la|de les|des)?\s*([\w\d\s'-]+?)\s*(?:équipe)?\s*(?:en|pour|année|an)\s*(\d{4})", lower)
    if m_year:
        team_part, year = m_year.group(1).strip(), m_year.group(2)
        team_part = team_part.strip(" -'")
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        season_id = fetch_season_id_by_team_and_year(competitor_id, year)
        if not season_id:
            return f"Impossible de trouver la saison {year} pour l'équipe '{team_part}'."
        data = fetch_team_statistics(competitor_id, season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des stats: {data['error']}"
        stats = data.get("competitor", {}).get("statistics", [])
        if not stats:
            return f"Aucune statistique trouvée pour {team_part} en {year}."
        lines = [f"Statistiques principales pour l'équipe {team_part} en {year}:"]
        for stat in stats:
            lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
        return "\n".join(lines)
    # Ancienne syntaxe : "stats équipe PSG saison 3"
    m2 = re.search(r"équipe\s*([\w\d\s]+).*saison\s*(\d+)", lower)
    if m2:
        team_part, season_id = m2.group(1).strip(), m2.group(2)
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        data = fetch_team_statistics(competitor_id, season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des stats: {data['error']}"
        stats = data.get("competitor", {}).get("statistics", [])
        if not stats:
            return "Aucune statistique trouvée pour cette équipe/saison."
        lines = [f"Statistiques principales pour l'équipe {team_part} (saison {season_id}):"]
        for stat in stats:
            lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
        return "\n".join(lines)
    # Prochain match d'une équipe (ex: "prochain match du PSG", "prochain match marseille", etc.)
    m3 = re.search(r"prochain match (?:du|de|d'|de l'|de la|des)?\s*([\w\d\s'-]+)", lower)
    if m3:
        team_part = m3.group(1).strip(" -'")
        competitor_id = fetch_team_id_by_name(team_part)
        if not competitor_id:
            return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        season_id = fetch_season_id_by_team_id(competitor_id)
        if not season_id:
            return f"Impossible de trouver la saison pour l'équipe '{team_part}'."
        data = fetch_upcoming_matches(season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des matchs: {data['error']}"
        matches = data.get("upcomingMatches", [])
        team_name_official = None
        try:
            url = f"https://chillguys.vercel.app/competitors?id={competitor_id}"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data_team = resp.json()
                competitors = data_team.get("data", [])
                if competitors:
                    team_name_official = competitors[0].get("name")
        except Exception:
            pass
        if not team_name_official:
            team_name_official = team_part
        filtered = [m for m in matches if str(m.get('home_team')) == team_name_official or str(m.get('away_team')) == team_name_official]
        if not filtered:
            for m in matches:
                if (m.get('home_competitor', {}).get('id') == int(competitor_id)) or (m.get('away_competitor', {}).get('id') == int(competitor_id)):
                    filtered.append(m)
        if not filtered:
            return f"Aucun match à venir trouvé pour {team_name_official}."
        match = filtered[0]
        return f"Prochain match de {team_name_official}: {match['home_team']} vs {match['away_team']} le {match['start_time']}"
    elif ("prochain" in lower or "à venir" in lower or "upcoming" in lower) and "match" in lower and "saison" in lower:
        m = re.search(r"saison\s*(\d+)", lower)
        if m:
            season_id = m.group(1)
            data = fetch_upcoming_matches(season_id)
            if "error" in data:
                return f"Erreur lors de la récupération des matchs: {data['error']}"
            matches = data.get("upcomingMatches", [])
            if not matches:
                return "Aucun match à venir trouvé pour cette saison."
            lines = [f"Matchs à venir pour la saison {season_id}:"]
            for match in matches[:5]:
                lines.append(f"- {match['home_team']} vs {match['away_team']} le {match['start_time']}")
            return "\n".join(lines)
        else:
            return "Merci de préciser la saison (ex: 'prochains matchs saison 5')."
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant specialized in crypto and finance. You can also answer about football teams, their statistics and upcoming matches if the user asks."},
                {"role": "user", "content": text}
            ],
            max_tokens=1000,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Erreur lors de l'appel à ChatGPT: {e}"

# ===================== AGENT & HANDLERS =====================
# Modèles de base pour la communication
class TextPrompt(Model):
    text: str

class StructuredOutputPrompt(Model):
    prompt: str
    output_schema: dict[str, Any]

class StructuredOutputResponse(Model):
    output: dict[str, Any]

AI_AGENT_ADDRESS = None  # Désactivé temporairement pour diagnostiquer
pending_chats = {}

chat_agent = Agent(
    name="intellect_chat",
    port=8010,
    seed="bigboy-chat-agent-matth-phrase",
    mailbox=True,
)

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

if CHAT_PROTOCOL_AVAILABLE:
    chat_protocol = Protocol(spec=chat_protocol_spec)
else:
    chat_protocol = Protocol("ASI_ONE_Chat")

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
    return

# Handler pour la réponse structurée de Claude (maintenant sur chat_agent)
@chat_agent.on_message(StructuredOutputResponse)
async def handle_structured_response(ctx: Context, sender: str, msg: StructuredOutputResponse):
    ctx.logger.info(f"📥 Réponse Claude AI reçue de ...{sender[-8:]}: {msg.output}")
    response_text = msg.output.get("response", "Désolé, je n'ai pas compris la réponse de l'IA.")
    conversation_id = msg.output.get("conversation_id")
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

chat_agent.include(chat_protocol)

@chat_agent.on_event("startup")
async def startup_event(ctx: Context):
    ctx.logger.info("🚀 Agent de chat IntentFi démarré!")
    ctx.logger.info(f"🎯 Adresse de l'agent: {ctx.agent.address}")
    ctx.logger.info(f"🌐 Port: 8010")
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

def fetch_team_statistics(competitor_id: str, season_id: str) -> dict:
    """Appelle l'API interne pour récupérer les stats d'une équipe pour une saison."""
    url = f"https://chillguys.vercel.app/competitors/{competitor_id}/seasons/{season_id}/statistics"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Erreur API: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def fetch_team_id_by_name(team_name: str) -> str | None:
    """Recherche l'id d'une équipe à partir de son nom, short_name ou abbreviation via l'API interne."""
    import urllib.parse
    # Essaye d'abord sur le nom
    url = f"https://chillguys.vercel.app/competitors?name={urllib.parse.quote(team_name)}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            # Recherche stricte (nom exact, insensible à la casse)
            for c in competitors:
                if c.get("name", "").lower() == team_name.lower():
                    return str(c["id"])
            # Recherche sur short_name
            url2 = f"https://chillguys.vercel.app/competitors?short_name={urllib.parse.quote(team_name)}"
            resp2 = requests.get(url2, timeout=10)
            if resp2.status_code == 200:
                data2 = resp2.json()
                competitors2 = data2.get("data", [])
                for c in competitors2:
                    if c.get("short_name", "").lower() == team_name.lower():
                        return str(c["id"])
            # Recherche sur abbreviation
            url3 = f"https://chillguys.vercel.app/competitors?abbreviation={urllib.parse.quote(team_name)}"
            resp3 = requests.get(url3, timeout=10)
            if resp3.status_code == 200:
                data3 = resp3.json()
                competitors3 = data3.get("data", [])
                for c in competitors3:
                    if c.get("abbreviation", "").lower() == team_name.lower():
                        return str(c["id"])
            # Si rien trouvé, tente une correspondance partielle (nom ou short_name contient le terme)
            for c in competitors:
                if team_name.lower() in c.get("name", "").lower() or team_name.lower() in c.get("short_name", "").lower():
                    return str(c["id"])
        return None
    except Exception:
        return None

def fetch_upcoming_matches(season_id: str) -> dict:
    """Appelle l'API interne pour récupérer les prochains matchs d'une saison."""
    url = f"https://chillguys.vercel.app/seasons/{season_id}/upcoming-matches"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Erreur API: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def fetch_season_id_by_team_id(team_id: str) -> str | None:
    """Récupère la saison courante (la plus récente) pour une équipe donnée."""
    url = f"https://chillguys.vercel.app/competitors?id={team_id}&include_season=true"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            competitors = data.get("data", [])
            if competitors and competitors[0].get("season"):
                return str(competitors[0]["season"]["special_id"])
        return None
    except Exception:
        return None

def generate_direct_response(text: str) -> str:
    """
    Génère une réponse directe, en priorisant les requêtes football (stats, prochain match) puis fallback GPT.
    """
    import re
    lower = text.lower()
    # Stats récentes/actuelles d'une équipe (ex: 'stats les plus récentes du PSG', 'stats actuelles OM')
    m_recent = re.search(r"stat[s]? (?:les plus récentes|actuelle[s]?|du moment|derni[eè]re[s]?) (?:du|de|d'|de l'|de la|des)?\s*([\w\d\s'-]+)", lower)
    if m_recent:
        team_part = m_recent.group(1).strip(" -'")
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        # On essaie de récupérer la saison la plus récente via /competitors?id=...&include_season=true
        url = f"https://chillguys.vercel.app/competitors?id={competitor_id}&include_season=true"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                competitors = data.get("data", [])
                if competitors and competitors[0].get("season"):
                    season = competitors[0]["season"]
                    season_id = str(season["special_id"])
                    year = season.get("year")
                    data_stats = fetch_team_statistics(competitor_id, season_id)
                    if "error" in data_stats:
                        return f"Erreur lors de la récupération des stats: {data_stats['error']}"
                    stats = data_stats.get("competitor", {}).get("statistics", [])
                    if not stats:
                        return f"Aucune statistique trouvée pour {team_part} (saison {year})."
                    lines = [f"Statistiques les plus récentes pour l'équipe {team_part} (saison {year}):"]
                    for stat in stats:
                        lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
                    return "\n".join(lines)
        except Exception:
            pass
        # Fallback: essayer de récupérer la saison la plus récente via /seasons?include_competitors=true
        try:
            seasons_resp = requests.get("https://chillguys.vercel.app/seasons?include_competitors=true", timeout=10)
            if seasons_resp.status_code == 200:
                seasons = seasons_resp.json().get("data", [])
                # Trie par année décroissante si possible
                seasons = sorted(seasons, key=lambda s: s.get("year", 0), reverse=True)
                for season in seasons:
                    for comp in season.get("competitors", []):
                        if str(comp.get("id")) == str(competitor_id):
                            season_id = str(season["special_id"])
                            year = season.get("year")
                            data_stats = fetch_team_statistics(competitor_id, season_id)
                            if "error" in data_stats:
                                return f"Erreur lors de la récupération des stats: {data_stats['error']}"
                            stats = data_stats.get("competitor", {}).get("statistics", [])
                            if not stats:
                                continue
                            lines = [f"Statistiques les plus récentes pour l'équipe {team_part} (saison {year}):"]
                            for stat in stats:
                                lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
                            return "\n".join(lines)
        except Exception as e:
            pass
        return f"Aucune statistique trouvée pour l'équipe '{team_part}'."

    # Stats équipe + saison (ex: 'stats du PSG saison 3')
    m = re.search(r"stat[s]?\s*(?:du|de|d'|de l'|de la|de les|des)?\s*([\w\d\s'-]+?)\s*(?:équipe)?\s*saison\s*(\d+)", lower)
    if m:
        team_part, season_id = m.group(1).strip(), m.group(2)
        team_part = team_part.strip(" -'")
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        data = fetch_team_statistics(competitor_id, season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des stats: {data['error']}"
        stats = data.get("competitor", {}).get("statistics", [])
        if not stats:
            return f"Aucune statistique trouvée pour {team_part} (saison {season_id})."
        lines = [f"Statistiques principales pour l'équipe {team_part} (saison {season_id}):"]
        for stat in stats:
            lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
        return "\n".join(lines)

    # Stats équipe + année (ex: 'stats du PSG en 2025')
    m_year = re.search(r"stat[s]?\s*(?:du|de|d'|de l'|de la|de les|des)?\s*([\w\d\s'-]+?)\s*(?:équipe)?\s*(?:en|pour|année|an)\s*(\d{4})", lower)
    if m_year:
        team_part, year = m_year.group(1).strip(), m_year.group(2)
        team_part = team_part.strip(" -'")
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        season_id = fetch_season_id_by_team_and_year(competitor_id, year)
        if not season_id:
            # Fallback: chercher la saison via /seasons?year=...&include_competitors=true
            try:
                url = f"https://chillguys.vercel.app/seasons?year={year}&include_competitors=true"
                resp = requests.get(url, timeout=10)
                if resp.status_code == 200:
                    seasons = resp.json().get("data", [])
                    for season in seasons:
                        for comp in season.get("competitors", []):
                            if str(comp.get("id")) == str(competitor_id):
                                season_id = str(season["special_id"])
                                break
                        if season_id:
                            break
            except Exception:
                pass
        if not season_id:
            return f"Impossible de trouver la saison {year} pour l'équipe '{team_part}'."
        data = fetch_team_statistics(competitor_id, season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des stats: {data['error']}"
        stats = data.get("competitor", {}).get("statistics", [])
        if not stats:
            return f"Aucune statistique trouvée pour {team_part} en {year}."
        lines = [f"Statistiques principales pour l'équipe {team_part} en {year}:"]
        for stat in stats:
            lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
        return "\n".join(lines)

    # Ancienne syntaxe : "stats équipe PSG saison 3"
    m2 = re.search(r"équipe\s*([\w\d\s]+).*saison\s*(\d+)", lower)
    if m2:
        team_part, season_id = m2.group(1).strip(), m2.group(2)
        if team_part.isdigit():
            competitor_id = team_part
        else:
            competitor_id = fetch_team_id_by_name(team_part)
            if not competitor_id:
                return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        data = fetch_team_statistics(competitor_id, season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des stats: {data['error']}"
        stats = data.get("competitor", {}).get("statistics", [])
        if not stats:
            return f"Aucune statistique trouvée pour {team_part} (saison {season_id})."
        lines = [f"Statistiques principales pour l'équipe {team_part} (saison {season_id}):"]
        for stat in stats:
            lines.append(f"- {stat.get('type', 'Type inconnu')}: {stat.get('value', 'N/A')}")
        return "\n".join(lines)

    # Prochain match d'une équipe ("prochain match du PSG", etc.)
    m3 = re.search(r"prochain match (?:du|de|d'|de l'|de la|des)?\s*([\w\d\s'-]+)", lower)
    if m3:
        team_part = m3.group(1).strip(" -'")
        competitor_id = fetch_team_id_by_name(team_part)
        if not competitor_id:
            return f"Impossible de trouver l'équipe '{team_part}'. Vérifie le nom."
        # On tente d'abord de trouver la saison via /competitors?id=...&include_season=true
        season_id = fetch_season_id_by_team_id(competitor_id)
        # Fallback: chercher la saison la plus récente via /seasons
        if not season_id:
            try:
                seasons_resp = requests.get("https://chillguys.vercel.app/seasons", timeout=10)
                if seasons_resp.status_code == 200:
                    seasons = seasons_resp.json().get("data", [])
                    # Trie par année décroissante
                    seasons = sorted(seasons, key=lambda s: s.get("year", 0), reverse=True)
                    for season in seasons:
                        for comp in season.get("competitors", []):
                            if str(comp.get("id")) == str(competitor_id):
                                season_id = str(season["special_id"])
                                break
                        if season_id:
                            break
            except Exception:
                pass
        if not season_id:
            return f"Impossible de trouver la saison pour l'équipe '{team_part}'."
        # Récupère les prochains matchs de la saison la plus récente
        data = fetch_upcoming_matches(season_id)
        if "error" in data:
            return f"Erreur lors de la récupération des matchs: {data['error']}"
        matches = data.get("upcomingMatches", [])
        # Recherche le vrai nom de l'équipe (pour l'affichage)
        team_name_official = None
        try:
            url = f"https://chillguys.vercel.app/competitors?id={competitor_id}"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data_team = resp.json()
                competitors = data_team.get("data", [])
                if competitors:
                    team_name_official = competitors[0].get("name")
        except Exception:
            pass
        if not team_name_official:
            team_name_official = team_part
        # Filtrer les matchs où l'équipe est home ou away (par id ou nom)
        filtered = []
        for m in matches:
            # Par nom officiel
            if str(m.get('home_team')) == team_name_official or str(m.get('away_team')) == team_name_official:
                filtered.append(m)
            # Par id dans home_competitor/away_competitor
            elif (m.get('home_competitor', {}).get('id') == int(competitor_id)) or (m.get('away_competitor', {}).get('id') == int(competitor_id)):
                filtered.append(m)
        if not filtered:
            return f"Aucun match à venir trouvé pour {team_name_official}."
        match = filtered[0]
        return f"Prochain match de {team_name_official}: {match.get('home_team','?')} vs {match.get('away_team','?')} le {match.get('start_time','?')}"

    # Ancienne syntaxe : prochains matchs saison X
    if ("prochain" in lower or "à venir" in lower or "upcoming" in lower) and "match" in lower and "saison" in lower:
        m = re.search(r"saison\s*(\d+)", lower)
        if m:
            season_id = m.group(1)
            data = fetch_upcoming_matches(season_id)
            if "error" in data:
                return f"Erreur lors de la récupération des matchs: {data['error']}"
            matches = data.get("upcomingMatches", [])
            if not matches:
                return "Aucun match à venir trouvé pour cette saison."
            lines = [f"Matchs à venir pour la saison {season_id}:"]
            for match in matches[:5]:
                lines.append(f"- {match.get('home_team','?')} vs {match.get('away_team','?')} le {match.get('start_time','?')}")
            return "\n".join(lines)
        else:
            return "Merci de préciser la saison (ex: 'prochains matchs saison 5')."

    # Sinon, fallback sur ChatGPT
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant specialized in crypto and finance. You can also answer about football teams, their statistics and upcoming matches if the user asks."},
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
