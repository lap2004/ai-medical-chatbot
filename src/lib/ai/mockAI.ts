
import { Message } from '../../types/chat';

const responses = [
  "I understand you're experiencing some discomfort. To help me provide better guidance, could you tell me more about the duration of these symptoms?",
  "Thank you for sharing that. It's important to monitor these signs closely. Based on your description, it could be related to several common health issues.",
  "That sounds concerning. Have you checked your temperature recently?",
  "For symptoms like these, rest and hydration are key. However, if the pain persists for more than 48 hours, I recommend seeing a specialist."
];

const triageDatabase = {
  "chest pain": {
    questions: ["Are you experiencing shortness of breath?", "Does the pain radiate to your arm or neck?"],
    suggestedAnswers: ["No, just tightness", "Yes, slightly short of breath", "It's moving to my shoulder"]
  },
  "fever": {
    questions: ["Is it accompanied by a dry cough?", "Have you noticed any skin rashes?"],
    suggestedAnswers: ["Just fever", "Yes, coughing too", "No other symptoms"]
  }
};

export const getAIResponse = async (userMessage: string): Promise<Partial<Message>> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerMsg = userMessage.toLowerCase();
  let triage = undefined;

  // Check for triage triggers
  if (lowerMsg.includes('chest') || lowerMsg.includes('pain')) {
    triage = triageDatabase["chest pain"];
  } else if (lowerMsg.includes('fever') || lowerMsg.includes('heat')) {
    triage = triageDatabase["fever"];
  }

  const content = responses[Math.floor(Math.random() * responses.length)];

  return {
    content,
    triage: triage ? { ...triage } : undefined
  };
};
