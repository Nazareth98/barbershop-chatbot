import { chat } from "googleapis/build/src/apis/chat/index.js";
import InteractionUseCase from "../domain/useCases/interactionUseCase.js";
import MessageUseCase from "../domain/useCases/messageUseCase.js";
import barbers from "../repositories/barbers.js";
import CalendarUtils from "../utils/calendarUtils.js";
import MessageUtils from "../utils/messageUtils.js";
import CalendarService from "./calendarService.js";
import MessageService from "./messageService.js";
import WwebjsService from "./wwebjsService.js";

export default class StepService {
  static async stepExeptions(chatInteraction, errorType) {
    const { chatId, numberOfErrors } = chatInteraction;
    let answer = "";
    chatInteraction.increaseNumberOfErros();
    switch (errorType) {
      case "invalidOption":
        answer = "⚠️ Opção inválida, tente novamente.";
        break;
      default:
        answer = "⚠️ Não consegui entender.";
        break;
    }
    numberOfErrors >= 2
      ? null
      : await WwebjsService.sendMessage(chatId, answer);
  }

  static async cancelPendingEvent(chatInteraction) {
    const { lastMessageSent, numberOfErrors, pendingEvents } = chatInteraction;
    let chatId = chatInteraction.chatId;
    let answer = "";
    try {
      const correspondingSelection = MessageUseCase.getCorrespondingSelection(
        pendingEvents,
        chatInteraction
      );

      if (correspondingSelection) {
        await CalendarService.cancelEvent(correspondingSelection);
        await MessageService.cancelMessageToBarber(
          chatInteraction,
          correspondingSelection
        );
        answer =
          "Tudo certo, cancelamos o agendamento! Nos mande uma mensagem se mudar de ideia, até breve 👋";
        InteractionUseCase.closeChatInteraction(chatInteraction);
      } else {
        answer = numberOfErrors >= 2 ? "" : lastMessageSent;
      }

      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao lidar com agendamentos pendentes.");
    }
  }

  static async selectPedingEventOption(chatInteraction) {
    const {
      pendingEvents,
      lastMessageSent,
      lastMessageReceived,
      numberOfErrors,
    } = chatInteraction;
    let answer = "";
    let chatId = chatInteraction.chatId;
    try {
      switch (lastMessageReceived) {
        case "1":
          const result = await StepService.selectBarber(chatInteraction);
          answer = result.answer;
          break;
        case "2":
          if (pendingEvents.length > 1) {
            answer = `📒 Qual agendamento deseja cancelar?\n\n`;
            pendingEvents.forEach(
              (event) =>
                (answer += `*[${event.id}]* - ${MessageUtils.formatLongDate(
                  event.date
                )}\n`)
            );
            chatInteraction.updateCurrentStep("cancelPendingEvent");
          } else {
            await CalendarService.cancelEvent(pendingEvents[0]);
            await MessageService.cancelMessageToBarber(
              chatInteraction,
              pendingEvents[0]
            );
            answer =
              "Tudo certo, cancelamos o agendamento! Nos mande uma mensagem se mudar de ideia, até breve 👋";
            InteractionUseCase.closeChatInteraction(chatInteraction);
          }
          break;
        case "3":
          await MessageService.contactMessageToBarber(chatInteraction);
          InteractionUseCase.closeChatInteraction(chatInteraction);
          answer =
            "Já avisamos um de nossos barbeiros, logo ele entra em contato com você!";
          break;
        default:
          await StepService.stepExeptions(chatInteraction, "invalidOption");
          answer = numberOfErrors >= 2 ? "" : lastMessageSent;
          return { answer, chatId };
      }

      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao lidar com agendamentos pendentes.");
    }
  }

