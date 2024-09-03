import {
  getChatInteractionRepository,
  setChatInteractionRepository,
} from "../../repositories/chatInteractionRepository.js";
import ChatInteraction from "../entities/chatInteraction.js";

export default class InteractionUseCase {
  static checkAndCreateChatInteraction(userData) {
    const chatInteractionRepository = getChatInteractionRepository();
    try {
      const existingInteraction = chatInteractionRepository.filter(
        (interaction) => interaction.chatId === userData.chatId
      );
      if (existingInteraction.length > 0) return existingInteraction[0];
      const newInteraction = new ChatInteraction(userData);
      const updatedRepository = [...chatInteractionRepository, newInteraction];
      setChatInteractionRepository(updatedRepository);
      console.log("DEBUG: nova interação criada");
      return newInteraction;
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao criar Interação.", error);
    }
  }

  static closeChatInteraction(chatInteraction) {
    const chatInteractionRepository = getChatInteractionRepository();
    try {
      const updatedRepository = chatInteractionRepository.filter(
        (interaction) => interaction.chatId !== chatInteraction.chatId
      );
      setChatInteractionRepository(updatedRepository);
      console.log("Interação encerrada com sucesso!");
      return true;
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao encerrar Interação.", error);
    }
  }

  static cleanRepository() {
    setChatInteractionRepository([]);
  }
}
