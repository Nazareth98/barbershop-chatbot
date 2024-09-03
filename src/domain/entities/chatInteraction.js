import WwebjsService from "../../services/wwebjsService.js";
import InteractionUseCase from "../useCases/interactionUseCase.js";

export default class ChatInteraction {
  constructor(userData) {
    const { chatId, keyword, groupId, groupName, name, phoneNumber } = userData;

    this.chatId = chatId;
    this.groupId = groupId ? groupId : null;
    this.groupName = groupName ? groupName : null;
    this.name = name;
    this.phoneNumber = phoneNumber;
    this.selectedTime = [];
    this.selectedDay = null;
    this.selectedProduct = null;
    this.selectedBarber = null;
    this.selectedEvent = null;
    this.pendingEvents = [];
    this.currentStep = "selectBarber";
    this.lastMessageSent = null;
    this.lastMessageReceived = keyword;
    this.numberOfErrors = 0;
    this.eventsVerified = false;
  }

  async increaseNumberOfErros() {
    this.numberOfErrors++;
    if (this.numberOfErrors >= 3) {
      const chatId = this.chatId;
      const answer =
        "Essa conversa está sendo encerrada por excesso de tentativas inválidas";
      InteractionUseCase.closeChatInteraction({ chatId });
      await WwebjsService.sendMessage(chatId, answer);
    }
  }

  updateEventsVerified(boolean) {
    this.eventsVerified = boolean;
  }

  updateSelectedEvent(event) {
    this.selectedEvent = event;
  }

  updateLastMessageSent(answer) {
    this.lastMessageSent = answer;
  }

  updateLastMessageReceived(keyword) {
    this.lastMessageReceived = keyword;
  }

  updateSelectedTime(time) {
    this.selectedTime.push(time);
  }

  updateSelectedProduct(service) {
    this.selectedProduct = service;
  }

  updateLastMessageReceived(lastMessage) {
    this.lastMessageReceived = lastMessage;
  }

  updateCurrentStep(step) {
    this.currentStep = step;
  }

  updateSelectedBarber(barber) {
    this.selectedBarber = barber;
  }

  updatePendingEvents(event, index) {
    event.id = index + 1;
    this.pendingEvents.push(event);
  }

  updateSelectedDay(day) {
    this.selectedDay = day;
  }
}
