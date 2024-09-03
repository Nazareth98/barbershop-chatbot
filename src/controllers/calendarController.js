import CalendarService from "../services/calendarService.js";

export default class CalendarController {
  static async getCallback(req, res) {
    const code = req.query.code;
    try {
      const token = await CalendarService.getCallback(code);
      console.log("Autenticação realizada!");
      return res.status(200).json({
        message: "Autorização concluída. Você pode fechar esta página.",
        token: token,
      });
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  static async confirmEvent(req, res) {
    const queryString = req.query;
    try {
      await CalendarService.confirmEvent(queryString);
      return res
        .status(200)
        .json({ message: "Evento confirmado com sucesso!" });
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  static async getEvents(req, res) {
    const queryString = req.query;
    try {
      const result = await CalendarService.getEvents(queryString);
      return res
        .status(200)
        .json({ message: "Consulta realizada com sucesso!", result: result });
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  static async cancelEvent(req, res) {
    const queryString = req.query;
    try {
      const result = await CalendarService.cancelEvent(queryString);
      return res
        .status(204)
        .json({ message: "Evento cancelado com sucesso!", result: result });
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }
}
