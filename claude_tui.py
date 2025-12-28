#!/usr/bin/env python3
"""
Terminal TUI for Claude using prompt_toolkit.
Controls:
 - Type into the input box (multi-line)
 - Press Ctrl-S to send
 - Press Ctrl-C to quit
"""
import os
import threading
from prompt_toolkit import Application
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.layout import HSplit, Layout
from prompt_toolkit.widgets import TextArea, Label, Frame
from prompt_toolkit.styles import Style
import sys

try:
    from anthropic import Anthropic
except Exception as e:
    print("Missing dependency 'anthropic' - install in venv. Exiting.")
    sys.exit(1)

ENV_FILE = "/Users/nithinvaradaraj/OneValue-Console/.env"

def load_api_key():
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            for line in f:
                if line.startswith("ANTHROPIC_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    if key:
                        return key
    return os.getenv("ANTHROPIC_API_KEY")

api_key = load_api_key()
if not api_key:
    print("ANTHROPIC_API_KEY not found in .env or environment. Exiting.")
    sys.exit(1)

client = Anthropic(api_key=api_key)
conversation_history = []

output = TextArea(style="class:output", text="Welcome to Claude Terminal!\n\n", scrollbar=True, wrap_lines=True, read_only=True)
input_box = TextArea(height=6, prompt="> ", multiline=True, wrap_lines=True)
label = Label("Type your message and press Ctrl-S to send. Ctrl-C to quit.")

kb = KeyBindings()

@kb.add('c-c')
def _(event):
    event.app.exit()

@kb.add('c-s')
def _(event):
    """Send input to Claude in background thread."""
    text = input_box.text.strip()
    if not text:
        return
    
    # Add to history
    conversation_history.append({"role": "user", "content": text})
    
    # Show user's message
    append_output("You", text)
    input_box.text = ""

    def worker(user_text):
        try:
            response = client.messages.create(
                model="claude-opus-4-1-20250805",
                max_tokens=2048,
                system="You are Claude, a helpful AI assistant. Provide clear, concise, and helpful responses.",
                messages=conversation_history
            )
            assistant_message = response.content[0].text
            
            # Add assistant response to history
            conversation_history.append({"role": "assistant", "content": assistant_message})
            
            # Show response
            append_output("Claude", assistant_message)
        except Exception as e:
            append_output("Error", str(e))

    threading.Thread(target=worker, args=(text,), daemon=True).start()

style = Style.from_dict({
    'output': 'bg:#1e1e1e #dcdcdc',
})

root_container = HSplit([
    Frame(output, title='Claude - Output'),
    Frame(input_box, title='Input (Ctrl-S to send)'),
    label,
])

app = Application(layout=Layout(root_container), key_bindings=kb, style=style, full_screen=True)

def append_output(title, text):
    box = f"\n{title}:\n{'-'*40}\n{text}\n"
    output.buffer.insert_text(box)

if __name__ == '__main__':
    try:
        app.run()
    except KeyboardInterrupt:
        pass
