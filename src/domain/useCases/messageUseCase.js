import StepService from "../../services/stepService.js";

export default class MessageUseCase {
  static validateMessage(message) {
    if (message.isMedia) {
      console.log("Mensagem ignorada pois é uma mídia.");
      return false;
    }

    if (message.type === "sticker") {
      console.log("Mensagem ignorada pois é uma figurinha.");
      return false;
    }

    if (message.type === "video") {
      console.log("Mensagem ignorada pois é um video.");
      return false;
    }

    if (message.type === "image") {
      console.log("Mensagem ignorada pois é uma imagem.");
      return false;
    }

    if (message.type === "gif") {
      console.log("Mensagem ignorada pois é um gif.");
      return false;
    }

    if (message.type === "document") {
      console.log("Mensagem ignorada pois é um documento.");
      return false;
    }

    if (message.type === "audio") {
      console.log("Mensagem ignorada pois é um audio.");
      return false;
    }

    if (message.from.includes("status")) {
      console.log("Mensagem ignorada pois é um status.");
      return false;
    }

    // if (!message.body.toLowerCase().includes("#saldo")) {
    //   console.log("Mensagem não é '*#saldo*'.");
    //   return false;
    // }

    return true;
  }

  static getCorrespondingSelection(array, chatInteraction) {
    const { lastMessageReceived } = chatInteraction;
    try {
      const correspondingSelection = array.filter(
        (item) => item.id === Number(lastMessageReceived)
      );
      if (correspondingSelection.length < 1)
        StepService.stepExeptions(chatInteraction, "invalidOption");
      console.log("DEBUG: correspondingSelection", correspondingSelection[0]);
      return correspondingSelection[0];
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao buscar resposta correspondente.");
    }
  }
}
