import client from "../configs/wwebjs.js";

export default class WwebjsService {
  static async sendMessage(chatId, answer) {
    try {
      await client.sendMessage(chatId, answer);
      console.log({
        message: "Mensagem enviada com sucesso!",
        answer: answer,
        chatId: chatId,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao enviar mensagem.");
    }
  }
}
