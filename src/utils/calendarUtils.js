import CalendarService from "../services/calendarService.js";

export default class CalendarUtils {
  static filterByDayOfMonth(chatInteraction, events) {
    const { selectedDay, selectedProduct } = chatInteraction;
    const { dayOfMonth } = selectedDay;
    const { eventsToDo } = selectedProduct;
    const currentTime = new Date();
    let eventsOfTheDay = [];

    for (let i = 0; i < events.length; i++) {
      let eventTime = new Date(events[i].date);
      eventTime.setMinutes(eventTime.getMinutes() - 15);
      let eventToAdd = false;

      if (
        events[i].summary === "Livre" &&
        events[i].date.slice(8, 10) === dayOfMonth.toString() &&
        eventTime.getTime() > currentTime.getTime()
      ) {
        // Se eventsToDo for 1, apenas verifique o próprio evento
        if (eventsToDo === 1) {
          eventToAdd = true;
        } else {
          // Caso contrário, verifique os eventos consecutivos
          for (let j = 1; j < eventsToDo; j++) {
            const nextEventIndex = i + j;
            if (
              events[nextEventIndex] &&
              events[nextEventIndex].summary === "Livre" &&
              events[nextEventIndex].date.slice(8, 10) ===
                dayOfMonth.toString() &&
              eventTime.getTime() > currentTime.getTime()
            ) {
              // Todos os eventos consecutivos estão livres
              eventToAdd = true;
            } else {
              // Pelo menos um evento consecutivo não está livre
              eventToAdd = false;
              break;
            }
          }
        }
      }
      console.log("DEBUG: eventToAdd", eventToAdd);
      if (eventToAdd) eventsOfTheDay.push(events[i]);
    }

    return eventsOfTheDay;
  }

  static formatEvent(event) {
    const formattedEvent = {
      eventId: event.id,
      date: event.start.dateTime,
      summary: event.summary,
      description: event.description,
    };

    return formattedEvent;
  }

  static async getEventsBySelectedDay(chatInteraction) {
    const { selectedBarber } = chatInteraction;
    const { calendarId } = selectedBarber;
    try {
      const events = await CalendarService.getEvents(calendarId);
      console.log("DEBUG: eventos antes do filtro", events);
      const filteredEvents = CalendarUtils.filterByDayOfMonth(
        chatInteraction,
        events
      );
      console.log("DEBUG: eventos depois do filtro", filteredEvents);

      filteredEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

      filteredEvents.forEach((event, index) => {
        event.id = index + 1;
      });

      return filteredEvents;
    } catch (error) {
      console.log(error);
      throw new Error("Ocorreu um erro ao bsucar eventos do dia.");
    }
  }
}

// if (
//   events[i].summary === "Livre" &&
//   events[i - 1 + eventsToDo].summary === "Livre" &&
//   events[i].date.slice(8, 10) === dayOfMonth.toString() &&
//   events[i - 1 + eventsToDo].date.slice(8, 10) === dayOfMonth.toString() &&
//   eventTime.getTime() > currentTime.getTime()
// ) {
//   eventsOfTheDay.push(events[i]);
// }
