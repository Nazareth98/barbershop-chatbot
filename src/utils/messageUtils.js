import client from "../configs/wwebjs.js";

export default class MessageUtils {
  static async formatUser(message) {
    const chatId = message.author || message.from;
    let phoneNumber = chatId.slice(0, -5);

    if (!chatId.startsWith("595")) {
      phoneNumber.slice(2, phoneNumber.length);
    }

    const newUser = {
      keyword: message.body.toLowerCase().trim(),
      chatId: chatId,
      groupId: message.from.includes("@g.us") ? message.from : null,
      groupName: null,
      name: message._data.notifyName || " ",
      phoneNumber: phoneNumber,
    };

    if (newUser.groupId) {
      const groups = await client.getChats();

      const currentGroup = groups.find((group) => {
        return group.id._serialized === newUser.groupId;
      });
      newUser.groupName = currentGroup.name;
    }

    return newUser;
  }

  static formatLongDate(date) {
    const data = new Date(date);
    const diaSemana = { weekday: "long" };
    const mes = data.getMonth() + 1;
    const dia = data.getDate(); // Criar objeto de data a partir do formato ISO 8601
    const hora = data.getHours(); // Obter a hora da data
    const minuto = data.getMinutes(); // Obter o minuto da data

    // Formatar a hora e o minuto com dois dígitos usando o método padStart()
    const diaSemanaFormatada = data.toLocaleString("pt-BR", diaSemana);
    const mesFormatada = mes.toString().padStart(2, "0");
    const diaFormatada = dia.toString().padStart(2, "0");
    const horaFormatada = hora.toString().padStart(2, "0");
    const minutoFormatado = minuto.toString().padStart(2, "0");

    // Concatenar a hora e o minuto formatados separados por ':' e retornar o resultado
    return `${diaSemanaFormatada} dia ${diaFormatada}, às ${horaFormatada}:${minutoFormatado}`;
  }

  static formatDayOfWeek(day) {
    switch (day) {
      case "0":
        return "Domingo";
      case "1":
        return "Segunda-feira";
      case "2":
        return "Terça-feira";
      case "3":
        return "Quarta-feira";
      case "4":
        return "Quinta-feira";
      case "5":
        return "Sexta-feira";
      case "6":
        return "Sábado";
      default:
        return "";
    }
  }

  static async getNextDays(interval) {
    let nextDays = [];
    let currentDate = new Date();

    for (let i = 0; i < interval; i++) {
      let nextDay = new Date();
      nextDay.setDate(currentDate.getDate() + i);

      let dayOfMonth = nextDay.getDate().toLocaleString(undefined, {
        minimumIntegerDigits: 2,
      });
      let dayOfWeek = nextDay.getDay();

      if (dayOfWeek !== 0) {
        let formatedDate = nextDay.toISOString();
        let formattedDayOfWeek = MessageUtils.formatDayOfWeek(
          dayOfWeek.toString()
        );

        nextDays.push({
          id: i + 1,
          date: formatedDate,
          dayOfWeek: formattedDayOfWeek,
          dayOfMonth: dayOfMonth,
        });
      }
    }

    return nextDays;
  }

  static formatHours(hour) {
    const data = new Date(hour); // Criar objeto de data a partir do formato ISO 8601
    const hora = data.getHours(); // Obter a hora da data
    const minuto = data.getMinutes(); // Obter o minuto da data

    // Formatar a hora e o minuto com dois dígitos usando o método padStart()
    const horaFormatada = hora.toString().padStart(2, "0");
    const minutoFormatado = minuto.toString().padStart(2, "0");

    // Concatenar a hora e o minuto formatados separados por ':' e retornar o resultado
    return `${horaFormatada}:${minutoFormatado}`;
  }
}
