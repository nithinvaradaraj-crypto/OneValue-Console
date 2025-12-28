#!/usr/bin/env python3
"""
Skill initialization script for OneValue multi-agent system
"""
import os
import sys
import argparse
from pathlib import Path

def create_skill_structure(skill_name: str, output_path: str):
    """Create a skill directory with proper structure"""
    skill_path = Path(output_path) / skill_name
    
    # Create directories
    (skill_path / 'scripts').mkdir(parents=True, exist_ok=True)
    (skill_path / 'references').mkdir(parents=True, exist_ok=True)
    (skill_path / 'assets').mkdir(parents=True, exist_ok=True)
    
    # Create SKILL.md template
    skill_md = f"""---
name: {skill_name}
description: TODO - Add comprehensive description of what this skill does and when to use it
---

# {skill_name.replace('-', ' ').title()}

## Overview

TODO: Describe the purpose and scope of this skill

## When to Use This Skill

TODO: Specify triggers and contexts for using this skill

## Workflow

TODO: Provide step-by-step instructions

## Best Practices

TODO: Add guidelines and recommendations

## Examples

TODO: Provide concrete examples
"""
    
    with open(skill_path / 'SKILL.md', 'w') as f:
        f.write(skill_md)
    
    # Create example script
    example_script = """#!/usr/bin/env python3
# Example script - replace with actual implementation

def main():
    print("Skill script executed")

if __name__ == '__main__':
    main()
"""
    
    with open(skill_path / 'scripts' / 'example.py', 'w') as f:
        f.write(example_script)
    
    # Make script executable
    os.chmod(skill_path / 'scripts' / 'example.py', 0o755)
    
    # Create example reference
    with open(skill_path / 'references' / 'example.md', 'w') as f:
        f.write("# Example Reference\n\nTODO: Add reference documentation\n")
    
    print(f"✓ Created skill structure at: {skill_path}")
    print(f"  - SKILL.md (TODO: Complete)")
    print(f"  - scripts/example.py")
    print(f"  - references/example.md")
    print(f"  - assets/ (empty)")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Initialize a new skill')
    parser.add_argument('skill_name', help='Name of the skill (e.g., onevalue-backend)')
    parser.add_argument('--path', default='.', help='Output directory')
    
    args = parser.parse_args()
    create_skill_structure(args.skill_name, args.path)
