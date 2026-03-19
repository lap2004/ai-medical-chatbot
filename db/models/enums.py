import enum

class MessageRole(str, enum.Enum):
    system = "system"
    user = "user"
    assistant = "assistant"

class FeedbackValue(str, enum.Enum):
    like = "like"
    dislike = "dislike"

class ReportStatus(str, enum.Enum):
    open = "open"
    reviewing = "reviewing"
    resolved = "resolved"
    rejected = "rejected"
