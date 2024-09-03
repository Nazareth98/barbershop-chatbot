import { oAuth2Client, refreshAccessToken } from "../configs/calendarAuth.js";
import { google } from "googleapis";
import CalendarUtils from "../utils/calendarUtils.js";
import barbers from "../repositories/barbers.js";

export default class CalendarService {
  static async getCallback(code) {
    try {
      const { tokens } = await oAuth2Client.getToken(code);

      // Store the refresh token for future use
      if (tokens.refresh_token) {
        console.log("DEBUG: refresh token", tokens.refresh_token);
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      }

      let accessToken = tokens.access_token;
      oAuth2Client.setCredentials(tokens);
      return accessToken;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async getEvents(calendarId) {
    try {
      if (oAuth2Client.isTokenExpiring()) {
        await refreshAccessToken();
      }
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
      const minDate = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 25);
      maxDate.setHours(23, 59, 59);

      let allEvents = [];
      let nextPageToken = null;

      do {
        const response = await calendar.events.list({
          calendarId: calendarId,
          timeMin: minDate.toISOString(),
          timeMax: maxDate.toISOString(),
          pageToken: nextPageToken,
        });

        const events = response.data.items;
        allEvents = allEvents.concat(events);

        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      const formattedEvents = allEvents.map((event, index) =>
        CalendarUtils.formatEvent(event, index)
      );

      formattedEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

      console.log("DEBUG: Eventos consultados com sucesso!");
      return formattedEvents;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async confirmEvent(chatInteraction) {
    let { name, phoneNumber, selectedBarber, selectedTime, selectedProduct } =
      chatInteraction;
    const eventsToDo = selectedProduct.eventsToDo;
    const calendarId = selectedBarber.calendarId;
    const description = `Cliente: ${name} Serviço: ${selectedProduct.name} Contato: ${phoneNumber}`;

    if (eventsToDo !== 1) {
      const events = await CalendarService.getEvents(calendarId);
      const startingEventId = selectedTime[0].eventId; // Substitua pelo eventId desejado.
      const startIndex = events.findIndex(
        (event) => event.eventId === startingEventId
      );
      if (startIndex === -1) {
        console.log("Evento não encontrado.");
      } else {
        const eventsToDoArray = events.slice(
          startIndex,
          startIndex + eventsToDo
        );
        selectedTime = eventsToDoArray;
      }
    }

    try {
      for (const time of selectedTime) {
        const eventId = time.eventId;
        if (oAuth2Client.isTokenExpiring()) {
          console.log("DEBUG: Token expirou e precisa ser atualizado...");
          const newAccessToken = await oAuth2Client.refreshAccessToken();
          if (newAccessToken) {
            oAuth2Client.setCredentials({
              access_token: newAccessToken,
              refresh_token: oAuth2Client.credentials.refresh_token,
            });
          } else {
            throw new Error("Failed to refresh access token.");
          }
        }

        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const response = await calendar.events.get({
          calendarId: calendarId,
          eventId: eventId,
        });

        const existingEvent = response.data;

        const updatedEvent = {
          ...existingEvent,
          summary: "Horário marcado",
          description: description,
          colorId: "4",
        };

        calendar.events.update({
          calendarId: calendarId,
          eventId: eventId,
          resource: updatedEvent,
        });
      }

      console.log("DEBUG: Evento confirmado com sucesso!");
      return true;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async cancelEvent(event) {
    const { calendarId, eventId } = event;
    try {
      if (oAuth2Client.isTokenExpiring()) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          oAuth2Client.setCredentials({
            access_token: newAccessToken,
            refresh_token: oAuth2Client.credentials.refresh_token,
          });
        } else {
          throw new Error("Failed to refresh access token.");
        }
      }
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
      const response = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });
      const existingEvent = response.data;

      const updatedEvent = {
        ...existingEvent,
        summary: "Livre",
        description: "Livre",
        colorId: "2",
      };

      const responseUpdate = calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: updatedEvent,
      });

      return responseUpdate;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  static async checkHasPendingEvents(chatInteraction) {
    const { phoneNumber } = chatInteraction;
    const pendingEvents = [];
    try {
      for (let i = 0; i < barbers.length; i++) {
        let { calendarId, chatId } = barbers[i];
        let events = await CalendarService.getEvents(calendarId);
        let existingEvents = events.filter(
          (event) =>
            event &&
            event.description &&
            event.description.includes(phoneNumber)
        );
        existingEvents.forEach((event, index) => {
          event.calendarId = calendarId;
          event.chatId = chatId;
          event.id = index + 1;
        });
        pendingEvents.push(...existingEvents);
      }
      return pendingEvents;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }
}
