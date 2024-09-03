import MessageService from "../services/messageService.js";
import WwebjsService from "../services/wwebjsService.js";
import MessageUseCase from "../domain/useCases/messageUseCase.js";

export default class MessageController {
  static async processMessage(message) {
    if (!MessageUseCase.validateMessage(message)) return false;
    try {
      const { chatId, answer } = await MessageService.processMessage(message);
      await WwebjsService.sendMessage(chatId, answer);
    } catch (error) {
      console.log(error.message);
    }
  }
}