  static async processPendingEvent(chatInteraction) {
    const { chatId, name, pendingEvents } = chatInteraction;
    try {
      let answer = `⁉️ - Olá ${name}! Tudo certo? Vi aqui que você possui ${
        pendingEvents.length > 1
          ? "alguns agendamentos pendentes"
          : "um agendamento pendente"
      }. Qual opção melhor te atenderia nesse momento?\n\n*[1]* Preciso fazer mais um agendamento\n*[2]* ${
        pendingEvents.length > 1
          ? "Preciso cancelar um de meus agendamentos"
          : "Preciso cancelar meu agendamento"
      }\n*[3]* Preciso falar com um barbeiro`;
      chatInteraction.updateEventsVerified(true);
      chatInteraction.updateCurrentStep("selectPedingEventOption");
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao lidar com agendamentos pendentes.");
    }
  }

  static async selectBarber(chatInteraction) {
    const { chatId, name } = chatInteraction;
    let answer = "";
    let nextStep;
    try {
      answer = `🙎‍♂️ - Olá ${name}! Para agendar um atendimento escolha um de nossos barbeiros:\n\n`;
      barbers.forEach(
        (barber) => (answer += `*[${barber.id}]* - ${barber.name}\n`)
      );
      nextStep = "selectProduct";
      nextStep ? chatInteraction.updateCurrentStep(nextStep) : null;
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao executar seleção de barbeiro.");
    }
  }

  static async selectProduct(chatInteraction) {
    const { chatId, lastMessageSent, numberOfErrors, selectedBarber } =
      chatInteraction;
    let answer = "";
    let nextStep;
    try {
      const correspondingSelection = MessageUseCase.getCorrespondingSelection(
        barbers,
        chatInteraction
      );

      if (correspondingSelection) {
        chatInteraction.updateSelectedBarber(correspondingSelection);
        answer = `✂️ - Agora que você escolheu o barbeiro *${correspondingSelection.name}*, selecione um dos seguintes serviços:\n\n`;
        correspondingSelection.products.forEach(
          (product) => (answer += `*[${product.id}]* - ${product.name}\n`)
        );
        answer += `\n*[00]* -  Serviços por Orçamento\n_*Ex:* Platinado, Luzes, Shaver..._`;
        answer += `\n*[0]* - Para voltar para o menu principal`;
        nextStep = "selectDay";
      } else {
        answer = numberOfErrors >= 2 ? "" : lastMessageSent;
      }
      nextStep ? chatInteraction.updateCurrentStep(nextStep) : null;
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao executar seleção de produto.");
    }
  }

  static async selectDay(chatInteraction) {
    const {
      lastMessageReceived,
      lastMessageSent,
      numberOfErrors,
      selectedBarber,
    } = chatInteraction;
    const { products } = selectedBarber;
    let chatId = chatInteraction.chatId;
    let answer = "";
    let nextStep;
    try {
      if (lastMessageReceived === "00") {
        await MessageService.contactMessageToBarber(chatInteraction);
        InteractionUseCase.closeChatInteraction(chatInteraction);
        answer =
          "Já avisamos um de nossos barbeiros, logo ele entra em contato com você!";
      } else {
        const correspondingSelection = MessageUseCase.getCorrespondingSelection(
          products,
          chatInteraction
        );
        if (correspondingSelection) {
          chatInteraction.updateSelectedProduct(correspondingSelection);
          answer = `🗓️ - Certo, preciso que selecione o dia de prefrência:\n\n`;
          const nextDays = await MessageUtils.getNextDays(6);
          nextDays.forEach(
            (day) =>
              (answer += `*[${day.id}]* - ${day.dayOfWeek}, dia ${day.dayOfMonth}\n`)
          );
          answer += `\n*[0]* - Para voltar para o menu principal`;
          nextStep = "selectTime";
        } else {
          answer = numberOfErrors >= 2 ? "" : lastMessageSent;
        }
      }

      nextStep ? chatInteraction.updateCurrentStep(nextStep) : null;
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao executar seleção de dia.");
    }
  }

