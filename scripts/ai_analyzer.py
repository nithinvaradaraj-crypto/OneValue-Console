#!/usr/bin/env python3
"""
AI Message Analyzer for OneValue Delivery Intelligence Console
Processes chat messages with Claude API to extract insights, blockers, sentiment, and action items.
"""

import os
import json
import time
from datetime import datetime
from typing import Optional
import urllib.request
import ssl

# Load environment variables
from pathlib import Path
env_file = Path(__file__).parent.parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

# Configuration
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE')
SUPABASE_ACCESS_TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN')

# SSL context for macOS
ssl_context = ssl.create_default_context()

def supabase_query(sql: str):
    """Execute SQL query via Supabase Management API"""
    payload = json.dumps({'query': sql})
    req = urllib.request.Request(
        f'https://api.supabase.com/v1/projects/osmdiezkqgfrhhsgtomo/database/query',
        data=payload.encode('utf-8'),
        headers={
            'Authorization': f'Bearer {SUPABASE_ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    with urllib.request.urlopen(req, context=ssl_context) as response:
        return json.loads(response.read().decode('utf-8'))


def call_claude(prompt: str, max_tokens: int = 2000) -> Optional[str]:
    """Call Claude API for message analysis"""
    payload = json.dumps({
        'model': 'claude-sonnet-4-20250514',
        'max_tokens': max_tokens,
        'messages': [{'role': 'user', 'content': prompt}]
    })

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=payload.encode('utf-8'),
        headers={
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['content'][0]['text']
    except Exception as e:
        print(f"Claude API error: {e}")
        return None


def analyze_messages_batch(messages: list) -> dict:
    """Analyze a batch of messages with Claude"""

    # Format messages for analysis
    messages_text = "\n\n".join([
        f"[{m.get('created_at', 'Unknown date')}] {m.get('title', 'No title')}\n{json.dumps(m.get('content_raw', {}))}"
        for m in messages[:10]  # Limit to 10 messages per batch
    ])

    prompt = f"""Analyze these project delivery chat messages and extract structured insights.

MESSAGES:
{messages_text}

Provide analysis in this exact JSON format:
{{
  "overall_sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": 0.0 to 1.0 (0=very negative, 0.5=neutral, 1=very positive),
  "blockers": ["list of identified blockers or risks"],
  "action_items": [
    {{"task": "description", "owner": "person name or null", "priority": "high" | "medium" | "low"}}
  ],
  "key_topics": ["main topics discussed"],
  "project_health_indicators": {{
    "positive_signals": ["list of positive indicators"],
    "warning_signs": ["list of concerns or issues"],
    "recommended_actions": ["suggested next steps"]
  }},
  "summary": "2-3 sentence summary of the conversation"
}}

Return ONLY valid JSON, no other text."""

    result = call_claude(prompt)

    if result:
        try:
            # Extract JSON from response
            json_start = result.find('{')
            json_end = result.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(result[json_start:json_end])
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")

    return None


def update_message_insights(message_id: str, insights: dict, sentiment: float):
    """Update a message with AI insights"""
    insights_json = json.dumps(insights).replace("'", "''")
    sql = f"""
    UPDATE delivery_intelligence
    SET ai_processed = true,
        ai_insights = '{insights_json}'::jsonb,
        sentiment_score = {sentiment},
        ai_processed_at = NOW()
    WHERE id = '{message_id}'
    """
    try:
        supabase_query(sql)
        return True
    except Exception as e:
        print(f"Update error: {e}")
        return False


def update_project_health(project_id: str, analysis: dict):
    """Update project health metrics based on AI analysis"""

    blockers = analysis.get('blockers', [])
    sentiment = analysis.get('sentiment_score', 0.5)
    warning_signs = analysis.get('project_health_indicators', {}).get('warning_signs', [])

    # Determine health status
    if len(blockers) >= 3 or sentiment < 0.3:
        health_status = 'Critical'
    elif len(blockers) >= 1 or sentiment < 0.5 or len(warning_signs) >= 2:
        health_status = 'At Risk'
    elif sentiment >= 0.6:
        health_status = 'Healthy'
    else:
        health_status = 'Unknown'

    summary = analysis.get('summary', '')
    summary_escaped = summary.replace("'", "''")

    sql = f"""
    UPDATE project_health_metrics
    SET overall_health = '{health_status}',
        ai_summary = '{summary_escaped}',
        blocker_count = {len(blockers)},
        metric_date = NOW()
    WHERE project_id = '{project_id}'
    """

    try:
        supabase_query(sql)
        print(f"  Updated health: {health_status}")
        return True
    except Exception as e:
        print(f"Health update error: {e}")
        return False


def process_project(project_id: str, project_name: str):
    """Process all unprocessed messages for a project"""

    print(f"\n{'='*50}")
    print(f"Processing: {project_name}")
    print(f"{'='*50}")

    # Get unprocessed messages
    sql = f"""
    SELECT id, title, content_raw, created_at, event_type
    FROM delivery_intelligence
    WHERE project_id = '{project_id}'
    AND (ai_processed IS NULL OR ai_processed = false)
    ORDER BY created_at DESC
    LIMIT 20
    """

    messages = supabase_query(sql)

    if not messages:
        print("  No unprocessed messages")
        return

    print(f"  Found {len(messages)} unprocessed messages")

    # Analyze in batches
    batch_size = 10
    all_blockers = []
    all_sentiment_scores = []

    for i in range(0, len(messages), batch_size):
        batch = messages[i:i+batch_size]
        print(f"  Analyzing batch {i//batch_size + 1}...")

        analysis = analyze_messages_batch(batch)

        if analysis:
            sentiment = analysis.get('sentiment_score', 0.5)
            all_sentiment_scores.append(sentiment)
            all_blockers.extend(analysis.get('blockers', []))

            # Update each message in batch
            for msg in batch:
                update_message_insights(
                    msg['id'],
                    {
                        'summary': analysis.get('summary'),
                        'key_topics': analysis.get('key_topics', []),
                        'sentiment': analysis.get('overall_sentiment')
                    },
                    sentiment
                )

            print(f"    Sentiment: {analysis.get('overall_sentiment')} ({sentiment:.2f})")
            print(f"    Blockers found: {len(analysis.get('blockers', []))}")

            # Rate limiting
            time.sleep(1)

    # Update project health with aggregated analysis
    if all_sentiment_scores:
        avg_sentiment = sum(all_sentiment_scores) / len(all_sentiment_scores)
        aggregated_analysis = {
            'sentiment_score': avg_sentiment,
            'blockers': list(set(all_blockers)),  # Dedupe
            'project_health_indicators': {
                'warning_signs': all_blockers[:5]  # Top 5 concerns
            },
            'summary': f"Analyzed {len(messages)} recent messages. Average sentiment: {avg_sentiment:.2f}"
        }
        update_project_health(project_id, aggregated_analysis)


def main():
    """Main entry point"""
    print("\n" + "="*60)
    print("  OneValue AI Message Analyzer")
    print("="*60)

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not found in .env")
        return

    # Get all projects with messages
    sql = """
    SELECT DISTINCT p.id, p.name
    FROM projects p
    JOIN delivery_intelligence d ON d.project_id = p.id
    WHERE d.ai_processed IS NULL OR d.ai_processed = false
    ORDER BY p.name
    """

    projects = supabase_query(sql)

    if not projects:
        print("\nNo projects with unprocessed messages found.")
        return

    print(f"\nFound {len(projects)} projects with unprocessed messages")

    for project in projects:
        process_project(project['id'], project['name'])

    print("\n" + "="*60)
    print("  Analysis Complete!")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
