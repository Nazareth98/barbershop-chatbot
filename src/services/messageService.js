import InteractionUseCase from "../domain/useCases/interactionUseCase.js";
import MessageUseCase from "../domain/useCases/messageUseCase.js";
import barbers from "../repositories/barbers.js";
import MessageUtils from "../utils/messageUtils.js";
import CalendarService from "./calendarService.js";
import StepService from "./stepService.js";
import WwebjsService from "./wwebjsService.js";

export default class MessageService {
  static async processMessage(message) {
    try {
      // Formata usuário
      const userData = await MessageUtils.formatUser(message);
      // Cria ou seleciona Interação
      const chatInteraction =
        InteractionUseCase.checkAndCreateChatInteraction(userData);
      // Atualiza última mensagem recebida
      chatInteraction.updateLastMessageReceived(userData.keyword);
      // Verifica se existe evento pendente
      const checkResult = await CalendarService.checkHasPendingEvents(
        chatInteraction
      );
      // Se existe, adiciona a interação e encaminha para o passo correspondente
      if (checkResult.length > 0 && chatInteraction.eventsVerified === false) {
        chatInteraction.updateCurrentStep("processPendingEvent");
        checkResult.forEach((event, index) =>
          chatInteraction.updatePendingEvents(event, index)
        );
      }
      if (userData.keyword === "0")
        chatInteraction.updateCurrentStep("selectBarber");
      // Seleciona o método a ser executado
      const currentMethod = `${chatInteraction.currentStep}`;
      // Executa o método
      const { answer, chatId } = await StepService[currentMethod](
        chatInteraction
      );
      // Atualiza última mensagem enviada
      chatInteraction.updateLastMessageSent(answer);
      // console.log("DEBUG: chatInteraction -> ", chatInteraction);
      // Retorna resposta
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async confirmationMessageToBarber(chatInteraction) {
    const { name, selectedTime, selectedProduct, selectedBarber, phoneNumber } =
      chatInteraction;
    try {
      let date = MessageUtils.formatLongDate(selectedTime[0].date);
      let chatId = selectedBarber.chatId;
      let answer = `✅ - *Agendamento confirmado*\n\nCliente: *${name}*\nData: *${date}*\nServiço: *${selectedProduct.name}*\nhttps://wa.me/+${phoneNumber}`;
      await WwebjsService.sendMessage(chatId, answer);
      return true;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async contactMessageToBarber(chatInteraction) {
    const { name, phoneNumber, selectedBarber } = chatInteraction;
    try {
      let chatId = selectedBarber ? selectedBarber.chatId : barbers[0].chatId;
      let answer = `⚠️ - *Solicitação de contato*\n\nO cliente ${name} precisa falar com você! Entre em contato através do link abaixo:\nhttps://wa.me/+${phoneNumber}`;
      await WwebjsService.sendMessage(chatId, answer);
      return true;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async cancelMessageToBarber(chatInteraction, eventToCancel) {
    const { selectedBarber } = chatInteraction;
    try {
      let date = MessageUtils.formatLongDate(eventToCancel.date);
      let chatId = selectedBarber ? selectedBarber.chatId : barbers[1].chatId;
      let answer = `❌ - *Agendamento cancelado*\n\nAgenda liberada para ${date}`;
      await WwebjsService.sendMessage(chatId, answer);
      return true;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async noAvailableTimesMessage(chatInteraction) {
    const { chatId } = chatInteraction;
    try {
      let answer =
        "Infelizmente não temos horários disponíveis no dia selecionado, peço que selecione outra data!";
      await WwebjsService.sendMessage(chatId, answer);
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }
}