  static async selectTime(chatInteraction) {
    const { chatId, lastMessageSent, numberOfErrors } = chatInteraction;
    let answer = "";
    let nextStep;
    try {
      const nextDays = await MessageUtils.getNextDays(25);
      const correspondingSelection = MessageUseCase.getCorrespondingSelection(
        nextDays,
        chatInteraction
      );
      if (correspondingSelection) {
        chatInteraction.updateSelectedDay(correspondingSelection);
        const nextEvents = await CalendarUtils.getEventsBySelectedDay(
          chatInteraction
        );

        if (nextEvents.length === 0) {
          chatInteraction.updateSelectedDay(null);
          await MessageService.noAvailableTimesMessage(chatInteraction);
          answer = lastMessageSent;
          return { answer, chatId };
        }

        answer = `🕐 - Para *${correspondingSelection.dayOfWeek}* dia *${correspondingSelection.dayOfMonth}*, escolha um dos próximos horários disponíves:\n\n`;
        nextEvents.forEach(
          (event) =>
            (answer += `*[${event.id}]* - ${MessageUtils.formatHours(
              event.date
            )}\n`)
        );
        answer += `\n*[0]* - Para voltar para o menu principal`;
        nextStep = "confirmEvent";
      } else {
        answer = numberOfErrors >= 2 ? "" : lastMessageSent;
      }

      nextStep ? chatInteraction.updateCurrentStep(nextStep) : null;
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao executar seleção de horário.");
    }
  }

  static async confirmEvent(chatInteraction) {
    const {
      lastMessageSent,
      chatId,
      selectedProduct,
      selectedBarber,
      numberOfErrors,
    } = chatInteraction;
    let answer = "";
    let nextStep;
    try {
      const nextEvents = await CalendarUtils.getEventsBySelectedDay(
        chatInteraction
      );

      const correspondingSelection = MessageUseCase.getCorrespondingSelection(
        nextEvents,
        chatInteraction
      );

      if (correspondingSelection) {
        chatInteraction.updateSelectedTime(correspondingSelection);
        // if (selectedProduct.eventsToDo > 0) {
        //   const selectedAdditionalEvent = nextEvents.filter(
        //     (event) => event.id === correspondingSelection.id + 1
        //   );
        //   console.log(
        //     "DEBUG: selectedAdditionalEvent ->",
        //     selectedAdditionalEvent
        //   );
        //   chatInteraction.updateSelectedTime(selectedAdditionalEvent[0]);
        // }
        answer = `⁉️ - Ok! Para confirmar o agendamento do serviço *${
          selectedProduct.name
        }*, com o barbeiro *${
          selectedBarber.name
        }* para *${MessageUtils.formatLongDate(
          correspondingSelection.date
        )}* digite *1*:\n\n*[1]* - Confirmar agendamento!\n*[2]* - Cancelar agendamento!`;
        nextStep = "checkoutInteraction";
      } else {
        answer = numberOfErrors >= 2 ? "" : lastMessageSent;
      }

      nextStep ? chatInteraction.updateCurrentStep(nextStep) : null;
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error(
        "Ocorreu um erro ao executar confirmação de agendamento."
      );
    }
  }

  static async checkoutInteraction(chatInteraction) {
    const { chatId, lastMessageReceived, lastMessageSent, numberOfErrors } =
      chatInteraction;
    let answer = "";
    try {
      switch (lastMessageReceived) {
        case "1":
          await CalendarService.confirmEvent(chatInteraction);
          await MessageService.confirmationMessageToBarber(chatInteraction);
          answer =
            "✅ - Agendamento realizado com sucesso!\n\nSe precisar agendar outro horário, cancelar ou relembrar pra quando é seu agendamento, nos mande uma mensagem.";
          break;
        case "2":
          answer =
            "Tudo certo, cancelamos o agendamento! Nos mande uma mensagem se mudar de ideia, até breve 👋";
          break;
        default:
          StepService.stepExeptions(chatInteraction, "invalidOption");
          answer = numberOfErrors >= 2 ? "" : lastMessageSent;
          return { answer, chatId };
      }

      InteractionUseCase.closeChatInteraction(chatInteraction);
      return { answer, chatId };
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao executar enderrar interação.");
    }
  }
}
