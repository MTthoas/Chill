FROM python:3.12-slim

WORKDIR /app

COPY agent.py /app/

RUN pip install --upgrade pip && \
    pip install uagents

EXPOSE 8001

CMD ["python", "agent.py"]
