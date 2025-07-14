#!/usr/bin/env python3
"""
Token Usage Tracker for Interactive Book Project
Estimates token usage and costs for Claude interactions
"""

import json
import datetime
from typing import Dict, List, Optional

class TokenTracker:
    def __init__(self):
        # Claude pricing (as of 2024 - check current rates)
        self.pricing = {
            "claude-3-5-sonnet": {
                "input": 3.00,   # per million tokens
                "output": 15.00  # per million tokens
            },
            "claude-3-opus": {
                "input": 15.00,
                "output": 75.00
            },
            "claude-3-haiku": {
                "input": 0.25,
                "output": 1.25
            }
        }
        
        self.sessions = []
        self.current_session = {
            "start_time": datetime.datetime.now().isoformat(),
            "model": "claude-3-5-sonnet",
            "interactions": [],
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "estimated_cost": 0.0
        }
    
    def estimate_tokens(self, text: str) -> int:
        """Rough estimation: ~4 characters per token for English, ~2 for Chinese"""
        # Count Chinese characters (higher token density)
        chinese_chars = sum(1 for char in text if '\u4e00' <= char <= '\u9fff')
        english_chars = len(text) - chinese_chars
        
        # Rough estimates
        estimated_tokens = (chinese_chars * 2) + (english_chars * 0.25)
        return int(estimated_tokens)
    
    def log_interaction(self, 
                       user_input: str, 
                       assistant_output: str, 
                       interaction_type: str = "general"):
        """Log a single interaction"""
        input_tokens = self.estimate_tokens(user_input)
        output_tokens = self.estimate_tokens(assistant_output)
        
        interaction = {
            "timestamp": datetime.datetime.now().isoformat(),
            "type": interaction_type,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "user_input_preview": user_input[:100] + "..." if len(user_input) > 100 else user_input,
            "assistant_output_preview": assistant_output[:100] + "..." if len(assistant_output) > 100 else assistant_output
        }
        
        self.current_session["interactions"].append(interaction)
        self.current_session["total_input_tokens"] += input_tokens
        self.current_session["total_output_tokens"] += output_tokens
        
        # Calculate cost
        model = self.current_session["model"]
        if model in self.pricing:
            input_cost = (input_tokens / 1_000_000) * self.pricing[model]["input"]
            output_cost = (output_tokens / 1_000_000) * self.pricing[model]["output"]
            interaction_cost = input_cost + output_cost
            self.current_session["estimated_cost"] += interaction_cost
    
    def end_session(self):
        """End current session and start new one"""
        self.current_session["end_time"] = datetime.datetime.now().isoformat()
        self.sessions.append(self.current_session.copy())
        
        # Start new session
        self.current_session = {
            "start_time": datetime.datetime.now().isoformat(),
            "model": self.current_session["model"],
            "interactions": [],
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "estimated_cost": 0.0
        }
    
    def get_session_summary(self) -> Dict:
        """Get current session summary"""
        return {
            "total_input_tokens": self.current_session["total_input_tokens"],
            "total_output_tokens": self.current_session["total_output_tokens"],
            "total_tokens": self.current_session["total_input_tokens"] + self.current_session["total_output_tokens"],
            "estimated_cost": round(self.current_session["estimated_cost"], 4),
            "interactions_count": len(self.current_session["interactions"]),
            "model": self.current_session["model"]
        }
    
    def get_project_summary(self) -> Dict:
        """Get total project summary"""
        total_input = sum(session["total_input_tokens"] for session in self.sessions) + self.current_session["total_input_tokens"]
        total_output = sum(session["total_output_tokens"] for session in self.sessions) + self.current_session["total_output_tokens"]
        total_cost = sum(session["estimated_cost"] for session in self.sessions) + self.current_session["estimated_cost"]
        
        return {
            "total_sessions": len(self.sessions) + 1,
            "total_input_tokens": total_input,
            "total_output_tokens": total_output,
            "total_tokens": total_input + total_output,
            "estimated_total_cost": round(total_cost, 4),
            "average_cost_per_session": round(total_cost / (len(self.sessions) + 1), 4) if self.sessions or self.current_session["interactions"] else 0
        }
    
    def save_to_file(self, filename: str = "token_usage.json"):
        """Save tracking data to JSON file"""
        data = {
            "sessions": self.sessions,
            "current_session": self.current_session,
            "project_summary": self.get_project_summary()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def load_from_file(self, filename: str = "token_usage.json"):
        """Load tracking data from JSON file"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.sessions = data.get("sessions", [])
                self.current_session = data.get("current_session", self.current_session)
        except FileNotFoundError:
            print(f"No existing tracking file found at {filename}")

# Example usage for the book project
def track_book_project():
    """Example tracking for the interactive book project"""
    tracker = TokenTracker()
    
    # Simulate some interactions from our book project
    interactions = [
        ("create interactive book project", "Created index.html, script.js, styles.css with basic structure", "file_creation"),
        ("add Chinese book content", "Updated data.json with complete Chinese book structure", "content_creation"),
        ("implement mind map view", "Added jsMind library and mind map functionality", "feature_implementation"),
        ("debug expand/collapse", "Fixed CSS and JavaScript for chapter toggling", "debugging"),
        ("add search functionality", "Implemented real-time chapter search", "feature_implementation")
    ]
    
    for user_input, assistant_output, interaction_type in interactions:
        tracker.log_interaction(user_input, assistant_output, interaction_type)
    
    # Print summaries
    print("=== Current Session Summary ===")
    session_summary = tracker.get_session_summary()
    for key, value in session_summary.items():
        print(f"{key}: {value}")
    
    print("\n=== Project Summary ===")
    project_summary = tracker.get_project_summary()
    for key, value in project_summary.items():
        print(f"{key}: {value}")
    
    # Save to file
    tracker.save_to_file()
    print(f"\nData saved to token_usage.json")

# Simple logging function for manual use
def log_claude_call(user_input: str, assistant_output: str, tokens_estimate: int = None):
    """Simple function to log Claude calls to JSON file"""
    if tokens_estimate is None:
        tracker = TokenTracker()
        tokens_estimate = tracker.estimate_tokens(user_input + assistant_output)
    
    log_entry = {
        'timestamp': datetime.datetime.now().isoformat(),
        'user_input': user_input[:200] + "..." if len(user_input) > 200 else user_input,
        'assistant_output': assistant_output[:200] + "..." if len(assistant_output) > 200 else assistant_output,
        'estimated_tokens': tokens_estimate,
        'estimated_cost': (tokens_estimate / 1000000) * 15.0  # Rough estimate
    }
    
    with open('claude_log.json', 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

# Example usage - you can call this manually
import json
with open('claude_log.json', 'a') as f:  # Assume you log calls
    f.write(json.dumps({'call': 'example', 'tokens': 100}) + '\n')  # Placeholder

if __name__ == "__main__":
    track_book_project()