#!/usr/bin/env python3
"""
Interactive Claude chat in terminal.
Uses ANTHROPIC_API_KEY from environment.
"""

import os
import sys
from datetime import datetime
from anthropic import Anthropic

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.align import Align
    from rich.prompt import Prompt
    from rich.text import Text
except Exception:
    Console = None


def load_api_key():
    """Load API key from .env file or environment."""
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if line.strip().startswith("ANTHROPIC_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    if key:
                        return key

    return os.getenv("ANTHROPIC_API_KEY")


def render_user(console, message):
    panel = Panel(Text(message, style="bold white"), title="You", title_align="left", style="cyan")
    console.print(Align(panel, align="right"))


def render_assistant(console, message):
    panel = Panel(Text(message, style="white"), title="Claude", title_align="left", style="magenta")
    console.print(Align(panel, align="left"))


def main():
    api_key = load_api_key()
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY not found in .env or environment")
        sys.exit(1)

    client = Anthropic(api_key=api_key)
    conversation_history = []

    use_rich = Console is not None
    console = Console() if use_rich else None

    header = "🤖 Claude Terminal Chat"
    if use_rich:
        console.rule(header)
        console.print("Type 'quit' or 'exit' to close", style="dim")
    else:
        print("=" * 60)
        print(header)
        print("=" * 60)
        print("Type 'quit' or 'exit' to close\n")

    while True:
        try:
            if use_rich:
                user_input = Prompt.ask("[bold cyan]You[/]")
            else:
                user_input = input("You: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ["quit", "exit"]:
                if use_rich:
                    console.print("Goodbye! 👋", style="bold green")
                else:
                    print("\nGoodbye! 👋")
                break

            # Add user message to history
            conversation_history.append({"role": "user", "content": user_input})

            if use_rich:
                render_user(console, user_input)
            else:
                print(f"You: {user_input}")

            # Send to Claude
            if use_rich:
                console.print("[bold magenta]Claude is thinking...[/]", style="dim")

            response = client.messages.create(
                model="claude-3-5-sonnet-20241205",
                max_tokens=2048,
                system="You are Claude, a helpful AI assistant. Provide clear, concise, and helpful responses.",
                messages=conversation_history,
            )

            assistant_message = response.content[0].text

            # Render assistant message
            if use_rich:
                render_assistant(console, assistant_message)
            else:
                print(f"\nClaude: {assistant_message}\n")

            conversation_history.append({"role": "assistant", "content": assistant_message})

        except KeyboardInterrupt:
            if use_rich:
                console.print("\nGoodbye! 👋", style="bold green")
            else:
                print("\n\nGoodbye! 👋")
            break
        except Exception as e:
            if use_rich:
                console.print(f"[red]Error:[/] {e}")
            else:
                print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()
