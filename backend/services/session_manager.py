from datetime import datetime

class SessionManager:
    def __init__(self):
        # In-memory storage: {session_id: {"history": [], "created_at": datetime}}
        self.sessions = {}

    def get_session(self, session_id):
        """Retrieves a session or creates a new one if it doesn't exist."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "history": [],
                "created_at": datetime.now(),
                "metadata": {} 
            }
        return self.sessions[session_id]

    def add_message(self, session_id, role, content):
        """Adds a message to the session history."""
        session = self.get_session(session_id)
        session["history"].append({"role": role, "content": content})

    def get_history(self, session_id):
        """Returns the conversation history for a session."""
        return self.get_session(session_id)["history"]

    def clear_session(self, session_id):
        """Clears/Resets a session."""
        if session_id in self.sessions:
            del self.sessions[session_id]

# Singleton instance
session_manager = SessionManager()
